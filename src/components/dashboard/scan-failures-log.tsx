
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
import { Building2, MapPin, Clock, AlertCircle, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

type ScanFailureLog = {
  id: string;
  store: string;
  location: string;
  error: string;
  timestamp: string;
};

type ScanFailuresLogProps = {
  logs: ScanFailureLog[];
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

export default function ScanFailuresLog({ logs }: ScanFailuresLogProps) {

    const handleExport = () => {
        const headers = ['ID', 'Store', 'Location', 'Error', 'Timestamp'];
        const csvRows = [
            headers.join(','),
            ...logs.map(log => [
                log.id,
                `"${log.store.replace(/"/g, '""')}"`,
                `"${log.location.replace(/"/g, '""')}"`,
                `"${log.error.replace(/"/g, '""')}"`,
                new Date(log.timestamp).toISOString(),
            ].join(','))
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'scan_failure_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle>Scan Failure Log</CardTitle>
            <CardDescription>
            A log of recent QR code scan failures across all locations.
            </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Log
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                    <div className='flex items-center gap-2 font-medium'>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {log.store}
                    </div>
                </TableCell>
                <TableCell>
                     <div className='flex items-center gap-2 text-muted-foreground'>
                        <MapPin className="h-4 w-4" />
                        {log.location}
                    </div>
                </TableCell>
                 <TableCell>
                    <Badge variant="destructive" className="gap-1.5 pl-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {log.error}
                    </Badge>
                </TableCell>
                <TableCell>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                        <Clock className="h-4 w-4" />
                        <ClientFormattedDate timestamp={log.timestamp} />
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
