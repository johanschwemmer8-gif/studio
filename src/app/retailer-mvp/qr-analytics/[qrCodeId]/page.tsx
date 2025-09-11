
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQrCodeDetails, GetQrCodeDetailsOutput } from '@/ai/flows/get-qr-code-details';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, FileText, Globe, Link as LinkIcon, Loader2, QrCode, Tag, UserAgent, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type DrilldownData = Omit<GetQrCodeDetailsOutput, 'scansByDay'> & {
    scansByDay: { date: Date; count: number }[];
};

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number | null }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{label}:</span>
            <span className="text-muted-foreground">{value || 'N/A'}</span>
        </div>
    )
}

export default function QrScanDrilldownPage() {
    const [data, setData] = useState<DrilldownData | null>(null);
    const [loading, startLoading] = useTransition();
    const router = useRouter();
    const params = useParams();
    const qrCodeId = params.qrCodeId as string;

    useEffect(() => {
        if (!qrCodeId) return;

        startLoading(async () => {
            try {
                const result = await getQrCodeDetails({
                    retailerId: 'simulated-retailer-id',
                    qrCodeId,
                });
                setData({
                    ...result,
                    scansByDay: result.scansByDay.map(d => ({ ...d, date: new Date(d.date) })),
                });
            } catch (error) {
                console.error(error);
                // Handle error state, maybe show a toast
            }
        });
    }, [qrCodeId]);

    const handleExport = () => {
        if (!data) return;
        const headers = ['Timestamp', 'User Agent', 'Referrer', 'IP Address'];
        const csvRows = [
            headers.join(','),
            ...data.scanEvents.map(event =>
                [
                    `"${new Date(event.timestamp).toLocaleString()}"`,
                    `"${event.userAgent}"`,
                    `"${event.referrer || 'N/A'}"`,
                    `"${event.ip}"`
                ].join(',')
            )
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `scans_${qrCodeId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const chartConfig = {
      scans: {
        label: "Scans",
        color: "hsl(var(--primary))",
      },
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                     <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Analytics
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight">QR Code Drilldown</h2>
                    <p className="text-muted-foreground max-w-3xl font-mono text-sm">{qrCodeId}</p>
                </div>
                 {loading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            </div>
            
            {loading || !data ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Skeleton className="md:col-span-1 h-96" />
                    <Skeleton className="md:col-span-2 h-96" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    <Card className="md:col-span-1 sticky top-20">
                        <CardHeader>
                            <CardTitle>QR Code Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted rounded-md p-4 flex justify-center border">
                                <Image src={data.metadata.signedUrl} alt={qrCodeId} width={150} height={150} />
                            </div>
                            <div className="space-y-2">
                                <DetailItem icon={QrCode} label="Total Scans" value={data.metadata.scanCount.toLocaleString()} />
                                <DetailItem icon={Tag} label="Campaign" value={data.metadata.campaignId} />
                                <DetailItem icon={Calendar} label="Created" value={new Date(data.metadata.createdAt).toLocaleDateString()} />
                                {data.metadata.expiresAt && <DetailItem icon={Calendar} label="Expires" value={new Date(data.metadata.expiresAt).toLocaleDateString()} />}
                                <DetailItem icon={LinkIcon} label="Target URL" value={data.metadata.originalTargetUrl} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Scans Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                    <RechartsLineChart data={data.scansByDay} margin={{ left: 12, right: 12 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                        <Tooltip content={<ChartTooltipContent hideIndicator />} />
                                        <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" name="Scans" strokeWidth={2} dot={false}/>
                                    </RechartsLineChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Recent Scan Events</CardTitle>
                                    <CardDescription>The last 20 scans for this QR code.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleExport}><FileText className="mr-2"/>Export</Button>
                            </CardHeader>
                             <CardContent>
                                 <Table>
                                     <TableHeader>
                                         <TableRow>
                                             <TableHead>Timestamp</TableHead>
                                             <TableHead>User Agent</TableHead>
                                             <TableHead>Referrer</TableHead>
                                         </TableRow>
                                     </TableHeader>
                                     <TableBody>
                                         {data.scanEvents.slice(0, 20).map(event => (
                                             <TableRow key={event.id}>
                                                 <TableCell>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(event.timestamp).toLocaleString()}
                                                    </div>
                                                 </TableCell>
                                                 <TableCell>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <UserAgent className="h-3 w-3" />
                                                        <span className="truncate max-w-xs">{event.userAgent}</span>
                                                    </div>
                                                 </TableCell>
                                                 <TableCell>
                                                    <div className="flex items-center gap-2 text-xs">
                                                         <Globe className="h-3 w-3" />
                                                        {event.referrer ? <Badge variant="secondary">{event.referrer}</Badge> : 'Direct'}
                                                    </div>
                                                 </TableCell>
                                             </TableRow>
                                         ))}
                                     </TableBody>
                                 </Table>
                             </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
