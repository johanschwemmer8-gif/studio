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
  AlertTriangle,
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
        <div>
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Platform Health Overview</h2>
            <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-xs font-black uppercase tracking-widest text-yellow-800">System Monitoring Status: Simulation</AlertTitle>
                <AlertDescription className="text-xs text-yellow-700">
                    Infrastructure telemetry and operational events are currently using simulated benchmarks for the pilot phase. Real-time diagnostic hooks are pending production environment handshake.
                </AlertDescription>
            </Alert>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Column 1 */}
            <div className="lg:col-span-3 space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Retailers</CardTitle></CardHeader><CardContent><div className="text-4xl font-black">0</div><p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Simulation Baseline</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">QR Points</CardTitle></CardHeader><CardContent><div className="text-4xl font-black">0</div><p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Sync Pending</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Daily Volume</CardTitle></CardHeader><CardContent><div className="text-4xl font-black">0</div><p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Load Monitor Off</p></CardContent></Card>
                    <Card className="glassmorphic-card"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Nodes</CardTitle></CardHeader><CardContent><div className="text-4xl font-black">0</div><p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Ari Hub Idle</p></CardContent></Card>
                </div>
                <div className="grid md:grid-cols-5 gap-6">
                    <Card className="md:col-span-3 glassmorphic-card">
                        <CardHeader>
                            <CardTitle className="font-black text-lg">Operational Activity Feed</CardTitle>
                            <CardDescription className="text-xs">Factual log of cross-tenant interaction nodes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow className="text-[10px] uppercase font-black tracking-widest">
                                        <TableHead>Retailer/Store</TableHead>
                                        <TableHead>Interaction</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activityData.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground italic text-xs uppercase tracking-widest opacity-50">No activity recorded during this monitor window.</TableCell></TableRow>
                                    ) : activityData.map((item, index) =>(
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="font-bold">{item.retailer}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{item.store}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary" className="text-[10px] font-bold uppercase">{item.interaction}</Badge></TableCell>
                                            <TableCell>
                                                <Badge variant={item.conversion ? "default" : "destructive"} className="text-[9px] font-black">
                                                    {item.conversion ? 'VERIFIED' : 'NONE'}
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
                            <CardTitle className="font-black text-lg">Latency Benchmarks</CardTitle>
                            <CardDescription className="text-xs">API & Model Response Timings (ms)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[150px] w-full">
                                <LineChart data={healthData} margin={{ top:5, right: 10, left: -20, bottom: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="api" stroke="var(--color-api)" strokeWidth={2} name="API Gateway" />
                                    <Line type="monotone" dataKey="ai" stroke="var(--color-ai)" strokeWidth={2} name="Ari Node" />
                                </LineChart>
                            </ChartContainer>
                            <p className="text-[9px] text-center text-muted-foreground mt-4 italic font-medium">Monitoring simulation benchmarks. Production telemetry inactive.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Column 2 */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="glassmorphic-card">
                    <CardHeader>
                        <CardTitle className="font-black text-lg uppercase tracking-tight">Top Identifiers</CardTitle>
                         <CardDescription className="text-xs">By global scan volume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            {topQrCodes.length === 0 ? (
                                <p className="text-center text-[10px] font-black uppercase text-muted-foreground py-8 opacity-40">Awaiting portfolio reach...</p>
                            ) : topQrCodes.map((item, index) =>(
                                <div key={index} className="flex justify-between items-center">
                                    <div>
                                        <div className="font-mono text-[10px] text-primary font-bold">{item.id}</div>
                                        <div className="text-[10px] font-bold truncate max-w-[100px]">{item.product}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-sm">{item.scans}</div>
                                        <div className="text-[8px] font-black uppercase text-muted-foreground">{item.rate} Yield</div>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </CardContent>
                </Card>
                 <Card className="glassmorphic-card">
                    <CardHeader>
                        <CardTitle className="font-black text-lg uppercase tracking-tight">Network Reach</CardTitle>
                         <CardDescription className="text-xs">Portfolio scan density.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-48 flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40">Map Visualization - Offline</p>
                    </CardContent>
                </Card>
            </div>

        </div>
    </div>
  );
}
