'use client';

import { Suspense } from 'react';
import { OrganizationManager } from '@/components/dashboard/organization-manager';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function OrganizationPageContent() {
  const searchParams = useSearchParams();
  const retailerId = searchParams.get('retailer');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight mb-2">My Organization</h2>
        <p className="text-muted-foreground max-w-3xl">
          Build and manage your retail network hierarchy, from global brands down to individual store locations.
        </p>
      </div>
      <Separator />
      <OrganizationManager retailerId={retailerId || undefined} />
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>}>
      <OrganizationPageContent />
    </Suspense>
  );
}
