
'use client';
import { realTimeStockLevels } from '@/lib/data';
import RealTimeStockLevels from '@/components/dashboard/real-time-stock-levels';
import { Separator } from '@/components/ui/separator';

export default function RealTimePage() {
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
    </div>
  );
}
