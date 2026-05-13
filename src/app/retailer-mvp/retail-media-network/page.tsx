
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Eye, MousePointerClick, TrendingUp, Sparkles, Building2, BarChart3, PlusCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const mockCampaigns = [
    { id: 'cam_1', brand: 'HydroCool', status: 'active', impressions: 12430, clicks: 842, ctr: '6.7%', revenue: 2450.00 },
    { id: 'cam_2', brand: 'EcoWrap', status: 'active', impressions: 8210, clicks: 310, ctr: '3.8%', revenue: 1120.00 },
    { id: 'cam_3', brand: 'LifeTech', status: 'paused', impressions: 4500, clicks: 120, ctr: '2.6%', revenue: 450.00 },
];

const revenueData = [
    { name: 'Mon', revenue: 450 },
    { name: 'Tue', revenue: 520 },
    { name: 'Wed', revenue: 380 },
    { name: 'Thu', revenue: 610 },
    { name: 'Fri', revenue: 740 },
    { name: 'Sat', revenue: 890 },
    { name: 'Sun', revenue: 920 },
];

export default function RetailMediaNetworkPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Retail Media Network</h2>
                    <p className="text-muted-foreground max-w-3xl">
                        Monetise your Persistent Intelligence by offering sponsored placements to supplier brands.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Ad Campaign
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Media Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">R4,020.00</div>
                        <p className="text-xs opacity-70 mt-1">+12.5% from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">25,140</div>
                        <p className="text-xs text-muted-foreground mt-1">High-intent profile views</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">5.1%</div>
                        <p className="text-xs text-muted-foreground mt-1">Intelligence-matched clicks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Platform Yield</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">R0.16</div>
                        <p className="text-xs text-muted-foreground mt-1">Average revenue per scan</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Daily Media Revenue</CardTitle>
                        <CardDescription>Earnings from sponsored placements matched to Smart Profiles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{ revenue: { label: 'Revenue (R)', color: 'hsl(var(--primary))' }}} className="h-[300px] w-full">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R${val}`} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-accent" />
                            Intelligence Matching
                        </CardTitle>
                        <CardDescription>How ads are matched to shoppers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm font-bold mb-1 flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Supplier Affinity
                            </p>
                            <p className="text-xs text-muted-foreground">Supplier brands matched based on shopper's 'Saved Products' history.</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm font-bold mb-1 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" /> Category Intent
                            </p>
                            <p className="text-xs text-muted-foreground">Placement triggered by real-time product category interaction.</p>
                        </div>
                         <div className="pt-4 text-center">
                            <p className="text-xs font-semibold text-primary">Intelligence match accuracy: 94.2%</p>
                         </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Supplier Campaigns</CardTitle>
                    <CardDescription>Monitor the performance and billing status of active media partners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Supplier Brand</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Impressions</TableHead>
                                <TableHead className="text-right">CTR</TableHead>
                                <TableHead className="text-right">Earnings</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockCampaigns.map((cam) => (
                                <TableRow key={cam.id}>
                                    <TableCell className="font-bold">{cam.brand}</TableCell>
                                    <TableCell>
                                        <Badge variant={cam.status === 'active' ? 'default' : 'outline'} className={cam.status === 'active' ? 'bg-green-500/10 text-green-700 border-green-500/20' : ''}>
                                            {cam.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{cam.impressions.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{cam.ctr}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">R{cam.revenue.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
