'use server';

import { z } from 'zod';

import { verifyAuth } from './auth-server';
import { admin, getDb } from './firebase-admin';
import { RetailMediaPartnerSchema } from './schemas/retail-media-partner';
import {
  SponsoredCreativeSchema,
  type SponsoredCreative,
} from './schemas/sponsored-creative';

const CreateSponsoredCreativeInputSchema = z.object({
  idToken: z.string().min(1).optional(),
  partnerId: z.string().trim().min(1),
  format: z.enum(['VIDEO', 'BRAND_STRIP']),
  mediaUrl: z.string().url(),
  headline: z.string().trim().min(1).optional(),
  destinationUrl: z.string().url().optional(),
});

export type CreateSponsoredCreativeInput = z.infer<
  typeof CreateSponsoredCreativeInputSchema
>;

const ListSponsoredCreativesInputSchema = z.object({
  idToken: z.string().min(1).optional(),
  partnerId: z.string().trim().min(1),
});

export type ListSponsoredCreativesInput = z.infer<
  typeof ListSponsoredCreativesInputSchema
>;

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

async function requireAuthorizedPartner(
  partnerId: string,
  auth: ReturnType<typeof requireRetailMediaRetailerAuth>
) {
  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const partnerSnapshot = await db
    .collection('retailMediaPartners')
    .doc(partnerId)
    .get();

  if (!partnerSnapshot.exists) {
    throw new Error('RETAIL_MEDIA_PARTNER_NOT_FOUND');
  }

  const parsed = RetailMediaPartnerSchema.safeParse(partnerSnapshot.data());

  if (!parsed.success) {
    throw new Error('RETAIL_MEDIA_PARTNER_INTEGRITY_ERROR');
  }

  if (parsed.data.partnerId !== partnerId) {
    throw new Error('RETAIL_MEDIA_PARTNER_IDENTITY_MISMATCH');
  }

  if (parsed.data.retailerId !== auth.retailerId) {
    throw new Error('RETAIL_MEDIA_PARTNER_SCOPE_MISMATCH');
  }

  return parsed.data;
}

export async function createSponsoredCreative(
  input: CreateSponsoredCreativeInput
): Promise<SponsoredCreative> {
  const parsedInput = CreateSponsoredCreativeInputSchema.parse(input);

  const auth = requireRetailMediaRetailerAuth(
    await verifyAuth(parsedInput.idToken)
  );

  await requireAuthorizedPartner(parsedInput.partnerId, auth);

  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const creativeRef = db.collection('sponsoredCreatives').doc();
  const timestamp = admin.firestore.Timestamp.now();

  const creative = SponsoredCreativeSchema.parse({
    creativeId: creativeRef.id,
    retailerId: auth.retailerId,
    partnerId: parsedInput.partnerId,
    format: parsedInput.format,
    mediaUrl: parsedInput.mediaUrl,
    headline: parsedInput.headline,
    destinationUrl: parsedInput.destinationUrl,
    status: 'DRAFT',
    createdAt: timestamp,
    createdBy: auth.uid,
    updatedAt: timestamp,
    updatedBy: auth.uid,
  });

  await creativeRef.set(creative);

  return creative;
}

export async function listSponsoredCreatives(
  input: ListSponsoredCreativesInput
): Promise<SponsoredCreative[]> {
  const parsedInput = ListSponsoredCreativesInputSchema.parse(input);

  const auth = requireRetailMediaRetailerAuth(
    await verifyAuth(parsedInput.idToken)
  );

  await requireAuthorizedPartner(parsedInput.partnerId, auth);

  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const snapshot = await db
    .collection('sponsoredCreatives')
    .where('retailerId', '==', auth.retailerId)
    .where('partnerId', '==', parsedInput.partnerId)
    .get();

  return snapshot.docs.map(doc => {
    const parsed = SponsoredCreativeSchema.safeParse(doc.data());

    if (!parsed.success) {
      throw new Error(`SPONSORED_CREATIVE_INTEGRITY_ERROR: ${doc.id}`);
    }

    if (parsed.data.creativeId !== doc.id) {
      throw new Error(`SPONSORED_CREATIVE_IDENTITY_MISMATCH: ${doc.id}`);
    }

    if (
      parsed.data.retailerId !== auth.retailerId ||
      parsed.data.partnerId !== parsedInput.partnerId
    ) {
      throw new Error(`SPONSORED_CREATIVE_SCOPE_MISMATCH: ${doc.id}`);
    }

    return parsed.data;
  });
}
