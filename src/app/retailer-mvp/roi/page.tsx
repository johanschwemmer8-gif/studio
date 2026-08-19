'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  UserCheck, Clock, TrendingUp, ShoppingCart, Percent, 
  Sparkles, AlertTriangle, ArrowUp, DollarSign, Target, BarChart3,
  Download, Loader2, User, QrCode, ShieldCheck, ListChecks, History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { Separator } from '@/components/ui/separator';
import TimeBasedPerformanceChart from '@/components/dashboard/time-based-performance-chart';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, attributeTransactions, type AnalyzeEngagementMetricsOutput, type AttributionReport } from '@/ai/flows';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SalesFunnelChart from '@/components/dashboard/sales-funnel-chart';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function RoiPage() {
  const [metricsData, setMetricsData] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [attributionReport, setAttributionReport] = useState<AttributionReport | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [isAttributing, startAttribution] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const result = await analyzeEngagementMetrics({ idToken, retailerId: 'simulated-retailer-id' });
        setMetricsData(result);
        
        startAttribution(async () => {
            const attr = await attributeTransactions(idToken, 'simulated-retailer-id');
            setAttributionReport(attr);
        });
      } catch (e: any) {
        setError(e.message || "Could not load factual metrics. Please check connectivity.");
      }
    };
    fetchInitialData();
  }, []);

  const handleAnalyzeMetrics = () => {
    setError(null);
    startAnalyzing(async () => {
      if (metricsData) {
        setAnalysis(metricsData);
      } else {
        setError("Intelligence stream is not available for analysis.");
      }
    });
  };

  const handleExport = (format: string) => {
    toast({
        title: `Generating Factual Report (${format})...`,
        description: "Your session-based patterns are being prepared.",
    });
  };
  
  const funnelData = metricsData ? {
    scans: metricsData.engagement.totalScans,
    interactions: metricsData.engagement.uniqueScans,
    conversions: Math.round(metricsData.engagement.uniqueScans * (metricsData.conversion.offerRedemptionRate / 100)),
    sales: metricsData.conversion.aoeTransactions,
  } : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Ecosystem Patterns (v1.5.0)
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Factual summaries of session-anchored activities and transactional co-occurrence. 
            All financial indicators are currently based on <span className="font-bold text-primary italic">simulated transaction data</span>.
          </p>
        </div>
        <div className="flex gap-3">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 font-bold text-[10px] uppercase tracking-widest">
                        <Download className="h-4 w-4" /> Export Report
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('PDF')}>Download Summary</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('CSV')}>Raw Session Events (CSV)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing || !metricsData} className="gap-2 font-bold text-[10px] uppercase tracking-widest">
                <Sparkles className="h-4 w-4 text-accent" />
                Summarize Observations
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Alert className="bg-primary/5 border-primary/20">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Attribution Integrity Guard</AlertTitle>
            <AlertDescription className="text-xs">
            All financial summaries are based on <strong>verified session-level co-occurrence</strong>. No causal attribution is established.
            </AlertDescription>
        </Alert>
        <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-yellow-800">Launch Configuration Notice</AlertTitle>
            <AlertDescription className="text-[10px] text-yellow-700">
                This dashboard is using <strong>Simulated POS Data</strong>. Factual revenue uplift requires production ERP integration.
            </AlertDescription>
        </Alert>
      </div>

      {/* CORE ECONOMIC PROOF SECTION */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20 bg-primary shadow-sm text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Associated Revenue (SIM)</CardTitle>
              <DollarSign className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">
                {metricsData ? `R${metricsData.conversion.associatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : <Skeleton className="h-8 w-24 bg-primary-foreground/20" />}
              </div>
              <p className="text-[10px] opacity-70 mt-2 italic">Total sales value associated with engaged sessions.</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/30 shadow-sm border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-yellow-700 tracking-widest">Calculated Uplift (SIM)</CardTitle>
              <ArrowUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-yellow-800">
                {metricsData ? `R${metricsData.conversion.calculatedUplift.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : <Skeleton className="h-8 w-24 bg-yellow-200" />}
              </div>
              <p className="text-[10px] text-yellow-600 mt-2 italic">Growth delta based on simulation baseline.</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Observed Velocity</CardTitle>
              <Percent className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-primary">
                {metricsData ? `+${metricsData.conversion.salesUpliftPercentage.toFixed(1)}%` : <Skeleton className="h-8 w-20 bg-muted" />}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Performance trend within engaged segments.</p>
            </CardContent>
          </Card>
      </div>

      <Separator />

      {/* Factual Transaction Audit Table */}
      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" /> 
                        Session Audit: Transaction Co-occurrence
                    </CardTitle>
                    <CardDescription>Launch Ready Audit Trace: Temporal relationship between Ari and Checkout.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[9px] font-black uppercase tracking-widest px-3 py-1">
                    {attributionReport?.dataStatus || 'PENDING'} SOURCE
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Session ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Ari Involvement</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Observed Level</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Identity Status</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Timestamp</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isAttributing ? (
                         <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                    ) : attributionReport?.records.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No associations recorded in this window.</TableCell></TableRow>
                    ) : attributionReport?.records.map((record, i) => (
                        <TableRow key={i} className="group transition-colors">
                            <TableCell className="font-mono text-[10px] text-muted-foreground">{record.sessionId.substring(0, 16)}...</TableCell>
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
                                <Badge variant="outline" className="text-[8px] font-black border-primary/5 uppercase">Anonymous Session</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                                {record.transactionTimestamp ? new Date(record.transactionTimestamp).toLocaleTimeString() : '---'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="bg-muted/50 p-4 mt-6 rounded-lg border border-primary/5">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Audit Methodology Note</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    * Associations are established strictly by matching Session IDs. "Observed Level" describes journey depth chronologically. No causal force is claimed for these transactions. Transaction data remains <span className="font-black text-primary">Simulated</span> for this launch configuration.
                </p>
            </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-2">
            {funnelData ? (
                <SalesFunnelChart data={funnelData} />
            ) : (
                <Card><CardContent className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground"/></CardContent></Card>
            )}
            <div className="space-y-6">
                <Card className="border-primary/10 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                            <BarChart3 className="h-3 w-3" /> Associated Checkouts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{attributionReport?.ariAssistedPurchases || 0}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Confirmed transactions within Ari-active sessions.</p>
                    </CardContent>
                </Card>
                <TopProductsTable data={[]} />
            </div>
      </div>

      <Separator />

      <TimeBasedPerformanceChart 
        data={[]} 
        title="Infrastructure Adoption Trend"
        description="Chronologically verified adoption patterns over time."
      />
    </div>
  );
}