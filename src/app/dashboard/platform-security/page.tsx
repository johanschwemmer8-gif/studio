
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

const activityData = [
    { retailer: 'Woolworths', store: 'Sandton City', product: 'Organic Avocados', interaction: 'Scanned', conversion: true, time: 'now' },
    { retailer: 'Pick n Pay', store: 'Claremont', product: 'Free Range Eggs', interaction: 'AI Chat', conversion: false, time: '1m ago' },
    { retailer: 'Dis-Chem', store: 'Gateway', product: 'Vitamin C 1000mg', interaction: 'Scanned', conversion: true, time: '2m ago' },
    { retailer: 'Checkers', store: 'Mall of Africa', product: 'Gourmet Coffee Beans', interaction: 'Scanned', conversion: false, time: '3m ago' },
    { retailer: 'SPAR', store: 'Constantia', product: 'Artisan Sourdough', interaction: 'Scanned', conversion: true, time: '5m ago' },
];

const topQrCodes = [
    { id: 'QR-W-101', product: 'Organic Avocados', retailer: 'Woolworths', scans: '1.2k', conversions: 84, rate: '7.0%' },
    { id: 'QR-P-202', product: 'Free Range Eggs', retailer: 'Pick n Pay', scans: '980', conversions: 62, rate: '6.3%' },
    { id: 'QR-D-303', product: 'Vitamin C 1000mg', retailer: 'Dis-Chem', scans: '850', conversions: 95, rate: '11.2%' },
];

const healthData = [
  { name: '00:00', api: 50, ai: 120 },
  { name: '06:00', api: 60, ai: 130 },
  { name: '12:00', api: 55, ai: 125 },
  { name: '18:00', api: 70, ai: 140 },
  { name: '23:59', api: 65, ai: 135 },
];


export default function BackendManagementDashboard() {

  return (
    <div className="flex-1 space-y-6">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Column 1 */}
            <div className="lg:col-span-3 space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Active Retailers</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">247</div><p className="text-xs text-muted-foreground">+12% from last month</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">QR Codes Generated</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">18,492</div><p className="text-xs text-muted-foreground">+24% from last month</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Daily Scans</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">12,847</div><p className="text-xs text-muted-foreground">-3% from yesterday</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">AI Interactions</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">8,934</div><p className="text-xs text-muted-foreground">+18% from yesterday</p></CardContent></Card>
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
                                    {activityData.map((item, index) =>(
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
                             <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={healthData} margin={{ top:5, right: 10, left: -20, bottom: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<div className="rounded-lg border bg-background/95 p-2 text-sm shadow-sm backdrop-blur-sm">Hello</div>} />
                                    <Line type="monotone" dataKey="api" stroke="hsl(var(--chart-1))" strokeWidth={2} name="API (ms)" />
                                    <Line type="monotone" dataKey="ai" stroke="hsl(var(--chart-2))" strokeWidth={2} name="AI (ms)" />
                                </LineChart>
                            </ResponsiveContainer>
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
                            {topQrCodes.map((item, index) =>(
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
