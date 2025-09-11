
'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart2, QrCode, TrendingUp, Link as LinkIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

type QrCodeData = {
  qrCodeId: string;
  targetUrl: string;
  scanCount: number;
  campaignId: string;
};

type ExternalQrCodeData = {
    id: string;
    originalUrl: string;
    interactUrl: string;
    scanCount: number;
    campaignId: string;
};


function AnalyticsCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

export default function ScanAnalytics() {
  const [totalScans, setTotalScans] = useState(0);
  const [topScans, setTopScans] = useState<QrCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [externalTotalScans, setExternalTotalScans] = useState(0);
  const [topExternalScans, setTopExternalScans] = useState<ExternalQrCodeData[]>([]);


  useEffect(() => {
    // Mocking data since we can't use firebase-admin on the client
    setLoading(true);
    setTimeout(() => {
        setTotalScans(1234);
        setTopScans([
            { qrCodeId: 'qr_abc123', targetUrl: 'https://example.com/1', scanCount: 150, campaignId: 'summer-sale' },
            { qrCodeId: 'qr_def456', targetUrl: 'https://example.com/2', scanCount: 120, campaignId: 'summer-sale' },
        ]);
        setExternalTotalScans(567);
        setTopExternalScans([
            { id: 'ext_xyz789', originalUrl: 'https://othersite.com/a', interactUrl: '/track/ext_xyz789', scanCount: 88, campaignId: 'spring-promo' },
            { id: 'ext_uvw456', originalUrl: 'https://othersite.com/b', interactUrl: '/track/ext_uvw456', scanCount: 72, campaignId: 'spring-promo' },
        ]);
        setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 className="text-primary"/> Scan Analytics</CardTitle>
            <CardDescription>
                A real-time overview of QR code performance for both iNteract-generated and imported codes.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsCard title="Total Scans (iNteract)" value={totalScans} icon={QrCode} />
                <AnalyticsCard title="Total Scans (External)" value={externalTotalScans} icon={LinkIcon} />
                <AnalyticsCard title="Combined Total Scans" value={totalScans + externalTotalScans} icon={TrendingUp} />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div>
                    <h3 className="font-semibold mb-2">Top 5 iNteract QR Codes</h3>
                    {loading ? <Skeleton className="h-64 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>QR Code ID</TableHead>
                                    <TableHead>Campaign</TableHead>
                                    <TableHead className="text-right">Scans</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topScans.map((qr) => (
                                <TableRow key={qr.qrCodeId}>
                                    <TableCell className="font-mono text-xs">{qr.qrCodeId}</TableCell>
                                    <TableCell><Badge variant="outline">{qr.campaignId}</Badge></TableCell>
                                    <TableCell className="text-right font-bold text-primary">{qr.scanCount}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Top 5 External QR Codes</h3>
                    {loading ? <Skeleton className="h-64 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Original ID</TableHead>
                                    <TableHead>Campaign</TableHead>
                                    <TableHead className="text-right">Scans</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topExternalScans.map((qr) => (
                                <TableRow key={qr.id}>
                                    <TableCell className="font-mono text-xs">{qr.id}</TableCell>
                                    <TableCell><Badge variant="secondary">{qr.campaignId}</Badge></TableCell>
                                    <TableCell className="text-right font-bold text-primary">{qr.scanCount}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
