'use client';
import { useState } from 'react';
import EngagementMetrics from '@/components/dashboard/engagement-metrics';
import StoresByRegion from '@/components/dashboard/stores-by-region';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { Separator } from '@/components/ui/separator';
import { dashboardMetrics, storesByRegion } from '@/lib/data';
import PerformanceMetrics from '@/components/dashboard/performance-metrics';
import TimeBasedPerformanceChart from '@/components/dashboard/time-based-performance-chart';
import StoreSelector from '@/components/dashboard/store-selector';

export default function DashboardPage() {
  const [selectedStore, setSelectedStore] = useState<string | null>('All Stores');

  const handleStoreChange = (store: string | null) => {
    setSelectedStore(store);
  };

  const metrics = dashboardMetrics.getMetrics(selectedStore);

  return (
    <div className="space-y-8">
      <StoreSelector
        regions={storesByRegion}
        selectedStore={selectedStore}
        onStoreChange={handleStoreChange}
      />
      <Separator />
      <EngagementMetrics stats={metrics.stats} />
      <Separator />
      <PerformanceMetrics stats={metrics.stats} />
      <Separator />
      <div className="grid lg:grid-cols-2 gap-8">
        <TopProductsTable data={metrics.topProducts} />
        <TimeBasedPerformanceChart data={metrics.timeBasedPerformance} />
      </div>
      <Separator />
      <StoresByRegion />
    </div>
  );
}
