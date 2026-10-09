import { Separator } from '@/components/ui/separator';
import RetailerUserAccessManager from '@/components/dashboard/retailer-user-access-manager';

export default function UserAccessPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-3xl font-black tracking-tight">
          User Access
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Manage who can access iNteract, where they operate in your retail
          network, and which platform areas are available to them.
        </p>
      </div>

      <Separator />

      <RetailerUserAccessManager />
    </div>
  );
}
