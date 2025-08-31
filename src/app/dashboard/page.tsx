
'use client';
import { useState } from 'react';
import StoresByRegion from '@/components/dashboard/stores-by-region';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { Separator } from '@/components/ui/separator';
import { dashboardMetrics, storesByRegion } from '@/lib/data';
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
      <div className="grid lg:grid-cols-2 gap-8">
        <TopProductsTable data={metrics.topProducts} />
        <TimeBasedPerformanceChart data={metrics.timeBasedPerformance} />
      </div>
      <Separator />
      <StoresByRegion />
    </div>
  );
}
