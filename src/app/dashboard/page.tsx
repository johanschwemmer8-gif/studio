import { dashboardMetrics } from '@/lib/data';
import StatsCards from '@/components/dashboard/stats-cards';
import SalesPerformanceChart from '@/components/dashboard/sales-performance-chart';
import TopProductsTable from '@/components/dashboard/top-products-table';
import ScanFrequencyChart from '@/components/dashboard/scan-frequency-chart';
import StoresByRegion from '@/components/dashboard/stores-by-region';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <StatsCards stats={dashboardMetrics.stats} />
      <div className="grid gap-8 grid-cols-1">
        <SalesPerformanceChart data={dashboardMetrics.salesPerformance} />
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScanFrequencyChart data={dashboardMetrics.scanFrequency} />
        </div>
        <div className="lg:col-span-1">
          <TopProductsTable data={dashboardMetrics.topProducts} />
        </div>
      </div>
      <StoresByRegion />
    </div>
  );
}
