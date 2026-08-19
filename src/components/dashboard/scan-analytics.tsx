
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart2, UserCheck, TrendingUp, Activity, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { getScanAnalytics, type ScanAnalyticsOutput } from '@/ai/flows/scan-analytics';
import { auth } from '@/lib/firebase';


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
  const [data, setData] = useState<ScanAnalyticsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await getScanAnalytics({
                idToken,
                retailerId: 'simulated-retailer-id',
                limit: 1000,
            });
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load scan analytics.");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground">Authenticating & Aggregating...</p>
          </div>
      );
  }

  if (error || !data) {
      return (
          <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-lg text-center">
              <p className="text-destructive font-bold">{error || "Data Unavailable."}</p>
          </div>
      );
  }

  const { totalRawEvents, uniqueSessions, topEngagedProducts } = data;

  return (
    <div className="space-y-8">
      <Card className="border-primary/10">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 font-black text-xl"><BarChart2 className="text-primary"/> Intelligence Reach</CardTitle>
            <CardDescription>
                Analysing shopper reach through session-anchored behavioural events.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnalyticsCard 
                    title="Unique Engagement Sessions" 
                    value={uniqueSessions.toLocaleString()} 
                    icon={UserCheck} 
                    description="True reach (deduplicated by session)."
                />
                <AnalyticsCard 
                    title="Total Event Nodes" 
                    value={totalRawEvents.toLocaleString()} 
                    icon={Activity} 
                    description="Raw behavioural activity logs."
                />
                <AnalyticsCard 
                    title="Engagement Density" 
                    value={(totalRawEvents / (uniqueSessions || 1)).toFixed(2)} 
                    icon={TrendingUp} 
                    description="Avg. interactions per session."
                />
            </div>

            <div className="space-y-4">
                <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> 
                    Product Sentiment (Sessions per GTIN)
                </h3>
                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Global Identifier (GTIN-14)</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Campaign Reference</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">True Reach (Sessions)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topEngagedProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        Initializing Intelligence stream...
                                    </TableCell>
                                </TableRow>
                            ) : topEngagedProducts.map((p) => (
                            <TableRow key={p.gtin}>
                                <TableCell className="font-mono text-xs font-bold">{p.gtin}</TableCell>
                                <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20">{p.campaignId}</Badge></TableCell>
                                <TableCell className="text-right font-black text-primary text-lg">{p.uniqueSessions}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <p className="text-[9px] italic text-muted-foreground">
                    * Metrics are calculated based on unique shopper sessions to ensure high-fidelity intent mapping.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
