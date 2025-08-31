'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Percent, TrendingUp } from 'lucide-react';

type Stats = {
  offerRedemptionRate: number;
  basketUplift: number;
};

export default function PerformanceMetrics({ stats }: { stats: Stats }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Performance Metrics: The "Value Proposition"</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offer Redemption Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offerRedemptionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Basket Uplift</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.basketUplift}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
