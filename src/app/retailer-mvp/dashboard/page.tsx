
'use client';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { storesByRegion, roiMetrics, ytdData } from '@/lib/data';
import StoreSelector from '@/components/dashboard/store-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import YtdPerformanceChart from '@/components/dashboard/ytd-performance-chart';


export default function DashboardPage() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const handleStoreChange = (store: string | null) => {
    setSelectedStore(store);
  };
  
  const handleRegionChange = (region: string | null) => {
    setSelectedRegion(region);
    setSelectedStore(null); // Reset store when region changes
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
          <CardTitle>Executive Summary: The ROI Hero Section</CardTitle>
          <CardDescription>
            A high-level overview of the key performance indicators for your investment in the iNteract-AOE platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
