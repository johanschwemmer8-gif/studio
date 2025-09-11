
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getAnalyticsSummary, GetAnalyticsSummaryOutput } from '@/ai/flows/get-analytics-summary';
import { BarChart, Download, FileText, LineChart, Loader2, QrCode, RefreshCcw, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Legend, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

type AnalyticsData = Omit<GetAnalyticsSummaryOutput, 'scansByDay'> & {
    scansByDay: { date: Date; count: number }[];
};

function AnalyticsMetricCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
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
    );
}

export default function QrAnalyticsPage() {
    const [range, setRange] = useState('30d');
    const [campaignFilter, setCampaignFilter] = useState<string | undefined>(undefined);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, startLoading] = useTransition();

    useEffect(() => {
        startLoading(async () => {
            const result = await getAnalyticsSummary({
                retailerId: 'simulated-retailer-id',
                campaignId: campaignFilter,
                range: range as any,
            });
            // Convert date strings to Date objects for charting
            const formattedResult = {
                ...result,
                scansByDay: result.scansByDay.map(d => ({ ...d, date: new Date(d.date) })),
            };
            setData(formattedResult);
        });
    }, [range, campaignFilter]);
    
    const allCampaignIds = data?.topCampaignsByScans.map(c => c.campaignId) || [];

    const handleExport = () => {
        if (!data) return;
        const headers = ['QR Code ID', 'Scan Count', 'Campaign ID'];
        const csvRows = [
            headers.join(','),
            ...data.topQrCodesByScans.map(row => 
                [row.qrCodeId, row.count, row.campaignId].join(',')
            )
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `top_qr_codes_${range}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Scan Analytics</h2>
                    <p className="text-muted-foreground max-w-3xl">
                        Analyze QR code performance, track scan trends, and identify your top campaigns.
                    </p>
                </div>
                 {loading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <Select value={range} onValueChange={setRange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={campaignFilter || 'all'} onValueChange={(v) => setCampaignFilter(v === 'all' ? undefined : v)}>
                    <SelectTrigger><SelectValue placeholder="Filter by campaign..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Campaigns</SelectItem>
                        {allCampaignIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <div className="lg:col-span-2 flex justify-end">
                    <Button onClick={handleExport} disabled={!data || data.topQrCodesByScans.length === 0}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export Top Codes
                    </Button>
                </div>
            </div>

            <Separator />
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {loading || !data ? (
                    [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
                ) : (
                    <>
                        <AnalyticsMetricCard title="Total Scans" value={data.totalScans} icon={QrCode} />
                        <AnalyticsMetricCard title="Top Campaign" value={data.topCampaignsByScans[0]?.campaignId || 'N/A'} icon={TrendingUp} />
                        <AnalyticsMetricCard title="ZIP Downloads" value={data.zipDownloadCountsByDay.reduce((acc, curr) => acc + curr.count, 0)} icon={Download} />
                        <AnalyticsMetricCard title="Regenerations" value={data.regenerationCountsByRequest.reduce((acc, curr) => acc + curr.count, 0)} icon={RefreshCcw} />
                    </>
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LineChart className="text-primary"/> Scans by Day</CardTitle>
                        <CardDescription>Scan volume over the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading || !data ? <Skeleton className="h-64 w-full" /> : (
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsLineChart data={data.scansByDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickFormatter={(d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" name="Scans" />
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart className="text-primary"/> Top Campaigns by Scans</CardTitle>
                        <CardDescription>Performance of your top 5 campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading || !data ? <Skeleton className="h-64 w-full" /> : (
                             <ResponsiveContainer width="100%" height={250}>
                                <RechartsBarChart data={data.topCampaignsByScans.slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="campaignId" angle={-45} textAnchor="end" height={60} />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Scans" />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top 20 Scanned QR Codes</CardTitle>
                    <CardDescription>The most popular individual QR codes in this period.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading || !data ? <Skeleton className="h-96 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>QR Code ID</TableHead>
                                    <TableHead>Campaign</TableHead>
                                    <TableHead className="text-right">Scan Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.topQrCodesByScans.slice(0, 20).map((qr) => (
                                    <TableRow key={qr.qrCodeId}>
                                        <TableCell className="font-mono text-xs">{qr.qrCodeId}</TableCell>
                                        <TableCell>{qr.campaignId}</TableCell>
                                        <TableCell className="text-right font-bold">{qr.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
