'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { Building2, Loader2 } from 'lucide-react';

import { OrganizationManager } from '@/components/dashboard/organization-manager';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import {
  normalizeTenantDocument,
  type SavedRetailer,
} from '@/lib/schemas/tenant';

export default function RetailerNetworkPage() {
  const params = useParams();
  const retailerId = params.retailerName as string;

  const [retailer, setRetailer] = useState<SavedRetailer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRetailer() {
      if (!db || !retailerId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'tenants', retailerId));

        if (snapshot.exists()) {
          setRetailer(
            normalizeTenantDocument(snapshot.id, snapshot.data())
          );
        }
      } catch (error) {
        console.error('Failed to load selected retailer network context.', error);
      } finally {
        setLoading(false);
      }
    }

    void loadRetailer();
  }, [retailerId]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!retailer) {
    return (
      <div className="space-y-6">
        <BackButton
          fallback="/dashboard/admin"
          label="Back to Retailers"
        />

        <div>
          <h2 className="text-2xl font-bold">Retailer Not Found</h2>
          <p className="text-muted-foreground">
            The selected retailer could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackButton
        fallback={`/dashboard/admin/view/${retailer.id}`}
        label={`Back to ${retailer.name}`}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-black tracking-tight">
            {retailer.name} Network
          </h2>
          <Badge variant="outline">Platform Administration</Badge>
        </div>

        <p className="max-w-3xl text-muted-foreground">
          Manage the authoritative organisational hierarchy for this selected
          retailer. This administrative context does not impersonate a retailer
          user or change your Platform Operator identity.
        </p>

        <p className="text-xs font-medium text-muted-foreground">
          Tenant ID: {retailer.id}
        </p>
      </div>

      <OrganizationManager
        retailerId={retailer.id}
        platformContext
      />
    </div>
  );
}
