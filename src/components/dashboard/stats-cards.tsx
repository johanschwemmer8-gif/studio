import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, BarChart } from 'lucide-react';

type Stats = {
  totalScans: number;
  uniqueProducts: number;
  recommendationCTR: number;
  customerConversionRate: number;
  qrCodeScanRate: number;
  averageTransactionValue: number;
  gmroi: number;
};

export default function StatsCards({ stats }: { stats: Stats }) {
  return (
    <>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Transactional & Profitability</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Transaction Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.averageTransactionValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              GMROI
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gmroi.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
