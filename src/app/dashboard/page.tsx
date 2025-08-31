import EngagementMetrics from '@/components/dashboard/engagement-metrics';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { dashboardMetrics } from '@/lib/data';
import StoresByRegion from '@/components/dashboard/stores-by-region';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <EngagementMetrics stats={dashboardMetrics.stats} />
      <Separator />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopProductsTable data={dashboardMetrics.topProducts} />
        </div>
        <div className="lg:col-span-1">
          <StoresByRegion />
        </div>
      </div>
    </div>
  );
}
