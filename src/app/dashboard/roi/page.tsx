
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { QrCode, User, Clock, TrendingUp } from 'lucide-react';
import ScanFrequencyChart from '@/components/dashboard/scan-frequency-chart';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { dashboardMetrics } from '@/lib/data';

export default function RoiPage() {
  const metrics = dashboardMetrics.getMetrics(null); // Using all stores data for this page

  const engagementData = {
    totalScans: metrics.stats.totalScans,
    uniqueScans: metrics.stats.uniqueScans,
    engagementDuration: metrics.stats.engagementDuration,
    scanRate: metrics.stats.scanRate,
  };

  const scanFrequencyData = [
    { name: 'Jan', scans: 240 },
    { name: 'Feb', scans: 139 },
    { name: 'Mar', scans: 980 },
    { name: 'Apr', scans: 390 },
    { name: 'May', scans: 480 },
    { name: 'Jun', scans: 380 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Core Engagement Metrics
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          These features track customer interaction with the platform and validate the adoption of the QR code system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Scans
            </CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.totalScans.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All QR code scans across all stores.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Scans
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementData.uniqueScans.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Individual customers who have scanned.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementData.scanRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on total scans vs. unique visitors.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
             Engagement Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.engagementDuration}s</div>
            <p className="text-xs text-muted-foreground">
              Average time spent on product page.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ScanFrequencyChart data={scanFrequencyData} />
        <TopProductsTable data={metrics.topProducts} />
      </div>
    </div>
  );
}
