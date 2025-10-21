
'use server';
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
import { getScanAnalytics } from '@/ai/flows/scan-analytics';


type QrCodeData = {
  qrCodeId: string;
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

export default async function ScanAnalytics() {
  // Fetch real data from the backend flow instead of using mock data
  const analyticsData = await getScanAnalytics({
    retailerId: 'simulated-retailer-id', // In a real app, this would come from auth
    limit: 1000,
  });

  const { totalScans, uniqueScans, topScannedCodes } = analyticsData;

  // For this example, we'll assume external scans are not yet tracked in this flow.
  const externalTotalScans = 0;
  const topExternalScans: any[] = [];

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
                <AnalyticsCard title="Total Scans (iNteract)" value={totalScans.toLocaleString()} icon={QrCode} />
                <AnalyticsCard title="Unique QR Codes Scanned" value={uniqueScans.toLocaleString()} icon={TrendingUp} />
                <AnalyticsCard title="Total Scans (External)" value={externalTotalScans.toLocaleString()} icon={LinkIcon} />
                <AnalyticsCard title="Combined Total Scans" value={(totalScans + externalTotalScans).toLocaleString()} icon={TrendingUp} />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div>
                    <h3 className="font-semibold mb-2">Top 5 iNteract QR Codes</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>QR Code ID</TableHead>
                                <TableHead>Campaign</TableHead>
                                <TableHead className="text-right">Scans</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topScannedCodes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No scan data available yet.
                                    </TableCell>
                                </TableRow>
                            ) : topScannedCodes.slice(0, 5).map((qr) => (
                            <TableRow key={qr.qrCodeId}>
                                <TableCell className="font-mono text-xs">{qr.qrCodeId}</TableCell>
                                <TableCell><Badge variant="outline">{qr.campaignId}</Badge></TableCell>
                                <TableCell className="text-right font-bold text-primary">{qr.scanCount}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Top 5 External QR Codes</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Original ID</TableHead>
                                <TableHead>Campaign</TableHead>
                                <TableHead className="text-right">Scans</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topExternalScans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No external scan data available yet.
                                    </TableCell>
                                </TableRow>
                            ) : topExternalScans.slice(0, 5).map((qr) => (
                            <TableRow key={qr.id}>
                                <TableCell className="font-mono text-xs">{qr.id}</TableCell>
                                <TableCell><Badge variant="secondary">{qr.campaignId}</Badge></TableCell>
                                <TableCell className="text-right font-bold text-primary">{qr.scanCount}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
