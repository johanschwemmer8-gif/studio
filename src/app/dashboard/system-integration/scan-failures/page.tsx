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
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Clock, AlertCircle, Download } from 'lucide-react';
import { scanFailuresLog } from '@/lib/data';
import { BackButton } from '@/components/ui/back-button';

export default function ScanFailuresPage() {
    
    const handleDownloadPdf = () => {
        // In a real application, this would call a service to generate a PDF.
        // For this demo, we'll use the browser's print functionality.
        window.print();
    };

    return (
        <div className="space-y-8">
            <div>
                <BackButton fallback="/dashboard/system-integration" label="Back to Sandbox" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Scan Failure Log</h2>
                        <p className="text-muted-foreground max-w-3xl">
                            A detailed log of all recent QR code scan failures across all locations.
                        </p>
                    </div>
                    <Button onClick={handleDownloadPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        Download as PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
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
                        {scanFailuresLog.map((log) => (
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
                                    {new Date(log.timestamp).toLocaleString()}
                                </div>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
