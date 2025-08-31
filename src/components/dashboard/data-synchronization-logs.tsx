
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

type SyncLog = {
  id: string;
  service: string;
  status: 'Success' | 'Failed';
  timestamp: string;
};

type DataSynchronizationLogsProps = {
  logs: SyncLog[];
};

const statusIcons = {
  Success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  Failed: <XCircle className="h-4 w-4 text-red-500" />,
};

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


export default function DataSynchronizationLogs({ logs }: DataSynchronizationLogsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Synchronization Logs</CardTitle>
        <CardDescription>
          Recent data sync events with external systems.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {logs.map((log, index) => (
            <li key={log.id}>
              <div className="flex items-center gap-4">
                {statusIcons[log.status]}
                <div className="flex-1">
                  <p className="font-medium">{log.service}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <ClientFormattedDate timestamp={log.timestamp} />
                  </div>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    log.status === 'Success' ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {log.status}
                </span>
              </div>
              {index < logs.length - 1 && <Separator className="mt-4" />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
