'use server';

import { z } from 'zod';

import { verifyAuth } from './auth-server';
import { admin, getDb } from './firebase-admin';
import {
  RetailMediaPartnerSchema,
  type RetailMediaPartner,
} from './schemas/retail-media-partner';

const CreateRetailMediaPartnerInputSchema = z.object({
  idToken: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
});

export type CreateRetailMediaPartnerInput = z.infer<
  typeof CreateRetailMediaPartnerInputSchema
>;

export type ListRetailMediaPartnersInput = {
  idToken?: string;
};

function requireRetailMediaRetailerAuth(
  auth: Awaited<ReturnType<typeof verifyAuth>>
) {
  if ('error' in auth) {
    throw new Error('AUTHENTICATION_FAILED');
  }

  if (!auth.isActive) {
    throw new Error('AUTHORIZATION_DENIED');
  }

  if (!auth.retailerId) {
    throw new Error('RETAILER_SCOPE_REQUIRED');
  }

  if (auth.permissions.retailMediaNetwork !== true) {
    throw new Error('RETAIL_MEDIA_PERMISSION_REQUIRED');
  }

  return auth;
}

export async function createRetailMediaPartner(
  input: CreateRetailMediaPartnerInput
): Promise<RetailMediaPartner> {
  const parsedInput = CreateRetailMediaPartnerInputSchema.parse(input);

  const auth = requireRetailMediaRetailerAuth(
    await verifyAuth(parsedInput.idToken)
  );

  const db = getDb();
  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const partnerRef = db.collection('retailMediaPartners').doc();

  const timestamp = admin.firestore.Timestamp.now();

  const partner = RetailMediaPartnerSchema.parse({
    partnerId: partnerRef.id,
    retailerId: auth.retailerId,
    name: parsedInput.name,
    status: 'ACTIVE',
    logoUrl: parsedInput.logoUrl,
    websiteUrl: parsedInput.websiteUrl,
    createdAt: timestamp,
    createdBy: auth.uid,
    updatedAt: timestamp,
    updatedBy: auth.uid,
  });

  await partnerRef.set(partner);

  return partner;
}

export async function listRetailMediaPartners(
  input: ListRetailMediaPartnersInput
): Promise<RetailMediaPartner[]> {
  const auth = requireRetailMediaRetailerAuth(
    await verifyAuth(input.idToken)
  );

  const db = getDb();
  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const snapshot = await db
    .collection('retailMediaPartners')
    .where('retailerId', '==', auth.retailerId)
    .get();

  return snapshot.docs.map(doc => {
    const parsed = RetailMediaPartnerSchema.safeParse(doc.data());

    if (!parsed.success) {
      throw new Error(
        `RETAIL_MEDIA_PARTNER_INTEGRITY_ERROR: ${doc.id}`
      );
    }

    if (parsed.data.retailerId !== auth.retailerId) {
      throw new Error(
        `RETAIL_MEDIA_PARTNER_SCOPE_MISMATCH: ${doc.id}`
      );
    }

    return parsed.data;
  });
}
