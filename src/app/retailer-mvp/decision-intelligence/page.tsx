'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  BrainCircuit,
  Activity, Download,
  ShieldCheck, ArrowRight,
  Barcode, Loader2, TrendingUp, ShoppingCart, Ban, AlertTriangle, Sparkles,
  Radio, Route, Target, Users, Store
} from 'lucide-react';
import { getDecisionJourneyIntelligence } from '@/ai/flows/decision-journey-intelligence';
import { getOverviewIntelligence } from '@/ai/flows/get-overview-intelligence';
import { getScanStatistics } from '@/ai/flows/get-scan-statistics';
import { generateDecisionIntelligenceBrief } from '@/ai/flows/generate-decision-intelligence-brief';
import type { DecisionIntelligenceBrief } from '@/lib/schemas/decision-intelligence-brief';
import type {
  OverviewIntelligenceResponse,
  OverviewMetric,
} from '@/lib/schemas/overview-intelligence';
import type {
  ScanStatisticsResponse,
} from '@/lib/schemas/scan-statistics';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DecisionJourneyOutput } from '@/lib/schemas/decision-journey';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { CanonicalProduct } from '@/types/product';
import { useAuth } from '@/context/auth-context';
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
    const { user } = useAuth();
    const [data, setData] = useState<DecisionJourneyOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedGtin, setSelectedGtin] = useState<string>('all');
    const [catalogProducts, setCatalogProducts] = useState<CanonicalProduct[]>([]);
    const [overviewData, setOverviewData] = useState<OverviewIntelligenceResponse | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [overviewError, setOverviewError] = useState<string | null>(null);
    const [scanData, setScanData] = useState<ScanStatisticsResponse | null>(null);
    const [scanLoading, setScanLoading] = useState(true);
    const [scanError, setScanError] = useState<string | null>(null);
    const [aiBrief, setAiBrief] = useState<DecisionIntelligenceBrief | null>(null);
    const [aiBriefLoading, setAiBriefLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const retailerId = user?.retailerId;

        if (!db || !retailerId) {
            setCatalogProducts([]);
            return;
        }

        const productQuery = query(
            collection(db, 'products'),
            where('retailerId', '==', retailerId)
        );

        const unsubscribe = onSnapshot(
            productQuery,
            snapshot => {
                const products = snapshot.docs
                    .map(productDoc => {
                        const product = productDoc.data();

                        return {
                            ...product,
                            productId: product.productId || productDoc.id,
                        } as CanonicalProduct;
                    })
                    .filter(product => Boolean(product.gtin))
                    .sort((a, b) => a.name.localeCompare(b.name));

                setCatalogProducts(products);
            },
            error => {
                console.error(
                    'Decision Intelligence product catalog load failed:',
                    error
                );
                setCatalogProducts([]);
                toast({
                    title: 'Product Catalog Unavailable',
                    description:
                        'Decision Intelligence could not load the retailer product catalog.',
                    variant: 'destructive',
                });
            }
        );

        return () => unsubscribe();
    }, [user?.retailerId, toast]);

    useEffect(() => {
        const fetchOverview = async () => {
            if (!user) {
                setOverviewData(null);
                setOverviewError(null);
                setOverviewLoading(false);
                return;
            }

            setOverviewLoading(true);
            setOverviewError(null);

            try {
                const idToken = await user.getIdToken();
                const result = await getOverviewIntelligence(idToken);
                setOverviewData(result);
            } catch (err: any) {
                console.error('Decision Intelligence overview load failed:', err);
                setOverviewData(null);
                setOverviewError(
                    err?.message || 'Authoritative live intelligence is currently unavailable.'
                );
            } finally {
                setOverviewLoading(false);
            }
        };

        fetchOverview();
    }, [user]);

    useEffect(() => {
        const fetchScanStatistics = async () => {
            if (!user) {
                setScanData(null);
                setScanError(null);
                setScanLoading(false);
                return;
            }

            setScanLoading(true);
            setScanError(null);

            try {
                const idToken = await user.getIdToken();
                const result = await getScanStatistics(idToken);
                setScanData(result);
            } catch (err: any) {
                console.error('Decision Intelligence scan statistics load failed:', err);
                setScanData(null);
                setScanError(
                    err?.message || 'Authoritative Campaign & POD evidence is currently unavailable.'
                );
            } finally {
                setScanLoading(false);
            }
        };

        fetchScanStatistics();
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            const gtinArg = selectedGtin === 'all' ? undefined : selectedGtin;
            
            try {
                const idToken = await user.getIdToken();
                const res = await getDecisionJourneyIntelligence(idToken, user.retailerId || 'unknown', 30, gtinArg);
                setData(res);
            } catch (err: any) {
                console.error(err);
                toast({ 
                    title: "Intelligence Stream Friction", 
                    description: err.message || "Aggregator delayed. Retrying connection...", 
                    variant: "destructive" 
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast, selectedGtin, user]);

    const handleExport = () => {
        toast({
            title: "Exporting Journey Report...",
            description: "A detailed PDF of auditable decision stages is being generated.",
        });
    };

    const handleGenerateAiBrief = async () => {
        if (!user) {
            toast({
                title: 'Authentication Required',
                description: 'Sign in before requesting an AI Intelligence Brief.',
                variant: 'destructive',
            });
            return;
        }

        setAiBriefLoading(true);

        try {
            const idToken = await user.getIdToken();
            const result = await generateDecisionIntelligenceBrief(idToken);
            setAiBrief(result);

            if (result.status === 'AI_UNAVAILABLE') {
                toast({
                    title: 'AI Interpretation Unavailable',
                    description:
                        'Authoritative Decision Intelligence remains available below.',
                });
            } else if (result.status === 'INSUFFICIENT_EVIDENCE') {
                toast({
                    title: 'More Evidence Required',
                    description:
                        'The current authoritative evidence is not sufficient for a governed AI brief.',
                });
            }
        } catch (error) {
            console.error(
                'Decision Intelligence AI brief request failed:',
                error
            );

            setAiBrief(null);

            toast({
                title: 'AI Intelligence Brief Unavailable',
                description:
                    'Authoritative Decision Intelligence remains available below.',
                variant: 'destructive',
            });
        } finally {
            setAiBriefLoading(false);
        }
    };

    const selectedProduct = catalogProducts.find(p => p.gtin === selectedGtin);

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <Skeleton className="h-14 w-full max-w-lg rounded-2xl" />
                    <div className="flex gap-3 w-full lg:w-auto">
                        <Skeleton className="h-11 w-full lg:w-72 rounded-lg" />
                        <Skeleton className="h-11 w-40 rounded-lg" />
                    </div>
                </div>
                <Card className="border-primary/5">
                    <CardHeader className="bg-muted/10">
                        <Skeleton className="h-3 w-1/4" />
                    </CardHeader>
                    <CardContent className="h-48 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 animate-pulse">Authenticating & Aggregating...</p>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-6 rounded-2xl border border-primary/10 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3 uppercase leading-none">
                        <BrainCircuit className="text-primary h-8 w-8" />
                        Decision Intelligence
                    </h1>
                    <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                        Evidence-qualified intelligence across live Point-of-Decision activity, shopper decision journeys, campaign performance, behavioral signals, and operational demand.
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
                            {catalogProducts
                                .filter((p): p is CanonicalProduct & { gtin: string } => Boolean(p.gtin))
                                .map(p => (
                                    <SelectItem key={p.productId} value={p.gtin}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleExport} variant="outline" className="h-11 gap-2 font-bold uppercase text-[10px] tracking-widest px-6 shadow-sm">
                      <Download className="h-4 w-4" /> Export Audit
                  </Button>
                </div>
            </div>

            <Card className="border-primary/15 bg-primary/[0.03] shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-primary/[0.04]">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-wide">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI Intelligence Brief
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Gemini interpretation will explain verified iNteract evidence without creating or replacing the underlying metrics.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit font-black text-[9px] uppercase tracking-widest">
                            Evidence-Grounded AI
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="py-6 space-y-6">
                    {!aiBrief && (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="rounded-xl border bg-background p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Observed</p>
                                    <p className="mt-2 text-xs font-semibold">Verified evidence and deterministic metrics.</p>
                                </div>
                                <div className="rounded-xl border bg-background p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Indicators</p>
                                    <p className="mt-2 text-xs font-semibold">Evidence-backed patterns that deserve attention.</p>
                                </div>
                                <div className="rounded-xl border bg-background p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Actions</p>
                                    <p className="mt-2 text-xs font-semibold">Grounded decision-support recommendations.</p>
                                </div>
                                <div className="rounded-xl border bg-background p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Hypotheses</p>
                                    <p className="mt-2 text-xs font-semibold">Clearly labelled questions for investigation.</p>
                                </div>
                                <div className="rounded-xl border bg-background p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Limitations</p>
                                    <p className="mt-2 text-xs font-semibold">Evidence gaps and integration dependencies.</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-dashed bg-background p-5">
                                <div>
                                    <p className="text-sm font-black">
                                        Generate a governed interpretation
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                                        Gemini will interpret the current authoritative evidence. It cannot create or replace the underlying metrics.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleGenerateAiBrief}
                                    disabled={aiBriefLoading}
                                    className="gap-2 font-bold uppercase text-[10px] tracking-widest"
                                >
                                    {aiBriefLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                    {aiBriefLoading
                                        ? 'Generating Brief'
                                        : 'Generate AI Brief'}
                                </Button>
                            </div>
                        </>
                    )}

                    {aiBrief && aiBrief.status === 'AVAILABLE' && (
                        <div className="space-y-6">
                            <div className="rounded-xl border bg-background p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Executive Summary
                                        </p>
                                        <p className="text-sm font-semibold leading-relaxed mt-2">
                                            {aiBrief.executiveSummary}
                                        </p>
                                    </div>
                                    <Badge className="w-fit text-[9px] uppercase">
                                        Governed AI
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {[
                                    {
                                        title: 'Factual Observations',
                                        items: aiBrief.factualObservations,
                                    },
                                    {
                                        title: 'Identified Indicators',
                                        items: aiBrief.identifiedIndicators,
                                    },
                                    {
                                        title: 'Suggested Actions',
                                        items: aiBrief.suggestedActions,
                                    },
                                ].map(section => (
                                    <Card key={section.title} className="border-primary/10">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-xs font-black uppercase tracking-wide">
                                                {section.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {section.items.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">
                                                    No evidence-grounded items returned.
                                                </p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {section.items.map((item, index) => (
                                                        <div key={`${section.title}-${index}`}>
                                                            <p className="text-xs font-semibold leading-relaxed">
                                                                {item.statement}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {item.evidenceRefs.map(ref => (
                                                                    <Badge
                                                                        key={ref}
                                                                        variant="outline"
                                                                        className="font-mono text-[8px]"
                                                                    >
                                                                        {ref}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}

                                <Card className="border-primary/10">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-xs font-black uppercase tracking-wide">
                                            Hypotheses to Investigate
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {aiBrief.hypothesesToInvestigate.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">
                                                No evidence-grounded hypotheses returned.
                                            </p>
                                        ) : (
                                            <div className="space-y-5">
                                                {aiBrief.hypothesesToInvestigate.map((item, index) => (
                                                    <div key={`hypothesis-${index}`}>
                                                        <p className="text-xs font-semibold leading-relaxed">
                                                            {item.hypothesis}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground mt-2">
                                                            Investigate: {item.investigation}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {item.evidenceRefs.map(ref => (
                                                                <Badge
                                                                    key={ref}
                                                                    variant="outline"
                                                                    className="font-mono text-[8px]"
                                                                >
                                                                    {ref}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-dashed bg-muted/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xs font-black uppercase tracking-wide">
                                        Evidence Limitations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {aiBrief.evidenceLimitations.map((limitation, index) => (
                                        <div
                                            key={`limitation-${index}`}
                                            className="flex gap-2 text-xs text-muted-foreground"
                                        >
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{limitation}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGenerateAiBrief}
                                    disabled={aiBriefLoading}
                                    className="gap-2 font-bold uppercase text-[10px] tracking-widest"
                                >
                                    {aiBriefLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                    {aiBriefLoading
                                        ? 'Regenerating'
                                        : 'Regenerate Brief'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {aiBrief && aiBrief.status !== 'AVAILABLE' && (
                        <div className="rounded-xl border border-dashed bg-background p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-black">
                                            {aiBrief.status === 'AI_UNAVAILABLE'
                                                ? 'AI Interpretation Unavailable'
                                                : 'Insufficient Evidence for AI Interpretation'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                            {aiBrief.executiveSummary}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="w-fit text-[9px] uppercase">
                                    {aiBrief.status.replaceAll('_', ' ')}
                                </Badge>
                            </div>

                            {aiBrief.evidenceLimitations.length > 0 && (
                                <div className="mt-5 space-y-2">
                                    {aiBrief.evidenceLimitations.map((limitation, index) => (
                                        <p
                                            key={`unavailable-limitation-${index}`}
                                            className="text-xs text-muted-foreground"
                                        >
                                            • {limitation}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <div className="mt-5 flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGenerateAiBrief}
                                    disabled={aiBriefLoading}
                                    className="gap-2 font-bold uppercase text-[10px] tracking-widest"
                                >
                                    {aiBriefLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                    {aiBriefLoading
                                        ? 'Retrying'
                                        : 'Retry AI Brief'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Card className="border-primary/20 bg-primary/[0.03] shadow-sm">
                    <CardContent className="p-5">
                        <Radio className="h-5 w-5 text-primary mb-3" />
                        <p className="font-black text-sm">Live Intelligence</p>
                        <p className="text-xs text-muted-foreground mt-1">Current POD activity, engagement and evidence freshness.</p>
                        <Badge className="mt-4 text-[9px] uppercase">Authoritative</Badge>
                    </CardContent>
                </Card>

                <Card className="border-primary shadow-sm">
                    <CardContent className="p-5">
                        <Route className="h-5 w-5 text-primary mb-3" />
                        <p className="font-black text-sm">Decision Journeys</p>
                        <p className="text-xs text-muted-foreground mt-1">Session-first progression, leakage, rejection and barriers.</p>
                        <Badge className="mt-4 text-[9px] uppercase">Active</Badge>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/[0.03] shadow-sm">
                    <CardContent className="p-5">
                        <Target className="h-5 w-5 text-primary mb-3" />
                        <p className="font-black text-sm">Campaign &amp; POD Performance</p>
                        <p className="text-xs text-muted-foreground mt-1">Campaign, activation, deployment and QR performance.</p>
                        <Badge className="mt-4 text-[9px] uppercase">Authoritative</Badge>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/[0.03] shadow-sm">
                    <CardContent className="p-5">
                        <Users className="h-5 w-5 text-primary mb-3" />
                        <p className="font-black text-sm">Shopper Behavioral Intelligence</p>
                        <p className="text-xs text-muted-foreground mt-1">Anonymous consideration, comparison, barriers and intent signals.</p>
                        <Badge className="mt-4 text-[9px] uppercase">Authoritative</Badge>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/[0.03] shadow-sm">
                    <CardContent className="p-5">
                        <Store className="h-5 w-5 text-primary mb-3" />
                        <p className="font-black text-sm">Operations &amp; Demand</p>
                        <p className="text-xs text-muted-foreground mt-1">Operational adoption, demand signals and integration-gated inventory.</p>
                        <Badge className="mt-4 text-[9px] uppercase">Authoritative</Badge>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-wide">
                                <Radio className="h-5 w-5 text-primary" />
                                Live Intelligence
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Authoritative Point-of-Decision activity. Unavailable evidence is never presented as zero.
                            </CardDescription>
                        </div>
                        {overviewData && (
                            <div className="text-left md:text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                    Latest Evidence
                                </p>
                                <p className="text-xs font-semibold mt-1">
                                    {overviewData.freshness.latestEvidenceAt
                                        ? new Date(overviewData.freshness.latestEvidenceAt).toLocaleString()
                                        : 'No activity recorded'}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-1">
                                    Calculated {new Date(overviewData.freshness.calculatedAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="py-6">
                    {overviewLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[...Array(4)].map((_, index) => (
                                <Skeleton key={index} className="h-36 rounded-xl" />
                            ))}
                        </div>
                    ) : overviewError ? (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm font-bold">Live intelligence unavailable</p>
                            <p className="text-xs text-muted-foreground mt-2">{overviewError}</p>
                        </div>
                    ) : overviewData ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {([
                                ['QR Exposures', overviewData.pointOfDecisionActivity.qrExposures],
                                ['Qualifying Sessions', overviewData.pointOfDecisionActivity.qualifyingShopperSessions],
                                ['Ari Interactions', overviewData.pointOfDecisionActivity.ariInteractions],
                                ['Decision Signals', overviewData.pointOfDecisionActivity.decisionSignals],
                            ] as Array<[string, OverviewMetric]>).map(([label, metric]) => (
                                <Card key={metric.metricId} className="border-primary/10 bg-muted/5">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                {label}
                                            </p>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase">
                                                {metric.status}
                                            </Badge>
                                        </div>

                                        <p className="text-3xl font-black mt-4">
                                            {metric.value === null ? '—' : metric.value.toLocaleString()}
                                        </p>

                                        <div className="mt-4 space-y-1">
                                            <p className="text-[9px] font-bold uppercase text-muted-foreground">
                                                Evidence {metric.evidenceLevel} · {metric.evidenceCount.toLocaleString()} records
                                            </p>
                                            {metric.statusDetail && (
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                    {metric.statusDetail}
                                                </p>
                                            )}
                                            {!metric.statusDetail && metric.reason && (
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                    {metric.reason.replace(/_/g, ' ')}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <p className="text-xs text-muted-foreground">
                                No authoritative Live Intelligence response is available.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-wide">
                                <Target className="h-5 w-5 text-primary" />
                                Campaign &amp; POD Performance
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Authoritative Campaign → Activation → Deployment → QR → Store evidence.
                            </CardDescription>
                        </div>
                        {scanData && (
                            <div className="text-left md:text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                    Latest Evidence
                                </p>
                                <p className="text-xs font-semibold mt-1">
                                    {scanData.latestEvidenceAt
                                        ? new Date(scanData.latestEvidenceAt).toLocaleString()
                                        : 'No activity recorded'}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-1">
                                    Calculated {new Date(scanData.calculatedAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="py-6 space-y-6">
                    {scanLoading ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            {[...Array(3)].map((_, index) => (
                                <Skeleton key={index} className="h-32 rounded-xl" />
                            ))}
                        </div>
                    ) : scanError ? (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm font-bold">Campaign &amp; POD evidence unavailable</p>
                            <p className="text-xs text-muted-foreground mt-2">{scanError}</p>
                        </div>
                    ) : scanData ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                {[
                                    ['QR Exposures', scanData.qrExposures],
                                    ['Qualifying Sessions', scanData.qualifyingShopperSessions],
                                    ['Exposure → Session Rate', scanData.exposureToSessionRatePercent],
                                ].map(([label, metric]) => {
                                    const typedMetric = metric as typeof scanData.qrExposures;
                                    const value =
                                        typedMetric.value === null
                                            ? '—'
                                            : label === 'Exposure → Session Rate'
                                                ? `${typedMetric.value.toFixed(1)}%`
                                                : typedMetric.value.toLocaleString();

                                    return (
                                        <Card key={label as string} className="border-primary/10 bg-muted/5">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        {label as string}
                                                    </p>
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase">
                                                        {typedMetric.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-3xl font-black mt-4">{value}</p>
                                                {typedMetric.reason && (
                                                    <p className="text-[10px] text-muted-foreground mt-3">
                                                        {typedMetric.reason.replace(/_/g, ' ')}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-4 mb-3">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wide">
                                            Activation Performance
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Deployment-grounded POD evidence by activation and store.
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase">
                                        {scanData.activationPerformance.length} rows
                                    </Badge>
                                </div>

                                {scanData.activationPerformance.length === 0 ? (
                                    <div className="rounded-xl border border-dashed p-8 text-center">
                                        <p className="text-xs text-muted-foreground">
                                            No activation performance evidence exists for the current evidence window.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Store</TableHead>
                                                    <TableHead>Campaign</TableHead>
                                                    <TableHead>Activation</TableHead>
                                                    <TableHead>Deployment</TableHead>
                                                    <TableHead>QR</TableHead>
                                                    <TableHead className="text-right">Exposures</TableHead>
                                                    <TableHead className="text-right">Sessions</TableHead>
                                                    <TableHead className="text-right">Progression</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {scanData.activationPerformance.map(row => (
                                                    <TableRow key={`${row.activationId}-${row.deploymentId}-${row.qrCodeId}`}>
                                                        <TableCell className="font-semibold">
                                                            <div>{row.storeName}</div>
                                                            <div className="text-[9px] text-muted-foreground font-mono">
                                                                {row.storeId}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-[10px]">{row.campaignId}</TableCell>
                                                        <TableCell className="font-mono text-[10px]">{row.activationId}</TableCell>
                                                        <TableCell className="font-mono text-[10px]">{row.deploymentId}</TableCell>
                                                        <TableCell className="font-mono text-[10px]">{row.qrCodeId}</TableCell>
                                                        <TableCell className="text-right font-bold">{row.qrExposures}</TableCell>
                                                        <TableCell className="text-right font-bold">{row.qualifyingShopperSessions}</TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {row.exposureToSessionRatePercent === null
                                                                ? '—'
                                                                : `${row.exposureToSessionRatePercent.toFixed(1)}%`}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <p className="text-xs text-muted-foreground">
                                No authoritative Campaign &amp; POD response is available.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-wide">
                                <Users className="h-5 w-5 text-primary" />
                                Shopper Behavioral Intelligence
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Anonymous session-level evidence of what shoppers seek, compare, consider, reject and move toward.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit text-[9px] font-black uppercase tracking-widest">
                            No Shopper Identity Required
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="py-6 space-y-8">
                    {overviewLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[...Array(4)].map((_, index) => (
                                <Skeleton key={index} className="h-32 rounded-xl" />
                            ))}
                        </div>
                    ) : overviewError ? (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm font-bold">Behavioral activity evidence unavailable</p>
                            <p className="text-xs text-muted-foreground mt-2">{overviewError}</p>
                        </div>
                    ) : overviewData ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {([
                                ['Information Requests', overviewData.activityIntelligence.informationRequests],
                                ['Product Comparisons', overviewData.activityIntelligence.productComparisons],
                                ['Product Consideration', overviewData.activityIntelligence.productConsideration],
                                ['Purchase Barriers / Concerns', overviewData.activityIntelligence.purchaseBarriersConcerns],
                            ] as Array<[string, OverviewMetric]>).map(([label, metric]) => (
                                <Card key={metric.metricId} className="border-primary/10 bg-muted/5">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                {label}
                                            </p>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase">
                                                {metric.status}
                                            </Badge>
                                        </div>

                                        <p className="text-3xl font-black mt-4">
                                            {metric.value === null ? '—' : metric.value.toLocaleString()}
                                        </p>

                                        <div className="mt-4 space-y-1">
                                            <p className="text-[9px] font-bold uppercase text-muted-foreground">
                                                Evidence {metric.evidenceLevel} · {metric.evidenceCount.toLocaleString()} records
                                            </p>
                                            {metric.statusDetail && (
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                    {metric.statusDetail}
                                                </p>
                                            )}
                                            {!metric.statusDetail && metric.reason && (
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                    {metric.reason.replace(/_/g, ' ')}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <p className="text-xs text-muted-foreground">
                                No authoritative behavioral activity response is available.
                            </p>
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-3">
                        <Card className="border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-wide">
                                    Explicit Rejection Reasons
                                </CardTitle>
                                <CardDescription>
                                    Reasons explicitly observed in qualifying decision journeys.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!data ? (
                                    <p className="text-xs text-muted-foreground">Journey evidence unavailable.</p>
                                ) : data.rejectionBreakdown.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No explicit rejection reasons were observed.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.rejectionBreakdown.map((item, index) => (
                                            <div key={`${item.reason}-${index}`} className="rounded-lg border p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-xs font-bold">{item.reason}</p>
                                                    <Badge variant="outline">{item.count}</Badge>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-2">
                                                    {item.share.toFixed(1)}% of explicit rejections
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-wide">
                                    Observed Purchase Barriers
                                </CardTitle>
                                <CardDescription>
                                    Explicit barrier signals observed in exposed sessions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!data ? (
                                    <p className="text-xs text-muted-foreground">Journey evidence unavailable.</p>
                                ) : data.barrierBreakdown.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No explicit purchase barriers were observed.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.barrierBreakdown.map((item, index) => (
                                            <div key={`${item.barrier}-${index}`} className="rounded-lg border p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-xs font-bold">{item.barrier}</p>
                                                    <Badge variant="outline">{item.count}</Badge>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-2">
                                                    {item.share.toFixed(1)}% of exposed sessions
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-wide">
                                    Alternative Product Movement
                                </CardTitle>
                                <CardDescription>
                                    Observed movement from the selected product context toward alternative GTINs.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!data ? (
                                    <p className="text-xs text-muted-foreground">Journey evidence unavailable.</p>
                                ) : data.altProductBreakdown.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No alternative-product movement was observed.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.altProductBreakdown.map((item, index) => (
                                            <div key={`${item.gtin}-${index}`} className="rounded-lg border p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-xs font-mono font-bold">{item.gtin}</p>
                                                    <Badge variant="outline">
                                                        {item.uniqueSessions} sessions
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-muted-foreground">
                                                    <span>{item.rate.toFixed(1)}% movement rate</span>
                                                    <span>{item.purchaseCount} verified purchases</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-wide">
                                <Store className="h-5 w-5 text-primary" />
                                Operations &amp; Demand
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Observed operational adoption and Point-of-Decision demand signals from authoritative deployment evidence.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit text-[9px] font-black uppercase tracking-widest">
                            Evidence Qualified
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="py-6 space-y-8">
                    {scanLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[...Array(4)].map((_, index) => (
                                <Skeleton key={index} className="h-32 rounded-xl" />
                            ))}
                        </div>
                    ) : scanError ? (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm font-bold">Operational evidence unavailable</p>
                            <p className="text-xs text-muted-foreground mt-2">{scanError}</p>
                        </div>
                    ) : scanData ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <Card className="border-primary/10 bg-muted/5">
                                    <CardContent className="p-5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Active Stores Observed
                                        </p>
                                        <p className="text-3xl font-black mt-4">
                                            {new Set(scanData.activationPerformance.map(row => row.storeId)).size}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-3">
                                            Stores represented by activation evidence in the current evidence window.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/10 bg-muted/5">
                                    <CardContent className="p-5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Active Activations Observed
                                        </p>
                                        <p className="text-3xl font-black mt-4">
                                            {new Set(scanData.activationPerformance.map(row => row.activationId)).size}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-3">
                                            Unique activations represented by observed POD evidence.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/10 bg-muted/5">
                                    <CardContent className="p-5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Active Deployments Observed
                                        </p>
                                        <p className="text-3xl font-black mt-4">
                                            {new Set(scanData.activationPerformance.map(row => row.deploymentId)).size}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-3">
                                            Unique deployments represented by observed POD evidence.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/10 bg-muted/5">
                                    <CardContent className="p-5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Qualifying Sessions
                                        </p>
                                        <p className="text-3xl font-black mt-4">
                                            {scanData.qualifyingShopperSessions.value === null
                                                ? '—'
                                                : scanData.qualifyingShopperSessions.value.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-3">
                                            Authoritative shopper sessions qualifying from POD exposure evidence.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div>
                                <div className="mb-3">
                                    <h3 className="text-sm font-black uppercase tracking-wide">
                                        Store Demand Signals
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Observed POD engagement by store. These signals indicate shopper activity, not inventory availability.
                                    </p>
                                </div>

                                {scanData.activationPerformance.length === 0 ? (
                                    <div className="rounded-xl border border-dashed p-8 text-center">
                                        <p className="text-xs text-muted-foreground">
                                            No store-level POD demand evidence exists for the current evidence window.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Store</TableHead>
                                                    <TableHead className="text-right">Exposures</TableHead>
                                                    <TableHead className="text-right">Qualifying Sessions</TableHead>
                                                    <TableHead className="text-right">Progression</TableHead>
                                                    <TableHead>Latest Exposure</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Object.values(
                                                    scanData.activationPerformance.reduce((acc, row) => {
                                                        const existing = acc[row.storeId];

                                                        if (!existing) {
                                                            acc[row.storeId] = {
                                                                storeId: row.storeId,
                                                                storeName: row.storeName,
                                                                exposures: row.qrExposures,
                                                                sessions: row.qualifyingShopperSessions,
                                                                latestExposureAt: row.latestExposureAt,
                                                            };
                                                        } else {
                                                            existing.exposures += row.qrExposures;
                                                            existing.sessions += row.qualifyingShopperSessions;

                                                            if (
                                                                row.latestExposureAt &&
                                                                (!existing.latestExposureAt ||
                                                                    row.latestExposureAt > existing.latestExposureAt)
                                                            ) {
                                                                existing.latestExposureAt = row.latestExposureAt;
                                                            }
                                                        }

                                                        return acc;
                                                    }, {} as Record<string, {
                                                        storeId: string;
                                                        storeName: string;
                                                        exposures: number;
                                                        sessions: number;
                                                        latestExposureAt: string | null;
                                                    }>)
                                                )
                                                .sort((a, b) => b.sessions - a.sessions)
                                                .map(store => (
                                                    <TableRow key={store.storeId}>
                                                        <TableCell className="font-semibold">
                                                            <div>{store.storeName}</div>
                                                            <div className="text-[9px] text-muted-foreground font-mono">
                                                                {store.storeId}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {store.exposures.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {store.sessions.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {store.exposures === 0
                                                                ? '—'
                                                                : `${((store.sessions / store.exposures) * 100).toFixed(1)}%`}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {store.latestExposureAt
                                                                ? new Date(store.latestExposureAt).toLocaleString()
                                                                : 'No exposure timestamp'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <p className="text-xs text-muted-foreground">
                                No authoritative operational evidence response is available.
                            </p>
                        </div>
                    )}

                    <Card className="border-dashed bg-muted/5">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-wide">
                                            Inventory Intelligence
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                                            Authoritative stock-on-hand, availability and inventory movement require a retailer-approved inventory, POS or PIM connection. iNteract does not infer stock levels from shopper demand signals.
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="w-fit text-[9px] font-black uppercase tracking-widest">
                                    Connection Required
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <div className="flex items-center gap-3">
                <Route className="h-5 w-5 text-primary" />
                <div>
                    <h2 className="text-xl font-black uppercase tracking-wide">Decision Journeys</h2>
                    <p className="text-xs text-muted-foreground">
                        Current authoritative session-level decision evidence.
                    </p>
                </div>
            </div>

            {!data ? (
                <Card className="border-dashed"><CardContent className="py-20 text-center"><p className="text-muted-foreground italic">Intelligence stream unavailable.</p></CardContent></Card>
            ) : (
                <>
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

                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid sm:grid-cols-2 gap-6">
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
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
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
                                                            <Badge variant="outline" className="text-[9px] font-black border-yellow-200 bg-yellow-50 text-yellow-700">{item.share}% Reach</Badge>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
