import EngagementMetrics from '@/components/dashboard/engagement-metrics';
import StoresByRegion from '@/components/dashboard/stores-by-region';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { Separator } from '@/components/ui/separator';
import { dashboardMetrics } from '@/lib/data';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <EngagementMetrics stats={dashboardMetrics.stats} />
      <Separator />
      <div className="grid lg:grid-cols-2 gap-8">
        <TopProductsTable data={dashboardMetrics.topProducts} />
        <StoresByRegion />
      </div>
    </div>
  );
}
