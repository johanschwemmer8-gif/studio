import EngagementMetrics from '@/components/dashboard/engagement-metrics';
import TopProductsTable from '@/components/dashboard/top-products-table';
import { dashboardMetrics } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

export default function EngagementPage() {
  return (
    <div className="space-y-8">
      <EngagementMetrics stats={dashboardMetrics.stats} />
      <Separator />
      <TopProductsTable data={dashboardMetrics.topProducts} />
    </div>
  );
}
