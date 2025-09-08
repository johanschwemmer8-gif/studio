
'use client';
import { useState, useTransition } from 'react';
import { Separator } from '@/components/ui/separator';
import { storesByRegion, roiMetrics, ytdData, dashboardMetrics } from '@/lib/data';
import StoreSelector from '@/components/dashboard/store-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import YtdPerformanceChart from '@/components/dashboard/ytd-performance-chart';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows/analyze-engagement-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function DashboardPage() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStoreChange = (store: string | null) => {
    setSelectedStore(store);
  };
  
  const handleRegionChange = (region: string | null) => {
    setSelectedRegion(region);
    setSelectedStore(null); // Reset store when region changes
  };

  const handleAnalyzeMetrics = () => {
    setError(null);
    startAnalyzing(async () => {
        try {
            const metrics = dashboardMetrics.getMetrics(selectedStore);
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

  return (
    <div className="space-y-8">
      <StoreSelector
        regions={storesByRegion}
        selectedRegion={selectedRegion}
        onRegionChange={handleRegionChange}
        selectedStore={selectedStore}
        onStoreChange={handleStoreChange}
      />
      <Separator />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Executive Summary: The ROI Hero Section</CardTitle>
              <CardDescription>
                A high-level overview of the key performance indicators for your investment in the iNteract-AOE platform.
              </CardDescription>
            </div>
             <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing}>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Summary
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">

            {isAnalyzing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Analysis</CardTitle>
                    <CardDescription>Our AI is analyzing your performance metrics...</CardDescription>
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
                         <CardDescription>An AI-generated analysis of your performance metrics.</CardDescription>
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


            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Uplift to Cost Ratio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{roiMetrics.revenueUpliftToCostRatio}:1</div>
                  <p className="text-xs text-muted-foreground">
                    For every R1 spent, you are generating R{roiMetrics.revenueUpliftToCostRatio.toFixed(2)} in return.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue Uplift YTD</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R{roiMetrics.totalRevenueUplift.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Directly attributable to in-store engagements.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscription Cost YTD</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R{roiMetrics.subscriptionCost.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Fixed monthly platform investment.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Gain/Loss YTD</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${roiMetrics.netGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    R{roiMetrics.netGainLoss.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Absolute profit after subscription costs.
                  </p>
                </CardContent>
              </Card>
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Progress to Break-Even</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-center gap-4">
                          <Progress value={roiMetrics.progressToBreakEven} className="h-3" />
                          <span className="text-lg font-bold">{roiMetrics.progressToBreakEven}%</span>
                      </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      How close you are to recouping your monthly investment.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <YtdPerformanceChart data={ytdData} />
      
    </div>
  );
}
