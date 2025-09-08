
'use client';
import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { QrCode, User, Clock, TrendingUp, ShoppingCart, Percent, Tag, Sparkles, AlertTriangle } from 'lucide-react';
import ScanFrequencyChart from '@/components/dashboard/scan-frequency-chart';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { dashboardMetrics } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import TimeBasedPerformanceChart from '@/components/dashboard/time-based-performance-chart';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows/analyze-engagement-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RoiPage() {
  const metrics = dashboardMetrics.getMetrics(null); // Using all stores data for this page
  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeMetrics = () => {
    setError(null);
    startAnalyzing(async () => {
        try {
            const result = await analyzeEngagementMetrics({
                engagement: {
                  totalScans: metrics.stats.totalScans,
                  uniqueScans: metrics.stats.uniqueScans,
                  engagementDuration: metrics.stats.engagementDuration,
                  scanRate: metrics.stats.scanRate,
                },
                conversion: {
                    avgBasketSizeAoe: metrics.stats.avgBasketSizeAoe,
                    avgBasketSizeNonAoe: metrics.stats.avgBasketSizeNonAoe,
                    basketUpliftPercentage: metrics.stats.basketUpliftPercentage,
                    offerRedemptionRate: metrics.stats.offerRedemptionRate,
                    totalRedeemedValue: metrics.stats.totalRedeemedValue,
                    aoeTransactions: metrics.stats.aoeTransactions,
                }
            });
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            setError("We couldn't generate the analysis at this time. Please try again later.");
        }
    });
  };

  const scanFrequencyData = [
    { name: 'Mar', scans: 980 },
    { name: 'Apr', scans: 390 },
    { name: 'May', scans: 480 },
    { name: 'Jun', scans: 380 },
    { name: 'Jul', scans: 520 },
    { name: 'Aug', scans: 610 },
    { name: 'Sep', scans: 750 },
    { name: 'Oct', scans: 880 },
    { name: 'Nov', scans: 1050 },
    { name: 'Dec', scans: 1500 },
    { name: 'Jan', scans: 1240 },
    { name: 'Feb', scans: 1139 },
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
        <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing}>
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
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}

      {analysis && (
        <Card className="bg-accent/10 border-accent">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Analysis</CardTitle>
                 <CardDescription>An AI-generated analysis of your core engagement and conversion metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Conclusions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.conclusions}</p>
                </div>
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
            <div className="text-2xl font-bold">{metrics.stats.totalScans.toLocaleString()}</div>
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
              {metrics.stats.uniqueScans.toLocaleString()}
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
              {metrics.stats.scanRate}%
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
            <div className="text-2xl font-bold">{metrics.stats.engagementDuration}s</div>
            <p className="text-xs text-muted-foreground">
              Average time spent on product page.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ScanFrequencyChart data={scanFrequencyData} />
        <TopProductsTable data={metrics.topProducts} />
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

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Basket Uplift Analysis</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground text-sm">AOE Users</span>
                    <span className="text-lg font-bold">R{metrics.stats.avgBasketSizeAoe.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground text-sm">Non-Users</span>
                    <span className="text-lg font-bold">R{metrics.stats.avgBasketSizeNonAoe.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t">
                    <span className="text-primary font-semibold text-sm">Uplift</span>
                    <span className="text-lg font-bold text-primary">{metrics.stats.basketUpliftPercentage}%</span>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offer Redemption</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="text-3xl font-bold">{metrics.stats.offerRedemptionRate}%</div >
                <p className="text-xs text-muted-foreground">
                    Percentage of personalized offers redeemed.
                </p>
                <div className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Redeemed Value</p>
                     <p className="text-2xl font-bold">R{metrics.stats.totalRedeemedValue.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions Influenced by AOE</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{metrics.stats.aoeTransactions}</div>
                <p className="text-xs text-muted-foreground">
                    Total transactions where a customer engaged with the platform before purchase.
                </p>
            </CardContent>
        </Card>
      </div>

      <Separator />

      <TimeBasedPerformanceChart data={metrics.timeBasedPerformance} />
    </div>
  );
}
