
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Percent, TrendingUp, Zap, Ratio } from 'lucide-react';
import SalesPerformanceChart from '@/components/dashboard/sales-performance-chart';
import { salesData, roiMetrics } from '@/lib/data';
import { Progress } from '@/components/ui/progress';

export default function RoiPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Retailer ROI Dashboard
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Monitor the financial impact and return on investment of the iNteract-AOE
          platform. These metrics illustrate the value generated from in-store
          customer engagement.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <SalesPerformanceChart data={salesData} />
    </div>
  );
}
