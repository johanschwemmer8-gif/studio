
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  BrainCircuit, MessageSquare, 
  Activity, Download,
  CheckCircle2, Info, ShieldCheck, HelpCircle, Sparkles
} from 'lucide-react';
import { aggregateIntelligence } from '@/ai/flows/aggregate-intelligence';
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

type AggregatedData = {
    summary: string;
    insights: any[];
    stats: {
        totalUniqueSessions: number;
        totalSignalsProcessed: number;
    }
};

export default function DecisionIntelligencePage() {
    const [data, setData] = useState<AggregatedData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        aggregateIntelligence({ retailerId: 'simulated-retailer-id' })
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
            title: "Exporting Intelligence Report...",
            description: "A detailed PDF of session-based behavioural patterns is being generated.",
        });
    };

    if (loading || !data) {
        return (
            <div className="space-y-8 p-4">
                <Skeleton className="h-12 w-1/4" />
                <Skeleton className="h-64 w-full" />
                <div className="grid grid-cols-2 gap-8">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
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
                        Evidence-Based Intelligence
                    </h1>
                    <p className="text-muted-foreground max-w-3xl">
                        Qualified interaction signals aggregated from validated customer expressions. Inferred data is excluded from factual counts.
                    </p>
                </div>
                <Button onClick={handleExport} className="gap-2 font-bold uppercase text-[10px] tracking-widest">
                    <Download className="h-4 w-4" /> Export Economic Report
                </Button>
            </div>

            <Separator />

            {/* Evidence Dashboard Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary text-primary-foreground shadow-lg border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Shopping Sessions</CardTitle>
                        <Activity className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{data.stats.totalUniqueSessions.toLocaleString()}</div>
                        <p className="text-[10px] opacity-70 mt-1">Deduplicated scanner reach.</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Validated Signals</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{data.stats.totalSignalsProcessed.toLocaleString()}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Explicit customer expressions.</p>
                    </CardContent>
                </Card>
                 <Card className="border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inference Guard</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">Active</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Non-explicit data excluded.</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Audit Version</CardTitle>
                        <Info className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">v1.1.0</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Hardened integrity layer.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Qualified Insights Feed */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Qualified Insights
                    </h2>
                    
                    {data.insights.length === 0 ? (
                        <Card className="border-dashed flex items-center justify-center p-12 text-center bg-muted/20">
                            <div className="space-y-2">
                                <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
                                <p className="text-sm font-bold text-muted-foreground">Insufficient evidence for qualified conclusions.</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gathering further interaction signals...</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {data.insights.map((insight: any) => (
                                <Card key={insight.insightId} className="border-primary/10 overflow-hidden hover:border-primary/30 transition-colors shadow-sm">
                                    <div className={cn(
                                        "h-1.5 w-full",
                                        insight.evidenceStrength === 'HIGHER EVIDENCE' ? "bg-green-500" : 
                                        insight.evidenceStrength === 'MODERATE EVIDENCE' ? "bg-yellow-500" : "bg-slate-300"
                                    )} />
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="outline" className="text-[10px] uppercase font-black mb-2 px-1.5 py-0">{insight.insightType}</Badge>
                                                <CardTitle className="text-lg font-black tracking-tight leading-snug">{insight.statement}</CardTitle>
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge className={cn(
                                                            "text-[9px] font-black uppercase tracking-tighter cursor-help",
                                                            insight.evidenceStrength === 'HIGHER EVIDENCE' ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {insight.evidenceStrength}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs p-3">
                                                        <p className="font-bold text-xs uppercase mb-1">Methodology Audit</p>
                                                        <p className="text-[10px] leading-relaxed">
                                                            Based on {insight.metric.numerator} affected unique sessions out of {insight.metric.denominator} total interactions.
                                                            Integrity version: {insight.methodology.aggregationVersion}.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="p-3 bg-muted/30 rounded-lg border border-black/5 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Behavioural Dimension</p>
                                                <p className="text-xs font-bold capitalize">{insight.type.replace(/_/g, ' ')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Session Rate</p>
                                                <p className="text-xl font-black text-primary">{insight.metric.rate}%</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        Executive Audit
                    </h2>
                    <Card className="bg-accent/5 border-accent/20 shadow-inner">
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium leading-relaxed italic text-foreground border-l-4 border-accent pl-4 py-1">
                                "{data.summary}"
                            </p>
                            <Separator className="my-4" />
                            <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">This analysis uses deterministic aggregation of unique shopper sessions. Causal phrasing is strictly audited.</p>
                                </div>
                                <div className="p-3 rounded bg-white/50 border border-black/5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Processing Rules</p>
                                    <ul className="text-[9px] space-y-1 text-muted-foreground list-disc pl-3">
                                        <li>Non-explicit signals excluded.</li>
                                        <li>Duplicate session events normalized.</li>
                                        <li>PII scrubbing enforced at extraction.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
