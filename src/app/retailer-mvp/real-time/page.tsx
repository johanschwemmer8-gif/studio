
'use client';
import { realTimeStockLevels, campaignModuleMetrics, behavioralInsights } from '@/lib/data';
import RealTimeStockLevels from '@/components/dashboard/real-time-stock-levels';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Hand, Timer, MousePointerClick, Repeat, Gift, Trophy, Users } from 'lucide-react';
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Cell } from 'recharts';

export default function RealTimePage() {
  const engagementSplitData = [
    { name: 'Recommendations', value: campaignModuleMetrics.moduleEngagementSplit.recommendations },
    { name: 'Chatbot', value: campaignModuleMetrics.moduleEngagementSplit.chatbot },
  ];
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

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
          Campaign & Module Performance
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Track the real-time performance of your active campaigns and enabled modules.
        </p>
      </div>
      
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

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Behavioral & Loyalty Insights
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Analyze customer behavior patterns and track loyalty metrics over time.
        </p>
      </div>

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
