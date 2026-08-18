'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  BrainCircuit, MessageSquare, 
  Activity, Download,
  CheckCircle2, Info, ShieldCheck, HelpCircle, Sparkles,
  ChevronDown, ArrowRight, ListChecks
} from 'lucide-react';
import { getDecisionJourneyIntelligence } from '@/ai/flows/decision-journey-intelligence';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import type { DecisionJourneyOutput } from '@/lib/schemas/decision-journey';

const FunnelStage = ({ 
  label, 
  value, 
  rate, 
  isLast 
}: { 
  label: string, 
  value: number, 
  rate: number, 
  isLast?: boolean 
}) => (
  <div className="flex flex-col items-center flex-1 min-w-[120px]">
    <div className="relative group w-full flex flex-col items-center">
      <div className={cn(
        "h-16 w-full rounded-xl flex flex-col items-center justify-center p-2 border-2 transition-all group-hover:scale-105",
        rate > 0 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
      )}>
        <p className="text-[9px] font-black uppercase tracking-tighter opacity-70">{label}</p>
        <p className="text-lg font-black">{value.toLocaleString()}</p>
      </div>
      {!isLast && (
        <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
          <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
        </div>
      )}
      {rate < 100 && rate > 0 && (
         <p className="mt-1 text-[10px] font-bold text-primary">{rate}% Reach</p>
      )}
    </div>
  </div>
);

export default function DecisionIntelligencePage() {
    const [data, setData] = useState<DecisionJourneyOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        getDecisionJourneyIntelligence('simulated-retailer-id')
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast({ title: "Intelligence Stream Friction", description: "Aggregator delayed. Retrying connection...", variant: "destructive" });
            });
    }, [toast]);

    const handleExport = () => {
        toast({
            title: "Exporting Journey Report...",
            description: "A detailed PDF of auditable decision stages is being generated.",
        });
    };

    if (loading || !data) {
        return (
            <div className="space-y-8 p-4">
                <Skeleton className="h-12 w-1/4" />
                <Skeleton className="h-48 w-full" />
                <div className="grid grid-cols-3 gap-8">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2">
                        <BrainCircuit className="text-primary h-8 w-8" />
                        Shopper Decision Intelligence
                    </h1>
                    <p className="text-muted-foreground max-w-3xl">
                        Factual decision-journey mapping derived from explicit shopper signals and verified transactional outcomes.
                    </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1.5 font-black uppercase text-[10px]">
                      {data.metadata.dataStatus}
                  </Badge>
                  <Button onClick={handleExport} className="gap-2 font-bold uppercase text-[10px] tracking-widest">
                      <Download className="h-4 w-4" /> Export Report
                  </Button>
                </div>
            </div>

            <Separator />

            {/* Funnel Visualization */}
            <Card className="border-primary/10 bg-muted/10 overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" /> Shopper Decision Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap lg:flex-nowrap gap-4 justify-between">
                  {data.funnel.map((stage, i) => (
                    <FunnelStage 
                      key={stage.stage} 
                      label={stage.stage} 
                      value={stage.uniqueSessions} 
                      rate={stage.rate}
                      isLast={i === data.funnel.length - 1}
                    />
                  ))}
                </div>
                <div className="mt-8 grid sm:grid-cols-3 gap-4 border-t pt-6">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">True Reach</p>
                    <p className="text-xl font-black">{data.stats.totalUniqueSessions}</p>
                    <p className="text-[9px] text-muted-foreground">Unique shopping sessions</p>
                  </div>
                  <div className="text-center border-x">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Alt-Product Movement</p>
                    <p className="text-xl font-black">{data.stats.alternativeProductMovements}</p>
                    <p className="text-[9px] text-muted-foreground">Cross-GTIN transitions</p>
                  </div>
                   <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Evidence Strength</p>
                    <Badge className={cn(
                      "font-black text-[10px]",
                      data.metadata.evidenceStrength === 'HIGHER' ? "bg-green-500" : "bg-muted"
                    )}>{data.metadata.evidenceStrength}</Badge>
                    <p className="text-[9px] text-muted-foreground mt-1">Based on sample volume</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Executive Audit */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        Executive Audit
                    </h2>
                    <Card className="bg-accent/5 border-accent/20 h-fit">
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium leading-relaxed italic text-foreground border-l-4 border-accent pl-4 py-1">
                                "{data.summary}"
                            </p>
                            <Separator className="my-4" />
                            <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                      Calculation: {data.metadata.methodology}
                                      <br/>
                                      Version: {data.metadata.aggregationVersion}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Factual Decision Leakage</CardTitle>
                        <CardDescription className="text-[10px]">Where journeys ended without recorded progression.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {Object.entries(data.stats.leakagePoints).map(([point, count]) => (
                          <div key={point} className="flex justify-between items-center py-2 border-b last:border-0">
                            <span className="text-[10px] font-bold opacity-60">{point.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-black text-primary">{count}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                </div>

                {/* Rejection Intelligence */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <ListChecks className="h-5 w-5" />
                        Rejection Intelligence
                    </h2>
                    
                    {data.rejectionBreakdown.length === 0 ? (
                        <Card className="border-dashed flex items-center justify-center p-12 text-center bg-muted/20">
                            <div className="space-y-2">
                                <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
                                <p className="text-sm font-bold text-muted-foreground">No explicit rejection signals recorded.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {data.rejectionBreakdown.map((item) => (
                                <Card key={item.reason} className="border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                                    <CardHeader className="pb-2">
                                      <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-black uppercase tracking-tight">{item.reason}</CardTitle>
                                        <Badge variant="secondary" className="text-[10px] font-black">{item.share}%</Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-1">
                                          <p className="text-2xl font-black text-primary">{item.count}</p>
                                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sessions</p>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                          <div className="h-full bg-primary" style={{ width: `${item.share}%` }} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
