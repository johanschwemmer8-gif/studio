
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Home,
  QrCode,
  Settings,
  Store,
  TrendingUp,
  Users,
  XCircle,
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

// --- Reusable Components ---

const StatCard = ({ title, value, trend, icon: Icon }: { title: string, value: string, trend: string, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{trend}</p>
    </CardContent>
  </Card>
);

const activityData = [
    { retailer: 'Woolworths', store: 'Sandton City', product: 'Organic Avocados', interaction: 'Scanned', conversion: true, time: 'now' },
    { retailer: 'Pick n Pay', store: 'Claremont', product: 'Free Range Eggs', interaction: 'AI Chat', conversion: false, time: '1m ago' },
    { retailer: 'Dis-Chem', store: 'Gateway', product: 'Vitamin C 1000mg', interaction: 'Scanned', conversion: true, time: '2m ago' },
    { retailer: 'Checkers', store: 'Mall of Africa', product: 'Gourmet Coffee Beans', interaction: 'Scanned', conversion: false, time: '3m ago' },
];

const topQrCodes = [
    { id: 'QR-W-101', product: 'Organic Avocados', retailer: 'Woolworths', scans: '1.2k', conversions: 84, rate: '7.0%' },
    { id: 'QR-P-202', product: 'Free Range Eggs', retailer: 'Pick n Pay', scans: '980', conversions: 62, rate: '6.3%' },
    { id: 'QR-D-303', product: 'Vitamin C 1000mg', retailer: 'Dis-Chem', scans: '850', conversions: 95, rate: '11.2%' },
];

const recentSignups = [
    { name: 'Clicks', date: '2024-05-20', plan: 'Enterprise', status: 'Approved' },
    { name: 'SPAR Group', date: '2024-05-18', plan: 'Pro', status: 'Pending' },
    { name: 'Food Lover\'s Market', date: '2024-05-15', plan: 'Pro', status: 'Approved' },
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
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Active Retailers" value="247" trend="+12% from last month" icon={Store} />
        <StatCard title="QR Codes Generated" value="18,492" trend="+24% from last month" icon={QrCode} />
        <StatCard title="Daily Scans" value="12,847" trend="-3% from yesterday" icon={TrendingUp} />
        <StatCard title="AI Interactions" value="8,934" trend="+18% from yesterday" icon={BrainCircuit} />
      </div>

      {/* Middle Section */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
            {/* Real-time Activity Feed */}
            <Card>
                <CardHeader>
                    <CardTitle>Real-time Activity Feed</CardTitle>
                    <CardDescription>Live stream of QR scans and AI interactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Retailer/Store</TableHead>
                                <TableHead>Product</TableHead>
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
                                    <TableCell>{item.product}</TableCell>
                                    <TableCell><Badge variant="secondary">{item.interaction}</Badge></TableCell>
                                    <TableCell>
                                        <Badge variant={item.conversion ? "default" : "destructive"} className={item.conversion ? "bg-green-500/20 text-green-700" : ""}>
                                            {item.conversion ? 'Yes' : 'No'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             {/* Top Performing QR Codes */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing QR Codes</CardTitle>
                     <CardDescription>Based on scan and conversion volume.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>QR Code</TableHead>
                                <TableHead>Retailer</TableHead>
                                <TableHead>Scans</TableHead>
                                <TableHead>Success Rate</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topQrCodes.map((item, index) =>(
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="font-mono text-xs">{item.id}</div>
                                        <div className="text-sm text-muted-foreground">{item.product}</div>
                                    </TableCell>
                                    <TableCell>{item.retailer}</TableCell>
                                    <TableCell>{item.scans}</TableCell>
                                    <TableCell className="font-semibold text-green-600">{item.rate}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Details</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
        <div className="lg:col-span-2 space-y-6">
            {/* System Health Monitor */}
             <Card>
                <CardHeader>
                    <CardTitle>System Health Monitor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={healthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="api" stroke="#1E3A8A" name="API Response (ms)" />
                            <Line type="monotone" dataKey="ai" stroke="#3B82F6" name="AI Response (ms)" />
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 text-center text-sm">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <p className="font-semibold text-green-800">API Uptime</p>
                            <p className="text-lg font-bold text-green-900">99.98%</p>
                        </div>
                         <div className="p-2 bg-red-100 rounded-lg">
                            <p className="font-semibold text-red-800">Error Rate</p>
                            <p className="text-lg font-bold text-red-900">0.02%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

             {/* Recent Retailer Signups */}
             <Card>
                <CardHeader>
                    <CardTitle>Recent Retailer Signups</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {recentSignups.map(item => (
                            <li key={item.name} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.date} - {item.plan} Plan</p>
                                </div>
                                {item.status === 'Pending' ? (
                                    <Button size="sm">Approve</Button>
                                ) : (
                                     <Badge variant="secondary" className="bg-green-100 text-green-800">{item.status}</Badge>
                                )}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Bottom Section */}
        <Card>
            <CardHeader>
                <CardTitle>Geographic Performance Map</CardTitle>
                 <CardDescription>Heat map of QR scan density across South Africa.</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center bg-muted/50 rounded-md">
                <p className="text-muted-foreground">[Interactive Map of South Africa Placeholder]</p>
            </CardContent>
        </Card>
    </div>
  );
}

