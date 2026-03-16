
'use client';
import { useState, useTransition, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { QrCode, User, Clock, TrendingUp, ShoppingCart, Percent, Tag, Sparkles, AlertTriangle } from 'lucide-react';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { Separator } from '@/components/ui/separator';
import TimeBasedPerformanceChart from '@/components/dashboard/time-based-performance-chart';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SalesFunnelChart from '@/components/dashboard/sales-funnel-chart';

export default function RoiPage() {
  const [metricsData, setMetricsData] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Automatically fetch metrics when the page loads
    const fetchInitialData = async () => {
      try {
        const result = await analyzeEngagementMetrics({});
        setMetricsData(result);
      } catch (e) {
        console.error(e);
        setError("We couldn't load the initial dashboard metrics. Please try again later.");
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
        setError("Metrics data is not available to analyze.");
      }
    });
  };
  
  const funnelData = metricsData ? {
    scans: metricsData.engagement.totalScans,
    interactions: metricsData.engagement.uniqueScans,
    conversions: Math.round(metricsData.engagement.uniqueScans * (metricsData.conversion.offerRedemptionRate / 100)),
    sales: metricsData.conversion.aoeTransactions,
  } : null;

  const topProductsData = [
    { id: '1', name: 'Eco-Friendly Water Bottle', scans: 1254, category: 'Lifestyle' },
    { id: '2', name: 'Wireless Charging Pad', scans: 980, category: 'Electronics' },
    { id: '3', name: 'Smart Notebook', scans: 872, category: 'Stationery' },
    { id: '4', name: 'Canvas Tote Bag', scans: 765, category: 'Accessories' },
    { id: '5', name: 'Aromatic Candle', scans: 654, category: 'Home Goods' },
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
            AI-Powered Performance Analysis
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            Click the button to get AI-driven conclusions and recommendations based on all engagement and conversion metrics below.
          </p>
        </div>
        <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing || !metricsData}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze All Metrics
        </Button>
      </div>

      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Analysis</CardTitle>
            <CardDescription>Our AI is analyzing your core engagement and conversion metrics...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-4 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
          </CardContent>
        </Card>
      )}

      {error && (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}

      {analysis && (
        <Card className="bg-accent/10 border-accent">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Analysis</CardTitle>
                 <CardDescription>An AI-generated analysis of your core engagement and conversion metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Overall Performance</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.overallPerformance}</p>
                </div>
                <Separator />
                <div>
                    <h3 className="font-semibold mb-2">Conclusions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.conclusions}</p>
                </div>
                <Separator />
                 <div>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.recommendations}</p>
                </div>
            </CardContent>
        </Card>
      )}

      <Separator />

      <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Core Engagement Metrics
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            These features track customer interaction with the platform and validate the adoption of the QR code system.
          </p>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Scans
            </CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.engagement.totalScans.toLocaleString() || <Skeleton className="h-8 w-24" />}</div>
            <p className="text-xs text-muted-foreground">
              All QR code scans across all stores.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Scans
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsData?.engagement.uniqueScans.toLocaleString() || <Skeleton className="h-8 w-20" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Individual customers who have scanned.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsData?.engagement.scanRate.toFixed(2) || '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on total scans vs. unique visitors.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
             Engagement Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.engagement.engagementDuration || <Skeleton className="h-8 w-12" />}s</div>
            <p className="text-xs text-muted-foreground">
              Average time spent on product page.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopProductsTable data={topProductsData} />
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Performance & Conversion Metrics
        </h2>
        <p className="text-muted-foreground max-w-3xl">
         These elements connect engagement directly to business outcomes, demonstrating the platform's ability to influence sales.
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
                    <CardContent className="flex justify-center">
                        <div className="space-y-6">
                            <Skeleton className="h-16 w-80" />
                            <Skeleton className="h-16 w-80" />
                            <Skeleton className="h-16 w-80" />
                            <Skeleton className="h-16 w-80" />
                        </div>
                    </CardContent>
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
                            <span className="text-muted-foreground text-sm">AOE Users</span>
                            {metricsData ? <span className="text-lg font-bold">R{metricsData.conversion.avgBasketSizeAoe.toFixed(2)}</span> : <Skeleton className="h-6 w-20" />}
                        </div>
                         <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground text-sm">Non-Users</span>
                            {metricsData ? <span className="text-lg font-bold">R{metricsData.conversion.avgBasketSizeNonAoe.toFixed(2)}</span> : <Skeleton className="h-6 w-20" />}
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t">
                            <span className="text-primary font-semibold text-sm">Uplift</span>
                            {metricsData ? <span className="text-lg font-bold text-primary">{metricsData.conversion.basketUpliftPercentage.toFixed(2)}%</span> : <Skeleton className="h-6 w-16" />}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offer Redemption</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="text-3xl font-bold">{metricsData?.conversion.offerRedemptionRate.toFixed(2) || '0.00'}%</div >
                        <p className="text-xs text-muted-foreground">
                            Percentage of personalized offers redeemed.
                        </p>
                        <div className="pt-4">
                            <p className="text-sm text-muted-foreground">Total Redeemed Value</p>
                             <div className="text-2xl font-bold">R{metricsData?.conversion.totalRedeemedValue.toLocaleString() || <Skeleton className="h-8 w-24" />}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions Influenced by AOE</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{metricsData?.conversion.aoeTransactions.toLocaleString() || <Skeleton className="h-10 w-20" />}</div>
                        <p className="text-xs text-muted-foreground">
                            Total transactions where a customer engaged with the platform before purchase.
                        </p>
                    </CardContent>
                </Card>
           </div>
      </div>

      <Separator />

      <TimeBasedPerformanceChart data={timeBasedPerformanceData} />
    </div>
  );
}
