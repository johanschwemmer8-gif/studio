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
                <BackButton fallback="/dashboard/system-integration" label="Back to Test Laboratory" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight uppercase leading-none">Failure Log</h2>
                        <p className="text-muted-foreground max-w-3xl text-sm mt-2">
                            Factual audit of all recent QR code scan failures across the global store network.
                        </p>
                    </div>
                    <Button onClick={handleDownloadPdf} variant="outline" className="font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                        <Download className="mr-2 h-4 w-4" />
                        Export Log (PDF)
                    </Button>
                </div>
            </div>

            <Card className="border-primary/10 shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Recent Failures</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="text-[10px] font-black uppercase tracking-widest">
                        <TableHead className="px-6">Store Location</TableHead>
                        <TableHead>In-Store Area</TableHead>
                        <TableHead>Error Reason</TableHead>
                        <TableHead className="text-right px-6">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scanFailuresLog.map((log) => (
                        <TableRow key={log.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="px-6 font-bold text-sm">
                                <div className='flex items-center gap-2'>
                                    <Building2 className="h-4 w-4 text-primary" />
                                    {log.store}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className='flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold'>
                                    <MapPin className="h-3.5 w-3.5" />
                                    {log.location}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1.5 pl-1.5 text-[9px] font-black uppercase">
                                    <AlertCircle className="h-3 w-3" />
                                    {log.error}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right px-6">
                                <div className='flex items-center justify-end gap-2 text-muted-foreground text-[10px] font-mono'>
                                    <Clock className="h-3.5 w-3.5" />
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
