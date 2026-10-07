'use server';

import { z } from 'zod';
import { getDb } from '@/lib/firebase-admin';
import { verifyPlatformOperator } from '@/lib/auth-server';

const CreateRetailerTenantInputSchema = z.object({
  idToken: z.string().min(1),
  name: z.string().trim().min(1).max(120),
});

export type CreateRetailerTenantInput = z.infer<
  typeof CreateRetailerTenantInputSchema
>;

export type CreateRetailerTenantOutput = {
  success: boolean;
  message: string;
  retailerId?: string;
};

function slugifyRetailerName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

export async function createRetailerTenant(
  rawInput: CreateRetailerTenantInput
): Promise<CreateRetailerTenantOutput> {
  try {
    const input = CreateRetailerTenantInputSchema.parse(rawInput);
    const operator = await verifyPlatformOperator(input.idToken);

    const retailerId = slugifyRetailerName(input.name);

    if (!retailerId) {
      return {
        success: false,
        message: 'Retailer name does not produce a valid tenant identifier.',
      };
    }

    const db = getDb();

    if (!db) {
      return {
        success: false,
        message: 'Infrastructure Unavailable: Firestore.',
      };
    }
    const tenantRef = db.collection('tenants').doc(retailerId);
    const existing = await tenantRef.get();

    if (existing.exists) {
      return {
        success: false,
        message: 'A retailer with this tenant identifier already exists.',
      };
    }

    const now = new Date();

    await tenantRef.create({
      name: input.name,
      type: 'production',
      lifecycleStatus: 'ACTIVE',
      // Temporary compatibility field for existing provisioning flows.
      // lifecycleStatus is canonical and this field will be retired
      // when all dependent flows have migrated.
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: operator.uid,
    });

    return {
      success: true,
      message: `"${input.name}" retailer registry created.`,
      retailerId,
    };
  } catch (error) {
    console.error('[Create Retailer Tenant] Failed:', error);

    return {
      success: false,
      message: 'Retailer creation failed.',
    };
  }
}
