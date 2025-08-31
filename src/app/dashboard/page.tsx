import StoresByRegion from '@/components/dashboard/stores-by-region';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="grid gap-8">
        <StoresByRegion />
      </div>
    </div>
  );
}
