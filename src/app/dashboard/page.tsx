import EngagementMetrics from '@/components/dashboard/engagement-metrics';
import StoresByRegion from '@/components/dashboard/stores-by-region';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { Separator } from '@/components/ui/separator';
import { dashboardMetrics } from '@/lib/data';
import PerformanceMetrics from '@/components/dashboard/performance-metrics';
import TimeBasedPerformanceChart from '@/components/dashboard/time-based-performance-chart';
import RealTimeStockLevels from '@/components/dashboard/real-time-stock-levels';
import DataSynchronizationLogs from '@/components/dashboard/data-synchronization-logs';


export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <EngagementMetrics stats={dashboardMetrics.stats} />
      <Separator />
      <PerformanceMetrics stats={dashboardMetrics.stats} />
      <Separator />
      <div className="grid lg:grid-cols-2 gap-8">
        <TopProductsTable data={dashboardMetrics.topProducts} />
        <TimeBasedPerformanceChart data={dashboardMetrics.timeBasedPerformance} />
      </div>
      <Separator />
      <div>
        <h2 className="text-xl font-semibold mb-4">Data Integration Metrics</h2>
        <div className="grid lg:grid-cols-2 gap-8">
            <RealTimeStockLevels data={dashboardMetrics.dataIntegration.stockLevels} />
            <DataSynchronizationLogs logs={dashboardMetrics.dataIntegration.syncLogs} />
        </div>
      </div>
      <Separator />
      <StoresByRegion />
    </div>
  );
}
