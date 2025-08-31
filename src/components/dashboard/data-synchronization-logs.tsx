import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
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
