
'use client';
import { realTimeStockLevels, dataSyncLogs, systemUptime, lastSyncStatus } from '@/lib/data';
import RealTimeStockLevels from '@/components/dashboard/real-time-stock-levels';
import DataSynchronizationLogs from '@/components/dashboard/data-synchronization-logs';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

// This new component will ensure that date formatting only runs on the client
function ClientFormattedDate({ timestamp }: { timestamp: string }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This code runs only on the client, after the component has mounted
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  // Return a placeholder or null on the server and initial client render
  if (!formattedDate) {
    return null; // or a loading skeleton
  }

  return <span>{formattedDate}</span>;
}


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

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{systemUptime.uptime}%</div>
            <p
              className={cn(
                'text-xs',
                systemUptime.status === 'Operational'
                  ? 'text-green-500'
                  : 'text-red-500'
              )}
            >
              {systemUptime.status}
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync Status</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-xl font-bold", lastSyncStatus.status === 'Success' ? 'text-green-500' : 'text-red-500')}>{lastSyncStatus.status}</div>
            <p className="text-xs text-muted-foreground">
              Last updated: <ClientFormattedDate timestamp={lastSyncStatus.timestamp} />
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <RealTimeStockLevels data={realTimeStockLevels} />
        <DataSynchronizationLogs logs={dataSyncLogs} />
      </div>
    </div>
  );
}
