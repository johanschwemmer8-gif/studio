'use client';

import { OrganizationManager } from '@/components/dashboard/organization-manager';
import { ReportingCalendarManager } from '@/components/dashboard/reporting-calendar-manager';
import { Separator } from '@/components/ui/separator';

export default function OrganizationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-3xl font-black tracking-tight">
          My Retail Network
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Configure your retail network structure and the authoritative
          reporting framework used across iNteract.
        </p>
      </div>

      <Separator />

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">Network Structure</h3>
          <p className="text-sm text-muted-foreground">
            Build and manage your retail hierarchy from brands and
            divisions through regions, areas and individual stores.
          </p>
        </div>

        <OrganizationManager />
      </section>

      <Separator />

      <section className="space-y-4">
        <ReportingCalendarManager />
      </section>
    </div>
  );
}
