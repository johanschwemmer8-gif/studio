
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Percent, TrendingUp, Zap, MinusCircle, PlusCircle, Ratio } from 'lucide-react';
import SalesPerformanceChart from '@/components/dashboard/sales-performance-chart';
import { salesData, roiMetrics } from '@/lib/data';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function RoiPage() {
  const netGainIsPositive = roiMetrics.netGainLoss > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Executive Summary: The ROI Dashboard
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Monitor the financial impact and return on investment of the iNteract-AOE
          platform. These metrics illustrate the value generated from in-store
          customer engagement.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue Uplift to Cost Ratio
            </CardTitle>
            <Ratio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{roiMetrics.revenueUpliftToCostRatio}:1</div>
            <p className="text-xs text-muted-foreground">
              Ratio of total revenue uplift to iNteract's subscription cost.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue Uplift (This Month)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{roiMetrics.totalRevenueUplift.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">
              Direct financial gain attributable to the AOE.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Gain / Loss
            </CardTitle>
             {netGainIsPositive ? (
                <PlusCircle className="h-4 w-4 text-green-500" />
              ) : (
                <MinusCircle className="h-4 w-4 text-red-500" />
              )}
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              netGainIsPositive ? 'text-green-500' : 'text-red-500'
            )}>
              R{roiMetrics.netGainLoss.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly revenue uplift minus subscription cost.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
            <CardHeader>
              <CardTitle>Progress to Break-Even</CardTitle>
              <CardDescription>
                How close you are to recouping your investment for the month.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Progress value={roiMetrics.progressToBreakEven} className="h-3 flex-1" />
                    <span className="font-bold text-lg">{roiMetrics.progressToBreakEven}%</span>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Subscription Cost (This Month)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">R{roiMetrics.subscriptionCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                Fixed monthly cost for the iNteract service.
                </p>
            </CardContent>
        </Card>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gross Merchandise ROI (GMROI)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roiMetrics.gmroi}%</div>
            <p className="text-xs text-muted-foreground">
              Measures profit return on inventory investment.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Basket Uplift
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{roiMetrics.basketUplift}%</div>
            <p className="text-xs text-muted-foreground">
              Increase in average transaction value.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Offer Redemption Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiMetrics.offerRedemptionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Personalized offers redeemed at checkout.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement-to-Conversion
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiMetrics.engagementToConversion}%
            </div>
            <p className="text-xs text-muted-foreground">
              From initial scan to final purchase.
            </p>
          </CardContent>
        </Card>
      </div>

      <SalesPerformanceChart data={salesData} />
    </div>
  );
}
