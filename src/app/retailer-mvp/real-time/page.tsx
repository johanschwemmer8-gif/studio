
'use client';
import { realTimeStockLevels } from '@/lib/data';
import RealTimeStockLevels from '@/components/dashboard/real-time-stock-levels';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

      <Separator />

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Campaign & Module Performance
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Track the real-time performance of your active campaigns and enabled modules.
        </p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                  This section is under development. Soon you'll be able to see live metrics on campaign reach, engagement, and module usage.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <p>
                  Stay tuned for powerful features that will provide real-time insights into how your customers are interacting with your campaigns and platform modules.
              </p>
          </CardContent>
      </Card>
    </div>
  );
}
