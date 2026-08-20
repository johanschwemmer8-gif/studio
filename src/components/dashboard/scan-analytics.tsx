
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart2, UserCheck, TrendingUp, Activity, Loader2, Sparkles, QrCode } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';

function AnalyticsCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) {
    return (
        <Card className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black">{value}</div>
                {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    )
}

export default function ScanAnalytics() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.retailerId || !db) return;

    setLoading(true);
    const q = query(
        collection(db, 'events'),
        where('retailerId', '==', user.retailerId),
        orderBy('timestamp', 'desc'),
        limit(1000)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(fetched);
        setLoading(false);
    }, (err) => {
        console.error("Live Stream Error:", err);
        setError("Friction in live intelligence stream.");
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.retailerId]);

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Awaiting Live Intelligence...</p>
          </div>
      );
  }

  if (error) {
      return (
          <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-lg text-center">
              <p className="text-destructive font-bold text-xs uppercase tracking-widest">{error}</p>
          </div>
      );
  }

  const sessionIds = new Set(events.map(e => e.sessionId));
  const uniqueSessions = sessionIds.size;
  const totalEvents = events.length;
  
  const sessionsByGtin: Record<string, { sessions: Set<string>, campaignId: string }> = {};
  events.forEach(event => {
      const gtin = event.gtin || 'Unknown';
      if (!sessionsByGtin[gtin]) {
          sessionsByGtin[gtin] = { sessions: new Set(), campaignId: event.campaignId || 'unassigned' };
      }
      sessionsByGtin[gtin].sessions.add(event.sessionId);
  });
  
  const topEngagedProducts = Object.entries(sessionsByGtin)
      .map(([gtin, data]) => ({ 
          gtin, 
          uniqueSessions: data.sessions.size, 
          campaignId: data.campaignId 
      }))
      .sort((a, b) => b.uniqueSessions - a.uniqueSessions)
      .slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="flex items-center gap-2 font-black text-xl uppercase tracking-tighter"><BarChart2 className="text-primary"/> Reach Intelligence</CardTitle>
                    <CardDescription>
                        Analysing shopper reach through session-anchored behavioural events.
                    </CardDescription>
                </div>
                <Badge className="bg-green-500 text-white border-none gap-1.5 animate-pulse py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    Live
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnalyticsCard 
                    title="True Reach" 
                    value={uniqueSessions.toLocaleString()} 
                    icon={UserCheck} 
                    description="Unique shopper sessions."
                />
                <AnalyticsCard 
                    title="Total Activity" 
                    value={totalEvents.toLocaleString()} 
                    icon={Activity} 
                    description="Raw behavioural nodes."
                />
                <AnalyticsCard 
                    title="Engagement Density" 
                    value={uniqueSessions > 0 ? (totalEvents / uniqueSessions).toFixed(2) : "0.00"} 
                    icon={TrendingUp} 
                    description="Avg. interactions per session."
                />
            </div>

            <div className="space-y-4">
                <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" /> 
                    Product Sentiment (Unique Sessions)
                </h3>
                <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    {topEngagedProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-muted/10">
                            <QrCode className="h-12 w-12 text-muted-foreground/20" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Waiting for your first scan</p>
                                <p className="text-[10px] text-muted-foreground italic px-8">Physical shopper interactions will appear here in real-time as they occur in-store.</p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Global Identifier (GTIN-14)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Campaign Reference</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">True Reach</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topEngagedProducts.map((p) => (
                                <TableRow key={p.gtin} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-mono text-xs font-bold text-primary">{p.gtin}</TableCell>
                                    <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20">{p.campaignId}</Badge></TableCell>
                                    <TableCell className="text-right font-black text-lg">{p.uniqueSessions}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                <p className="text-[9px] italic text-muted-foreground">
                    * Metrics update in real-time. Factual aggregation is anchored to the session identifier.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
