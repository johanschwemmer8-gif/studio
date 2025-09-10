
'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Power, PowerOff, User, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

type ActivationLog = {
  id: string;
  module: string;
  action: 'Activated' | 'Deactivated';
  user: string;
  timestamp: string;
};

type ModuleActivationLogsProps = {
  logs: ActivationLog[];
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


export default function ModuleActivationLogs({ logs }: ModuleActivationLogsProps) {
  const getActionInfo = (action: ActivationLog['action']) => {
    switch (action) {
      case 'Activated':
        return {
          color: 'bg-green-500/20 text-green-600 border-green-500/30',
          icon: <Power className="h-4 w-4 text-green-500" />,
        };
      case 'Deactivated':
        return {
          color: 'bg-red-500/20 text-red-600 border-red-500/30',
          icon: <PowerOff className="h-4 w-4 text-red-500" />,
        };
      default:
        return { color: '', icon: null };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Activation Logs</CardTitle>
        <CardDescription>
          Recent changes to optional module activation states.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
                const actionInfo = getActionInfo(log.action);
                return (
                    <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.module}</TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                className={cn(
                                'font-semibold flex items-center gap-1 w-fit',
                                actionInfo.color
                                )}
                            >
                                {actionInfo.icon}
                                {log.action}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className='flex items-center gap-2 text-muted-foreground'>
                                <User className="h-3.5 w-3.5" />
                                {log.user}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className='flex items-center gap-2 text-muted-foreground'>
                                <Clock className="h-3.5 w-3.5" />
                                <ClientFormattedDate timestamp={log.timestamp} />
                            </div>
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

