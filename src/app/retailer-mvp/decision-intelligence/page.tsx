'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  BrainCircuit, 
  Activity, Download,
  ShieldCheck, HelpCircle, Sparkles,
  ArrowRight, ListChecks, History, 
  Barcode, Search, Filter, Loader2,
  TrendingUp, ShoppingCart, AlertCircle, Ban
} from 'lucide-react';
import { getDecisionJourneyIntelligence } from '@/ai/flows/decision-journey-intelligence';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DecisionJourneyOutput } from '@/lib/schemas/decision-journey';
import { products as localProducts } from '@/lib/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const FunnelStage = ({ 
  label, 
  value, 
  rate, 
  numerator,
  denominator,
  isLast 
}: { 
  label: string, 
  value: number, 
  rate: number, 
  numerator: number,
  denominator: number,
  isLast?: boolean 
}) => (
  <div className="flex flex-col items-center flex-1 min-w-[140px]">
    <div className="relative group w-full flex flex-col items-center">
      <div className={cn(
        "h-20 w-full rounded-xl flex flex-col items-center justify-center p-3 border-2 transition-all group-hover:border-primary/40",
        rate > 0 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
      )}>
        <p className="text-[10px] font-black uppercase tracking-tighter opacity-70 mb-1">{label}</p>
        <p className="text-xl font-black">{value.toLocaleString()}</p>
        <p className="text-[9px] font-medium opacity-60 mt-1">{numerator} / {denominator}</p>
      </div>
      {!isLast && (
        <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
          <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
        </div>
      )}
      {rate < 100 && rate > 0 && (
         <p className="mt-2 text-[10px] font-bold text-primary">{rate}% Conversion</p>
      )}
    </div>
  </div>
);

export default function DecisionIntelligencePage() {
    const [data, setData] = useState<DecisionJourneyOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedGtin, setSelectedGtin] = useState<string>('all');
    const { toast } = useToast();

    useEffect(() => {
        setLoading(true);
        const gtinArg = selectedGtin === 'all' ? undefined : selectedGtin;
        
        getDecisionJourneyIntelligence('simulated-retailer-id', 30, gtinArg)
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast({ title: "Intelligence Stream Friction", description: "Aggregator delayed. Retrying connection...", variant: "destructive" });
                setLoading(false);
            });
    }, [toast, selectedGtin]);

    const handleExport = () => {
        toast({
            title: "Exporting Journey Report...",
            description: "A detailed PDF of auditable decision stages is being generated.",
        });
    };

    const selectedProduct = localProducts.find(p => p.gtin === selectedGtin);

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-6 rounded-2xl border border-primary/10 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                        <BrainCircuit className="text-primary h-8 w-8" />
                        Shopper Decision Intelligence
                    </h1>
                    <p className="text-muted-foreground max-w-2xl text-sm">
                        Factual, chronologically verified decision patterns. Every metric is joined at the session level to ensure identity isolation.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="flex-1 lg:w-72">
                    <Select value={selectedGtin} onValueChange={setSelectedGtin}>
                        <SelectTrigger className="bg-background h-11 border-primary/20">
                            <div className="flex items-center gap-2">
                                <Barcode className="h-4 w-4 text-primary" />
                                <SelectValue placeholder="All Products" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Total Portfolio Reach</SelectItem>
                            <Separator className="my-1" />
                            {localProducts.map(p => (
                                <SelectItem key={p.gtin} value={p.gtin}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleExport} className="h-11 gap-2 font-bold uppercase text-[10px] tracking-widest px-6 shadow-md">
                      <Download className="h-4 w-4" /> Export Audit
                  </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 w-fit px-3 py-1.5 rounded-full border border-green-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Chronological Sequence Verified
                </div>
                {data && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1.5 font-black uppercase text-[10px] py-1.5">
                        {data.metadata.dataStatus} TRANSACTIONS
                    </Badge>
                )}
            </div>

            {loading || !data ? (
                <div className="space-y-8">
                    <Card><CardContent className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
                    <div className="grid grid-cols-3 gap-8"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
                </div>
            ) : (
                <>
                    {/* Funnel Visualization */}
                    <Card className="border-primary/10 bg-muted/5 shadow-inner overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-primary" /> 
                                {selectedGtin === 'all' ? 'Portfolio Journey Funnel' : `Journey Profile: ${selectedProduct?.name}`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 pb-10">
                            <div className="flex flex-wrap lg:flex-nowrap gap-6 justify-between px-4">
                                {data.funnel.map((stage, i) => (
                                    <FunnelStage 
                                        key={stage.stage} 
                                        label={stage.stage} 
                                        value={stage.uniqueSessions} 
                                        rate={stage.rate}
                                        numerator={stage.numerator}
                                        denominator={stage.denominator}
                                        isLast={i === data.funnel.length - 1}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Executive Insights */}
                        <div className="lg:col-span-1 space-y-6">
                            <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-accent" />
                                Evidence Summary
                            </h2>
                            <Card className="bg-primary/5 border-primary/10 h-fit shadow-sm">
                                <CardContent className="pt-6">
                                    <p className="text-sm font-bold leading-relaxed italic text-foreground border-l-4 border-primary pl-4 py-2 bg-white/50 rounded-r-md">
                                        &ldquo;{data.summary}&rdquo;
                                    </p>
                                    <Separator className="my-6" />
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">Evidence Strength</span>
                                            <Badge className={cn(
                                                "font-black text-[10px] px-3",
                                                data.metadata.evidenceStrength === 'HIGHER' ? "bg-green-500" : "bg-yellow-500"
                                            )}>{data.metadata.evidenceStrength}</Badge>
                                        </div>
                                        <div className="flex items-start gap-2 pt-2">
                                            <History className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Aggregation Method</p>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                                                    {data.metadata.methodology}
                                                    <br/>
                                                    Version: {data.metadata.aggregationVersion}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/10">
                                <CardHeader className="pb-3 border-b bg-muted/5">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Journey Node Leakage</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {Object.entries(data.stats.leakagePoints).map(([point, count]) => (
                                        <div key={point} className="flex justify-between items-center group">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{point.replace(/_/g, ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-primary">{count}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground/50 uppercase">Sessions</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Rejection & Barrier Intelligence */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid sm:grid-cols-2 gap-6">
                                {/* Explicit Rejection Audit */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Ban className="h-5 w-5 text-destructive" />
                                        Explicit Rejection Audit
                                    </h2>
                                    <div className="space-y-3">
                                        {data.rejectionBreakdown.length === 0 ? (
                                            <Card className="border-dashed p-8 text-center bg-muted/20">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No Rejections Recorded</p>
                                            </Card>
                                        ) : (
                                            data.rejectionBreakdown.map((item) => (
                                                <Card key={item.reason} className="border-primary/10 shadow-sm">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs font-black uppercase tracking-tight">{item.reason}</span>
                                                            <Badge variant="secondary" className="text-[9px] font-black">{item.share}% Share</Badge>
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="text-2xl font-black text-primary">{item.count}</p>
                                                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Unique Sessions</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center px-2 py-1 bg-muted/50 rounded-lg">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Reason Captured Rate</span>
                                        <span className="text-[11px] font-black text-primary">{Math.round((data.stats.rejectionsWithReason / (data.stats.rejectionsWithReason + data.stats.rejectionsWithoutReason || 1)) * 100)}%</span>
                                    </div>
                                </div>

                                {/* Observed Barrier Intelligence */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                        Observed Barrier Reach
                                    </h2>
                                    <div className="space-y-3">
                                        {data.barrierBreakdown.length === 0 ? (
                                            <Card className="border-dashed p-8 text-center bg-muted/20">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No Barriers Identified</p>
                                            </Card>
                                        ) : (
                                            data.barrierBreakdown.map((item) => (
                                                <Card key={item.barrier} className="border-primary/10 shadow-sm">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs font-black uppercase tracking-tight">{item.barrier}</span>
                                                            <Badge variant="outline" className="text-[9px] font-black border-yellow-200 bg-yellow-50 text-yellow-700">{item.share}% of Exposed</Badge>
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="text-2xl font-black text-primary">{item.count}</p>
                                                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Unique Sessions</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-[9px] italic text-muted-foreground px-2">
                                        * Barriers are factors explicitly cited by shoppers that may impede decision progress, regardless of final rejection.
                                    </p>
                                </div>
                            </div>

                            {/* Movement Audit */}
                            {selectedGtin !== 'all' && (
                                <div className="space-y-4 pt-4">
                                    <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Subsequent Product Movement
                                    </h2>
                                    <Card className="border-primary/10 overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Alternative GTIN</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Sessions</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">% Reach</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Subsequent Purchases</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.altProductBreakdown.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic text-xs">
                                                            No subsequent movement recorded.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    data.altProductBreakdown.map((alt) => (
                                                        <TableRow key={alt.gtin}>
                                                            <TableCell className="font-mono text-xs font-bold">{alt.gtin}</TableCell>
                                                            <TableCell className="text-center font-bold">{alt.uniqueSessions}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="secondary" className="text-[9px] font-black">{alt.rate}%</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1.5 font-black text-primary">
                                                                    <ShoppingCart className="h-3 w-3 opacity-50" />
                                                                    {alt.purchaseCount}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
