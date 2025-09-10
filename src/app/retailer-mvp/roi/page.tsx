
'use client';
import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { QrCode, User, Clock, TrendingUp, ShoppingCart, Percent, Tag, Sparkles, AlertTriangle, DollarSign, BarChart, Gift, Repeat } from 'lucide-react';
import ScanFrequencyChart from '@/components/dashboard/scan-frequency-chart';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { dashboardMetrics } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import TimeBasedPerformanceChart from '@/components/dashboard/time-based-performance-chart';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows/analyze-engagement-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import theme from '@/config/theme.json';

export default function RoiPage() {
  const metrics = dashboardMetrics.getMetrics(null); // Using all stores data for this page
  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { optionalModules } = theme;

  const engagementData = {
    totalScans: metrics.stats.totalScans,
    uniqueScans: metrics.stats.uniqueScans,
    engagementDuration: metrics.stats.engagementDuration,
    scanRate: metrics.stats.scanRate,
  };
  
  const conversionData = metrics.stats;

  const handleAnalyzeMetrics = () => {
    setError(null);
    startAnalyzing(async () => {
        try {
            const result = await analyzeEngagementMetrics({
                engagement: engagementData,
                conversion: {
                    avgBasketSizeAoe: conversionData.avgBasketSizeAoe,
                    avgBasketSizeNonAoe: conversionData.avgBasketSizeNonAoe,
                    basketUpliftPercentage: conversionData.basketUpliftPercentage,
                    offerRedemptionRate: conversionData.offerRedemptionRate,
                    totalRedeemedValue: conversionData.totalRedeemedValue,
                    aoeTransactions: conversionData.aoeTransactions,
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
            Core Engagement Metrics
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            These features track customer interaction with the platform and validate the adoption of the QR code system.
          </p>
        </div>
        {optionalModules.performanceAnalysis && (
          <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing}>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Metrics
          </Button>
        )}
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


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sales Uplift
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{metrics.stats.salesUplift.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Increase in sales from engaged customers.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Redemption-Linked Revenue
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
             R{metrics.stats.redemptionLinkedRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue generated from redeemed offers.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cost Per Engagement
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{metrics.stats.costPerEngagement.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
             Average cost for each customer interaction.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
             Return on Investment
            </CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.stats.returnOnInvestment}:1</div>
            <p className="text-xs text-muted-foreground">
              Ratio of net profit to investment cost.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ScanFrequencyChart data={scanFrequencyData} />
        <TopProductsTable data={metrics.topProducts} />
      </div>

      <Separator />

      <TimeBasedPerformanceChart data={metrics.timeBasedPerformance} />
    </div>
  );
}
