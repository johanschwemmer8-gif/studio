import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScanLine, Sparkles, Target, Percent, QrCode } from 'lucide-react';

type Stats = {
  totalScans: number;
  uniqueProducts: number;
  recommendationCTR: number;
  customerConversionRate: number;
  qrCodeScanRate: number;
};

export default function StatsCards({ stats }: { stats: Stats }) {
  return (
    <>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Sales & Performance</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <ScanLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalScans.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Products Scanned
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.uniqueProducts.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recommendation CTR
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recommendationCTR}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-semibold">Engagement & Acquisition</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Conversion Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customerConversionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              QR Code Scan Rate
            </CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qrCodeScanRate}%</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
