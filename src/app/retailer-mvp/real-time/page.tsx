
'use client';
import { realTimeStockLevels, campaignModuleMetrics, behavioralInsights, staffActivationData } from '@/lib/data';
import RealTimeStockLevels from '@/components/dashboard/real-time-stock-levels';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Hand, Timer, MousePointerClick, Repeat, Gift, Trophy, Users, Sparkles, AlertTriangle } from 'lucide-react';
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { analyzeCampaignPerformance, analyzeBehavioralInsights, type AnalyzeCampaignPerformanceOutput, type AnalyzeBehavioralInsightsOutput } from '@/ai/flows';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import theme from '@/config/theme.json';
import StaffActivationModule from '@/components/dashboard/staff-activation-module';

export default function RealTimePage() {
  const engagementSplitData = [
    { name: 'Recommendations', value: campaignModuleMetrics.moduleEngagementSplit.recommendations },
    { name: 'Chatbot', value: campaignModuleMetrics.moduleEngagementSplit.chatbot },
  ];
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  const [campaignAnalysis, setCampaignAnalysis] = useState<AnalyzeCampaignPerformanceOutput | null>(null);
  const [isCampaignAnalyzing, startCampaignAnalyzing] = useTransition();
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const [behavioralAnalysis, setBehavioralAnalysis] = useState<AnalyzeBehavioralInsightsOutput | null>(null);
  const [isBehavioralAnalyzing, startBehavioralAnalyzing] = useTransition();
  const [behavioralError, setBehavioralError] = useState<string | null>(null);

  const { optionalModules } = theme;


  const handleAnalyzeCampaign = () => {
    setCampaignError(null);
    startCampaignAnalyzing(async () => {
      try {
        const result = await analyzeCampaignPerformance(campaignModuleMetrics);
        setCampaignAnalysis(result);
      } catch (e) {
        console.error(e);
        setCampaignError("We couldn't generate the analysis at this time. Please try again later.");
      }
    });
  };

  const handleAnalyzeInsights = () => {
    setBehavioralError(null);
    startBehavioralAnalyzing(async () => {
        try {
            const result = await analyzeBehavioralInsights(behavioralInsights);
            setBehavioralAnalysis(result);
        } catch (e) {
            console.error(e);
            setBehavioralError("We couldn't generate the analysis at this time. Please try again later.");
        }
    });
  };


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Real-Time Stock Levels
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Monitor live inventory status from your backend system across all integrated stores.
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-1">
        <RealTimeStockLevels data={realTimeStockLevels} />
      </div>

      <Separator />

       <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Staff Activation Module
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Track which staff members in which stores are most active in promoting the AOE activation campaign.
        </p>
      </div>

      <StaffActivationModule data={staffActivationData} />

      <Separator />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
            Campaign & Module Performance
            </h2>
            <p className="text-muted-foreground max-w-3xl">
            Track the real-time performance of your active campaigns and enabled modules.
            </p>
        </div>
        {optionalModules.performanceAnalysis && (
            <Button onClick={handleAnalyzeCampaign} disabled={isCampaignAnalyzing}>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Performance
            </Button>
        )}
      </div>

       {isCampaignAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Analysis</CardTitle>
            <CardDescription>Our AI is analyzing your campaign performance metrics...</CardDescription>
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

      {campaignError && (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>{campaignError}</AlertDescription>
          </Alert>
      )}

      {campaignAnalysis && (
        <Card className="bg-accent/10 border-accent">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Analysis</CardTitle>
                 <CardDescription>An AI-generated analysis of your campaign performance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Findings</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaignAnalysis.findings}</p>
                </div>
                <Separator />
                <div>
                    <h3 className="font-semibold mb-2">Conclusions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaignAnalysis.conclusions}</p>
                </div>
                <Separator />
                 <div>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaignAnalysis.recommendations}</p>
                </div>
            </CardContent>
        </Card>
      )}

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promo Card Click-through Rate
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignModuleMetrics.promoCardCtr}%</div>
            <p className="text-xs text-muted-foreground">
              Of users who saw a promo card, this many clicked.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Assistant Usage Rate
            </CardTitle>
            <Hand className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignModuleMetrics.aiAssistantUsageRate}%</div>
            <p className="text-xs text-muted-foreground">
              Percentage of users who interacted with the AI chatbot.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Time to First Interaction
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignModuleMetrics.timeToFirstInteraction}s</div>
            <p className="text-xs text-muted-foreground">
              Average time before a user interacts with a module.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
             Module Engagement Split
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[100px]">
             <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={engagementSplitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engagementSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
             <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[0]}}></div>Recommendations: {campaignModuleMetrics.moduleEngagementSplit.recommendations}%</div>
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[1]}}></div>Chatbot: {campaignModuleMetrics.moduleEngagementSplit.chatbot}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
            Behavioral & Loyalty Insights
            </h2>
            <p className="text-muted-foreground max-w-3xl">
            Analyze customer behavior patterns and track loyalty metrics over time.
            </p>
        </div>
        {optionalModules.performanceAnalysis && (
            <Button onClick={handleAnalyzeInsights} disabled={isBehavioralAnalyzing}>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Insights
            </Button>
        )}
      </div>

        {isBehavioralAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Analysis</CardTitle>
            <CardDescription>Our AI is analyzing your behavioral and loyalty insights...</CardDescription>
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

      {behavioralError && (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>{behavioralError}</AlertDescription>
          </Alert>
      )}

      {behavioralAnalysis && (
        <Card className="bg-accent/10 border-accent">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Analysis</CardTitle>
                 <CardDescription>An AI-generated analysis of your behavioral insights.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Findings</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{behavioralAnalysis.findings}</p>
                </div>
                <Separator />
                <div>
                    <h3 className="font-semibold mb-2">Conclusions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{behavioralAnalysis.conclusions}</p>
                </div>
                <Separator />
                 <div>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{behavioralAnalysis.recommendations}</p>
                </div>
            </CardContent>
        </Card>
      )}

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repeat Scans per Shopper</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{behavioralInsights.repeatScansPerShopper}</div>
              <p className="text-xs text-muted-foreground">Indicates loyalty and habit formation by tracking how often a single customer scans new products.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redemption Frequency</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{behavioralInsights.redemptionFrequency} days</div>
              <p className="text-xs text-muted-foreground">Average time between offer redemptions for a user.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Redeemed Offers</CardTitle>
               <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                  {behavioralInsights.topRedeemedOffers.map((offer, i) => <li key={i} className="truncate">{offer}</li>)}
               </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Segmentation</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p><strong>High Value:</strong> {behavioralInsights.customerSegmentation.highValue}%</p>
                <p><strong>Loyal:</strong> {behavioralInsights.customerSegmentation.loyal}%</p>
                <p><strong>At Risk:</strong> {behavioralInsights.customerSegmentation.atRisk}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
