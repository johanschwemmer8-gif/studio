
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BrainCircuit,
  CheckCircle2,
  QrCode,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const activityData: { retailer: string; store: string; product: string; interaction: string; conversion: boolean; time: string; }[] = [];

const topQrCodes: { id: string; product: string; retailer: string; scans: string; conversions: number; rate: string; }[] = [];

const healthData: { name: string; api: number; ai: number; }[] = [];

const chartConfig = {
  api: {
    label: 'API (ms)',
    color: 'hsl(var(--chart-1))',
  },
  ai: {
    label: 'AI (ms)',
    color: 'hsl(var(--chart-2))',
  },
};


export default function BackendManagementDashboard() {

  return (
    <div className="flex-1 space-y-6">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Column 1 */}
            <div className="lg:col-span-3 space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Active Retailers</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">0</div><p className="text-xs text-muted-foreground">+0% from last month</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">QR Codes Generated</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">0</div><p className="text-xs text-muted-foreground">+0% from last month</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Daily Scans</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">0</div><p className="text-xs text-muted-foreground">+0% from yesterday</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">AI Interactions</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">0</div><p className="text-xs text-muted-foreground">+0% from yesterday</p></CardContent></Card>
                </div>
                <div className="grid md:grid-cols-5 gap-6">
                    <Card className="md:col-span-3 glassmorphic-card">
                        <CardHeader>
                            <CardTitle>Real-time Activity Feed</CardTitle>
                            <CardDescription>Live stream of QR scans and AI interactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Retailer/Store</TableHead>
                                        <TableHead>Interaction</TableHead>
                                        <TableHead>Conversion</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activityData.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No activity yet.</TableCell></TableRow>
                                    ) : activityData.map((item, index) =>(
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="font-medium">{item.retailer}</div>
                                                <div className="text-sm text-muted-foreground">{item.store}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary">{item.interaction}</Badge></TableCell>
                                            <TableCell>
                                                <Badge variant={item.conversion ? "default" : "destructive"}>
                                                    {item.conversion ? 'Yes' : 'No'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2 glassmorphic-card">
                        <CardHeader>
                            <CardTitle>System Health</CardTitle>
                            <CardDescription>API & AI Model Response Times</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[150px] w-full">
                                <LineChart data={healthData} margin={{ top:5, right: 10, left: -20, bottom: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="api" stroke="var(--color-api)" strokeWidth={2} name="API (ms)" />
                                    <Line type="monotone" dataKey="ai" stroke="var(--color-ai)" strokeWidth={2} name="AI (ms)" />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Column 2 */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="glassmorphic-card">
                    <CardHeader>
                        <CardTitle>Top Performing QR Codes</CardTitle>
                         <CardDescription>By scan & conversion volume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            {topQrCodes.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">No data available.</p>
                            ) : topQrCodes.map((item, index) =>(
                                <div key={index} className="flex justify-between items-center">
                                    <div>
                                        <div className="font-mono text-xs">{item.id}</div>
                                        <div className="text-sm text-muted-foreground">{item.product}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{item.scans} Scans</div>
                                        <div className="text-xs font-semibold text-primary">{item.rate} CTR</div>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </CardContent>
                </Card>
                 <Card className="glassmorphic-card">
                    <CardHeader>
                        <CardTitle>Geographic Performance</CardTitle>
                         <CardDescription>Heat map of QR scan density.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-48 flex items-center justify-center bg-muted/20 rounded-md">
                        <p className="text-muted-foreground">[Interactive Map Placeholder]</p>
                    </CardContent>
                </Card>
            </div>

        </div>
    </div>
  );
}
