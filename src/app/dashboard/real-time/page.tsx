
'use client';
import { realTimeStockLevels, dataSyncLogs } from '@/lib/data';
import RealTimeStockLevels from '@/components/dashboard/real-time-stock-levels';
import DataSynchronizationLogs from '@/components/dashboard/data-synchronization-logs';
import { Separator } from '@/components/ui/separator';

export default function RealTimePage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Real-Time Data & Diagnostics
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Monitor live data streams from your integrated systems to ensure operational health and data accuracy.
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-2">
        <RealTimeStockLevels data={realTimeStockLevels} />
        <DataSynchronizationLogs logs={dataSyncLogs} />
      </div>
    </div>
  );
}
