'use client';

import { OrganizationManager } from '@/components/dashboard/organization-manager';
import { Separator } from '@/components/ui/separator';

export default function OrganizationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight mb-2">My Organization</h2>
        <p className="text-muted-foreground max-w-3xl">
          Build and manage your retail network hierarchy, from global brands down to individual store locations.
        </p>
      </div>
      <Separator />
      <OrganizationManager />
    </div>
  );
}
