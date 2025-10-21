
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Eye, TrendingUp, Users, ArrowUp, Percent, BarChart, Loader2 } from 'lucide-react';
import { type SavedRetailer } from '@/app/dashboard/admin/page';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


type RetailerMetric = {
    name: string;
    totalScans: number;
    basketUplift: number;
    revenueUplift: number;
    roi: number;
};

export default function ExecutiveROIPage() {
  const [metrics, setMetrics] = useState<RetailerMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const storedRetailers = localStorage.getItem('savedRetailers');
      if (storedRetailers) {
        const retailers: SavedRetailer[] = JSON.parse(storedRetailers);
        // Here we would fetch real metrics, but for now we'll just map them to empty/zero data
        const initialMetrics = retailers.map(r => ({
            name: r.name,
            totalScans: 0,
            basketUplift: 0,
            revenueUplift: 0,
            roi: 0,
        }));
        setMetrics(initialMetrics);
      }
    } catch (error) {
      console.error("Failed to load retailer data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const totalRevenueUplift = metrics.reduce((acc, curr) => acc + curr.revenueUplift, 0);
  const averageBasketUplift = metrics.length > 0 ? metrics.reduce((acc, curr) => acc + curr.basketUplift, 0) / metrics.length : 0;
  const averageRoi = metrics.length > 0 ? metrics.reduce((acc, curr) => acc + curr.roi, 0) / metrics.length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Executive ROI Dashboard</h2>
        <p className="text-muted-foreground max-w-3xl">
          An executive-level overview of key return on investment metrics across all onboarded retailers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Uplift (YTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalRevenueUplift.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Across all retailers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Basket Uplift</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageBasketUplift.toFixed(1)}%</div>
             <p className="text-xs text-muted-foreground">Average increase per transaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Platform ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRoi.toFixed(2)}x</div>
             <p className="text-xs text-muted-foreground">Average return on investment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retailer Performance Breakdown</CardTitle>
          <CardDescription>
            Key performance indicators for each retailer using the iNteract AOE platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Retailer</TableHead>
                <TableHead className="text-right">Total Scans (YTD)</TableHead>
                <TableHead className="text-right">Avg. Basket Uplift</TableHead>
                <TableHead className="text-right">Revenue Uplift (YTD)</TableHead>
                <TableHead className="text-right">Platform ROI</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : metrics.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No retailers found. Add a retailer in the Admin Panel.</TableCell></TableRow>
              ) : (
                metrics.map((metric) => (
                  <TableRow key={metric.name}>
                    <TableCell className="font-medium">{metric.name}</TableCell>
                    <TableCell className="text-right">{metric.totalScans.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant="secondary" className="gap-1">
                            <ArrowUp className="h-3 w-3 text-green-500"/>
                            {metric.basketUplift.toFixed(1)}%
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">R{metric.revenueUplift.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{metric.roi.toFixed(2)}x</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/retailer-mvp/dashboard?retailer=${metric.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                <Eye className="mr-2 h-4 w-4"/>
                                View MVP
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
