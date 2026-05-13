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
  QrCode, User, Clock, TrendingUp, ShoppingCart, Percent, 
  Tag, Sparkles, AlertTriangle, UserCheck, ShieldCheck, 
  Fingerprint, Phone, Chrome, Smartphone, Mail, Download,
  Loader2, ArrowUp
} from 'lucide-react';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { Separator } from '@/components/ui/separator';
import TimeBasedPerformanceChart from '@/components/dashboard/time-based-performance-chart';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SalesFunnelChart from '@/components/dashboard/sales-funnel-chart';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function RoiPage() {
  const [metricsData, setMetricsData] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Automatically fetch metrics when the page loads
    const fetchInitialData = async () => {
      try {
        const result = await analyzeEngagementMetrics({});
        setMetricsData(result);
      } catch (e) {
        console.error(e);
        setError("Could not load Intelligence ROI metrics. Please check connectivity.");
      }
    };
    fetchInitialData();
  }, []);

  const handleAnalyzeMetrics = () => {
    setError(null);
    startAnalyzing(async () => {
      // Use the already fetched data to generate the text analysis
      if (metricsData) {
        setAnalysis(metricsData);
      } else {
        setError("Intelligence data stream is not available for analysis.");
      }
    });
  };

  const handleExport = (format: string) => {
    toast({
        title: `Generating Executive ROI Report (${format})...`,
        description: "Your detailed Decision Intelligence ROI analysis is being prepared.",
    });
  };
  
  const funnelData = metricsData ? {
    scans: metricsData.engagement.totalScans,
    interactions: metricsData.engagement.uniqueScans,
    conversions: Math.round(metricsData.engagement.uniqueScans * (metricsData.conversion.offerRedemptionRate / 100)),
    sales: metricsData.conversion.aoeTransactions,
  } : null;

  const topProductsData = [
    { id: '1', name: 'Eco-Friendly Water Bottle', scans: 1254, category: 'Lifestyle', trend: [30, 40, 35, 50, 45, 60] },
    { id: '2', name: 'Wireless Charging Pad', scans: 980, category: 'Electronics', trend: [20, 25, 22, 30, 28, 35] },
    { id: '3', name: 'Smart Notebook', scans: 872, category: 'Stationery', trend: [15, 18, 20, 25, 22, 30] },
    { id: '4', name: 'Canvas Tote Bag', scans: 765, category: 'Accessories', trend: [10, 15, 12, 18, 20, 25] },
    { id: '5', name: 'Aromatic Candle', scans: 654, category: 'Home Goods', trend: [5, 8, 7, 10, 12, 15] },
  ];
  
  const timeBasedPerformanceData = [
    { time: 'Mar', engagement: 4.5, conversion: 2.1 },
    { time: 'Apr', engagement: 4.8, conversion: 2.5 },
    { time: 'May', engagement: 5.1, conversion: 2.8 },
    { time: 'Jun', engagement: 5.3, conversion: 3.1 },
    { time: 'Jul', engagement: 5.8, conversion: 3.4 },
    { time: 'Aug', engagement: 6.2, conversion: 3.8 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Intelligence ROI & Economic Impact
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            Proving the financial value of the Persistent Intelligence Layer and its influence on behavioural conversion.
          </p>
        </div>
        <div className="flex gap-3">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Export Economic Report
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('PDF')}>Download Executive PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('CSV')}>Raw Economic Data (CSV)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing || !metricsData} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Analyze Economic Impact
            </Button>
        </div>
      </div>

      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> Generative ROI Audit</CardTitle>
            <CardDescription>Synthesizing impact metrics from across the infrastructure...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {error && (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Audit Friction</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}

      {analysis && (
        <Card className="bg-accent/10 border-accent shadow-md">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-sm uppercase font-black tracking-widest"><Sparkles className="text-accent h-4 w-4"/> AI Intelligence Conclusion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-bold text-xs text-muted-foreground uppercase mb-2">Ecosystem Performance</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{analysis.overallPerformance}</p>
                </div>
                <Separator />
                <div>
                    <h3 className="font-bold text-xs text-muted-foreground uppercase mb-2">Behavioural Conclusions</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{analysis.conclusions}</p>
                </div>
                <Separator />
                 <div>
                    <h3 className="font-bold text-xs text-muted-foreground uppercase mb-2">Strategic Action Plan</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{analysis.recommendations}</p>
                </div>
            </CardContent>
        </Card>
      )}

      <Separator />

      {/* SECTION 1: CORE ENGAGEMENT (Restored for Investor Readiness) */}
      <div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            Core Engagement Metrics
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Primary indicators of platform adoption and customer reach across the physical store portfolio.
          </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.engagement.totalScans.toLocaleString() || <Skeleton className="h-8 w-24" />}</div>
            <p className="text-xs text-muted-foreground">All platform entry points.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Scans</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.engagement.uniqueScans.toLocaleString() || <Skeleton className="h-8 w-20" />}</div>
            <p className="text-xs text-muted-foreground">Total individual behavioural nodes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData ? `${metricsData.engagement.scanRate.toFixed(2)}%` : <Skeleton className="h-8 w-20" />}</div>
            <p className="text-xs text-muted-foreground">Infrastructure adoption velocity.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData ? `${metricsData.engagement.engagementDuration}s` : <Skeleton className="h-8 w-12" />}</div>
            <p className="text-xs text-muted-foreground">Depth of decision-window interaction.</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* SECTION 2: IDENTITY LAYER */}
      <div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            Identity Layer Adoption
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Transition success from anonymous scans to persistent, identified smart shopper profiles.
          </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ecosystem Shoppers</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.engagement.identifiedShoppers.toLocaleString() || <Skeleton className="h-8 w-24" />}</div>
            <p className="text-xs text-muted-foreground">Identified persistent profiles.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identity Conversion</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData ? `${metricsData.engagement.profileConversionRate.toFixed(1)}%` : <Skeleton className="h-8 w-20" />}</div>
            <p className="text-xs text-muted-foreground">Efficiency of the Identity Layer.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identity Entry Points</CardTitle>
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {metricsData ? (
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> Mobile OTP</span>
                        <span className="font-bold">{metricsData.engagement.authMethodBreakdown.phone}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="flex items-center gap-1 text-muted-foreground"><Chrome className="h-3 w-3" /> Google</span>
                        <span className="font-bold">{metricsData.engagement.authMethodBreakdown.google}%</span>
                    </div>
                     <div className="flex justify-between items-center text-[10px]">
                        <span className="flex items-center gap-1 text-muted-foreground"><Smartphone className="h-3 w-3" /> Apple</span>
                        <span className="font-bold">{metricsData.engagement.authMethodBreakdown.apple}%</span>
                    </div>
                </div>
             ) : <Skeleton className="h-16 w-full" />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopProductsTable data={topProductsData} />
      </div>

      <Separator />

      {/* SECTION 3: ECONOMIC & CONVERSION (Restored for Investor Readiness) */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-2">
          Economic & Conversion Ecosystem
        </h2>
        <p className="text-muted-foreground max-w-3xl text-sm">
         Proving the direct financial uplift generated by Intelligence Guidance on every transaction.
        </p>
      </div>

       <div className="grid gap-8 lg:grid-cols-2">
           {funnelData ? (
               <SalesFunnelChart data={funnelData} />
            ) : (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4"/>
                        <Skeleton className="h-4 w-1/2"/>
                    </CardHeader>
                    <CardContent className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground"/></CardContent>
                </Card>
            )}
           <div className="space-y-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Basket Uplift Analysis</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground text-sm">Guided Transactions</span>
                            {metricsData ? <span className="text-lg font-bold">R{metricsData.conversion.avgBasketSizeAoe.toFixed(2)}</span> : <Skeleton className="h-6 w-20" />}
                        </div>
                         <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground text-sm">Unguided Baseline</span>
                            {metricsData ? <span className="text-lg font-bold">R{metricsData.conversion.avgBasketSizeNonAoe.toFixed(2)}</span> : <Skeleton className="h-6 w-20" />}
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t">
                            <span className="text-green-600 font-bold text-sm">Economic Delta</span>
                            {metricsData ? <span className="text-lg font-bold text-green-600">+{metricsData.conversion.basketUpliftPercentage.toFixed(1)}%</span> : <Skeleton className="h-6 w-16" />}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Network Offer Velocity</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="text-3xl font-bold">{metricsData ? `${metricsData.conversion.offerRedemptionRate.toFixed(1)}%` : <Skeleton className="h-8 w-20" />}</div >
                        <p className="text-xs text-muted-foreground">
                            Redemption velocity of intelligence-matched offers.
                        </p>
                        <div className="pt-4">
                            <p className="text-sm text-muted-foreground font-bold">Monetised Delta Value</p>
                             <div className="text-2xl font-bold">{metricsData ? `R${metricsData.conversion.totalRedeemedValue.toLocaleString()}` : <Skeleton className="h-8 w-24" />}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Intelligence-Attributed Sales</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{metricsData ? metricsData.conversion.aoeTransactions.toLocaleString() : <Skeleton className="h-10 w-20" />}</div>
                        <p className="text-xs text-muted-foreground">
                            Total volume influenced by the Intelligence Layer.
                        </p>
                    </CardContent>
                </Card>
           </div>
      </div>

      <Separator />

      <TimeBasedPerformanceChart 
        data={timeBasedPerformanceData} 
        title="Infrastructure Performance Trend"
        description="Month-over-month adoption and economic influence."
      />
    </div>
  );
}
