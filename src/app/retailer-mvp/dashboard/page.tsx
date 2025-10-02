
'use client';
import { useState, useTransition } from 'react';
import { Separator } from '@/components/ui/separator';
import { storesByRegion, dashboardMetrics } from '@/lib/data';
import StoreSelector from '@/components/dashboard/store-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User, TrendingUp, Sparkles, AlertTriangle, Tag, Percent, ArrowUp, Clock, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows/analyze-engagement-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import theme from '@/config/theme.json';


export default function DashboardPage() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { optionalModules } = theme;

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
                  engagementDuration: metrics.stats.dwellTime,
                  scanRate: metrics.stats.engagementRate,
                },
                conversion: {
                    avgBasketSizeAoe: metrics.stats.avgBasketSizeAoe,
                    avgBasketSizeNonAoe: metrics.stats.avgBasketSizeNonAoe,
                    basketUpliftPercentage: metrics.stats.basketUplift,
                    offerRedemptionRate: metrics.stats.offerRedemption,
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
  
  const currentMetrics = dashboardMetrics.getMetrics(selectedStore).stats;

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
            {optionalModules.performanceAnalysis && (
              <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Summary
              </Button>
            )}
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
                  <CardTitle className="text-sm font-medium">Unique Scans</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentMetrics.uniqueScans.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Individual customers who scanned a QR code.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentMetrics.engagementRate}%</div>
                   <p className="text-xs text-muted-foreground">
                    Percentage of unique visitors who scanned.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Offer Redemption</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentMetrics.offerRedemption}%</div>
                  <p className="text-xs text-muted-foreground">
                    Rate of personalized offers redeemed.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Basket Uplift</CardTitle>
                  <ArrowUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentMetrics.basketUplift}%</div>
                   <p className="text-xs text-muted-foreground">
                    Increase in average basket size for engaged users.
                  </p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentMetrics.conversionRate}%</div>
                   <p className="text-xs text-muted-foreground">
                    Engaged users who made a purchase.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dwell Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentMetrics.dwellTime}s</div>
                  <p className="text-xs text-muted-foreground">
                    Average time spent on product page after scan.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
