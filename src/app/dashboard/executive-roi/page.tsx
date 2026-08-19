
'use server';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Eye, TrendingUp, Users, ArrowUp, Percent, BarChart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getExecutiveRoiMetrics } from '@/ai/flows/get-executive-roi-metrics';

/**
 * EXECUTIVE ROI DASHBOARD
 * Provides an aggregate view of platform performance across all retailers.
 * STATUS: SIMULATED (Requires production ERP integration for verified uplift).
 */
export default async function ExecutiveROIPage() {
  const { metrics, aggregates } = await getExecutiveRoiMetrics();

  const { totalRevenueUplift, averageBasketUplift, averageRoi } = aggregates;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Executive ROI Dashboard</h2>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Factual summary of associated revenue and calculated uplift across the portfolio. 
          Financial indicators are based on <span className="font-bold text-primary italic">simulated transaction data</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary shadow-sm text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Total Associated Revenue (SIM)</CardTitle>
            <DollarSign className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">R{totalRevenueUplift.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <p className="text-[10px] opacity-70 mt-1 italic">Total volume in engaged shopper sessions.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Avg. Basket Uplift</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{averageBasketUplift.toFixed(1)}%</div>
             <p className="text-[10px] text-muted-foreground mt-1">Observed delta vs non-engaged baseline.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Portfolio ROI (SIM)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">{averageRoi.toFixed(2)}x</div>
             <p className="text-[10px] text-muted-foreground mt-1">Calculated projection for pilot phase.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="font-black text-lg">Retailer Performance Audit</CardTitle>
          <CardDescription>
            Associated metrics per tenant using canonical GTIN-14 resolution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Retailer</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Unique Scans (YTD)</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Basket Delta</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Associated Rev (SIM)</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Calculated ROI</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Initializing portfolio stream...</TableCell></TableRow>
              ) : (
                metrics.map((metric) => (
                  <TableRow key={metric.name} className="group transition-colors">
                    <TableCell className="font-bold">{metric.name}</TableCell>
                    <TableCell className="text-right font-mono">{metric.totalScans.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200 font-bold py-0">
                            <ArrowUp className="h-3 w-3"/>
                            {metric.basketUplift.toFixed(1)}%
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">R{metric.revenueUplift.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right font-black text-primary">{metric.roi.toFixed(2)}x</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="font-bold text-[10px] uppercase">
                            <Link href={`/retailer-mvp/dashboard?retailer=${metric.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                <Eye className="mr-2 h-3.5 w-3.5"/>
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
