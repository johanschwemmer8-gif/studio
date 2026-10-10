'use server';

import { verifyPlatformOperator } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import {
  normalizeTenantDocument,
  type TenantLifecycleStatus,
} from '@/lib/schemas/tenant';

export type UpdateManagerTenant = {
  retailerId: string;
  retailerName: string;
  tenantType: 'production' | 'test';
  lifecycleStatus: TenantLifecycleStatus;
};

export type UpdateManagerEstate = {
  totalTenants: number;
  productionTenants: number;
  testTenants: number;
  activeTenants: number;
  offboardingTenants: number;
  suspendedTenants: number;
  decommissionedTenants: number;
  tenants: UpdateManagerTenant[];
};

export type UpdateManagerSnapshot = {
  calculatedAt: string;
  deliveryModel: {
    source: 'GitHub main';
    runtime: 'Firebase App Hosting';
    deploymentMode: 'Central SaaS deployment';
  };
  releaseRegister: {
    configured: false;
    message: string;
  };
  featureAvailability: {
    configured: false;
    message: string;
  };
  estate: UpdateManagerEstate;
};

export async function getUpdateManagerSnapshot(
  idToken: string
): Promise<UpdateManagerSnapshot> {
  await verifyPlatformOperator(idToken);

  const db = getDb();

  if (!db) {
    throw new Error(
      'UPDATE_MANAGER_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const snapshot = await db.collection('tenants').get();

  const tenants = snapshot.docs
    .map(document =>
      normalizeTenantDocument(
        document.id,
        document.data() as Record<string, unknown>
      )
    )
    .map(tenant => ({
      retailerId: tenant.id,
      retailerName: tenant.name,
      tenantType: tenant.type,
      lifecycleStatus: tenant.lifecycleStatus,
    }))
    .sort((a, b) => a.retailerName.localeCompare(b.retailerName));

  const countLifecycle = (status: TenantLifecycleStatus) =>
    tenants.filter(tenant => tenant.lifecycleStatus === status).length;

  return {
    calculatedAt: new Date().toISOString(),
    deliveryModel: {
      source: 'GitHub main',
      runtime: 'Firebase App Hosting',
      deploymentMode: 'Central SaaS deployment',
    },
    releaseRegister: {
      configured: false,
      message:
        'No authoritative release register is currently configured.',
    },
    featureAvailability: {
      configured: false,
      message:
        'No tenant-specific feature availability model is currently configured.',
    },
    estate: {
      totalTenants: tenants.length,
      productionTenants: tenants.filter(
        tenant => tenant.tenantType === 'production'
      ).length,
      testTenants: tenants.filter(
        tenant => tenant.tenantType === 'test'
      ).length,
      activeTenants: countLifecycle('ACTIVE'),
      offboardingTenants: countLifecycle('OFFBOARDING'),
      suspendedTenants: countLifecycle('SUSPENDED'),
      decommissionedTenants: countLifecycle('DECOMMISSIONED'),
      tenants,
    },
  };
}
