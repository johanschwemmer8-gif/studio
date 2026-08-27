'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Clock, TrendingUp, ShoppingCart, Percent, 
  Sparkles, AlertTriangle, ArrowUp, DollarSign,
  Download, Loader2, ShieldCheck, History, BarChart3,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, attributeTransactions, type AnalyzeEngagementMetricsOutput, type AttributionReport } from '@/ai/flows';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SalesFunnelChart from '@/components/dashboard/sales-funnel-chart';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * PROFIT & ROI DASHBOARD
 * Decoupled rendering ensures the page shell remains interactive during infrastructure latency.
 * AUDIT: iN-PROD-RC1-2026
 */
export default function RoiPage() {
  const { user } = useAuth();
  const [metricsData, setMetricsData] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [attributionReport, setAttributionReport] = useState<AttributionReport | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [isAttributing, startAttribution] = useTransition();
  const [isAnalyzing, startAnalyzing] = useTransition();
  
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [attrError, setAttrError] = useState<boolean>(false);
  
  const { toast } = useToast();

  const fetchMetrics = useCallback(async (retryCount = 0) => {
    if (!user) return;
    setIsMetricsLoading(true);
    setMetricsError(null);
    try {
        const idToken = await user.getIdToken();
        const retailerId = user.retailerId || 'unknown';
        const result = await analyzeEngagementMetrics({ idToken, retailerId });
        setMetricsData(result);
    } catch (e: any) {
        const isTransient = e.message.includes('metadata') || e.message.includes('refresh') || e.message.includes('500') || e.message.includes('UNKNOWN');
        if (isTransient && retryCount < 3) {
            console.warn(`[ROI Metrics] Transient failure, retrying ${retryCount + 1}/3...`);
            setTimeout(() => fetchMetrics(retryCount + 1), 1000 * (retryCount + 1));
        } else {
            console.error('Initial data fetch failed:', e.message);
            setMetricsError("SYNC_ERROR");
        }
    } finally {
        setIsMetricsLoading(false);
    }
  }, [user]);

  const fetchAttribution = useCallback(async (retryCount = 0) => {
    if (!user) return;
    setAttrError(false);
    startAttribution(async () => {
        try {
            const idToken = await user.getIdToken();
            const retailerId = user.retailerId || 'unknown';
            const attr = await attributeTransactions(idToken, retailerId);
            setAttributionReport(attr);
        } catch (e: any) {
            const isTransient = e.message.includes('metadata') || e.message.includes('refresh') || e.message.includes('500') || e.message.includes('UNKNOWN');
            if (isTransient && retryCount < 3) {
                console.warn(`[ROI Attribution] Transient failure, retrying ${retryCount + 1}/3...`);
                setTimeout(() => fetchAttribution(retryCount + 1), 1000 * (retryCount + 1));
            } else {
                console.error('Attribution fetch failed:', e.message);
                setAttrError(true);
            }
        }
    });
  }, [user]);

  useEffect(() => {
    const sequenceLoad = async () => {
      if (!user) return;
      // REDUCING METADATA PRESSURE: Chaining the heavy analytical fetches instead of 
      // parallelizing them prevents "Thundering Herd" 500 errors on the App Hosting identity bridge.
      await fetchMetrics();
      await fetchAttribution();
    };
    sequenceLoad();
  }, [user, fetchMetrics, fetchAttribution]);

  const handleAnalyzeMetrics = () => {
    startAnalyzing(async () => {
      if (metricsData && user) {
        setAnalysis(metricsData);
      } else {
        toast({ title: "Analysis Delayed", description: "Waiting for metric stream to synchronize.", variant: "destructive" });
      }
    });
  };

  const handleExport = (format: string) => {
    toast({ title: `Generating Associated Sales Report (${format})...` });
  };
  
  const funnelData = metricsData ? {
    scans: metricsData.engagement.totalScans,
    interactions: metricsData.engagement.uniqueScans,
    conversions: Math.round(metricsData.engagement.uniqueScans * (metricsData.conversion.offerRedemptionRate / 100)),
    sales: metricsData.conversion.aoeTransactions,
  } : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">
            Associated Sales Audit
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Factual summaries of sales and sessions associated with digital engagement.
            Financial indicators are based on <span className="font-bold text-primary italic">simulated transaction data</span> for this pilot.
          </p>
        </div>
        <div className="flex gap-3">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 font-bold text-[10px] uppercase tracking-widest h-10">
                        <Download className="h-4 w-4" /> Export Audit
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('PDF')}>Associated Revenue</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('CSV')}>Matched Journeys (CSV)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing || !metricsData} className="gap-2 font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                <Sparkles className="h-4 w-4 text-accent" />
                Summarize Findings
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Alert className="bg-primary/5 border-primary/20">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Grounded Evidence Guard</AlertTitle>
            <AlertDescription className="text-xs">
            These summaries are based on <strong>matched shopper journeys</strong>. No causal claim is established between chat and sale.
            </AlertDescription>
        </Alert>
        <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-yellow-800">Pilot Configuration</AlertTitle>
            <AlertDescription className="text-[10px] text-yellow-700">
                Using <strong>Simulated POS Data</strong>. Factual uplift tracking requires a live ERP connection.
            </AlertDescription>
        </Alert>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isMetricsLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : metricsError ? (
              <div className="lg:col-span-3">
                 <Alert variant="destructive" className="border-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Financial Stream Sync Deferred</AlertTitle>
                    <AlertDescription className="text-xs flex items-center justify-between mt-2">
                        <span>Associated revenue and uplift indicators are temporarily unavailable due to metadata server latency.</span>
                        <Button variant="outline" size="sm" onClick={() => fetchMetrics()} className="h-8 font-bold uppercase text-[9px] tracking-widest">Retry Connection</Button>
                    </AlertDescription>
                 </Alert>
              </div>
          ) : metricsData ? (
              <>
                <Card className="border-primary/20 bg-primary shadow-sm text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Associated Revenue (SIM)</CardTitle>
                    <DollarSign className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-black">
                        R{metricsData.conversion.associatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-[10px] opacity-70 mt-2 italic">Sales matched to digital engagement sessions.</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50/30 shadow-sm border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase text-yellow-700 tracking-widest">Calculated Uplift (SIM)</CardTitle>
                    <ArrowUp className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-black text-yellow-800">
                        R{metricsData.conversion.calculatedUplift.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-[10px] text-yellow-600 mt-2 italic">Observed delta against the baseline.</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Observed Velocity</CardTitle>
                    <Percent className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-black text-primary">
                        +{metricsData.conversion.salesUpliftPercentage.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Conversion trend within engaged segments.</p>
                    </CardContent>
                </Card>
              </>
          ) : null}
      </div>

      <Separator />

      {isAnalyzing && (
            <div className="p-8 border rounded-xl border-accent/20 bg-accent/5 flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
                <p className="font-bold text-sm uppercase tracking-widest">Generating grounded summary...</p>
            </div>
      )}

      {analysis && (
            <Card className="bg-accent/10 border-accent shadow-lg animate-in fade-in zoom-in-95 overflow-hidden">
                <CardHeader className="bg-accent/5 py-3">
                    <CardTitle className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-accent-foreground"><Sparkles className="h-4 w-4"/> iNteract Pattern Analytics</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
                    <div>
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Factual Observations</h3>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{analysis.conclusions}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Identified Indicators</h3>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{analysis.recommendations}</p>
                    </div>
                </CardContent>
            </Card>
      )}

      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" /> 
                        Activity Audit: Matched Journeys
                    </CardTitle>
                    <CardDescription>Verified chronological relationship between digital engagement and checkout.</CardDescription>
                </div>
                {attributionReport && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[9px] font-black uppercase tracking-widest px-3 py-1">
                        {attributionReport.dataStatus} SOURCE
                    </Badge>
                )}
            </div>
        </CardHeader>
        <CardContent className="pt-6">
            {attrError ? (
                <div className="py-12 text-center space-y-4">
                    <AlertTriangle className="h-10 w-10 text-destructive mx-auto opacity-50" />
                    <div className="space-y-1">
                        <p className="font-bold uppercase text-xs tracking-widest text-destructive">Attribution Sync Interrupted</p>
                        <p className="text-[10px] text-muted-foreground italic">Handshake friction detected while matching journey nodes.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchAttribution()} className="h-8 font-bold uppercase text-[9px] tracking-widest">Retry Connection</Button>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b-2">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Session</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Ari Involvement</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Journey Stage</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isAttributing ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                        ) : !attributionReport || attributionReport.records.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No matches recorded.</TableCell></TableRow>
                        ) : attributionReport.records.map((record, i) => (
                            <TableRow key={i} className="group transition-colors">
                                <TableCell className="font-mono text-[10px] text-muted-foreground">{record.sessionId.substring(0, 8)}...</TableCell>
                                <TableCell>
                                    {record.ariInteraction ? (
                                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold uppercase">YES</Badge>
                                    ) : <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">NO</span>}
                                </TableCell>
                                <TableCell>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-primary">
                                        {record.attributionLevel.replace(/_/g, ' ')}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[8px] font-black border-primary/5 uppercase">Anonymous</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                                    {record.transactionTimestamp ? new Date(record.transactionTimestamp).toLocaleTimeString() : '---'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            <div className="bg-muted/50 p-4 mt-6 rounded-lg border border-primary/5">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Audit Methodology</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    * Results are calculated by matching session identifiers across digital and POS layers. Journey stages describe depth of interaction. Transaction data is currently <span className="font-black text-primary uppercase">Simulated</span>.
                </p>
            </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-2">
            {isMetricsLoading ? (
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            ) : funnelData ? (
                <SalesFunnelChart data={funnelData} />
            ) : (
                <div className="h-[400px] border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/20">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Funnel Analytics Offline</p>
                </div>
            )}
            <div className="space-y-6">
                <Card className="border-primary/10 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                            <BarChart3 className="h-3 w-3" /> Associated Checkouts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isAttributing ? (
                            <Skeleton className="h-10 w-24" />
                        ) : (
                            <div className="text-3xl font-black">{attributionReport?.ariAssistedPurchases || 0}</div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">Confirmed transactions in engaged sessions.</p>
                    </CardContent>
                </Card>
                <TopProductsTable data={[]} />
            </div>
      </div>
    </div>
  );
}
