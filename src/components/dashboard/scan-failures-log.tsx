
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
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Clock, AlertCircle, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import Link from 'next/link';

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
    return <span className="text-xs italic">calculating...</span>;
  }

  return <span>{formattedDate}</span>;
}

export default function ScanFailuresLog({ logs }: ScanFailuresLogProps) {
    
    // Display only the first 3 logs for the preview
    const previewLogs = logs.slice(0, 3);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Scan Failure Log</CardTitle>
        <CardDescription>
        A log of recent QR code scan failures across all locations.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                    <div className='flex items-center gap-2 font-medium'>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {log.store}
                    </div>
                </TableCell>
                 <TableCell>
                    <Badge variant="destructive" className="gap-1.5 pl-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {log.error}
                    </Badge>
                </TableCell>
                <TableCell>
                    <div className='flex items-center gap-2 text-muted-foreground text-sm'>
                        <Clock className="h-4 w-4" />
                        <ClientFormattedDate timestamp={log.timestamp} />
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter>
            <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/system-integration/scan-failures">
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Log
                </Link>
            </Button>
      </CardFooter>
    </Card>
  );
}
