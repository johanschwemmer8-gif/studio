import { createHash, randomUUID } from 'crypto';
import { z } from 'zod';

import { admin, getDb } from './firebase-admin';
import { resolveSponsoredMediaForProductionQr } from './sponsored-media-resolution';
import { SponsoredMediaEventSchema } from './schemas/sponsored-media-event';

/**
 * Result of establishing one server-authoritative sponsored-media
 * presentation opportunity.
 *
 * presentationId is opaque measurement identity, not Shopper Session identity.
 */
export type EstablishSponsoredMediaEligibilityResult = {
  eventId: string;
  presentationId: string;
};

/**
 * Establish canonical sponsored-media eligibility for a production QR.
 *
 * IMPORTANT:
 * - This is an internal server library, not a client-callable Server Action.
 * - The caller supplies only qrId.
 * - All Retail Media identity is resolved server-side.
 * - No Shopper Session is created.
 */
export async function establishSponsoredMediaEligibility(
  qrId: string
): Promise<EstablishSponsoredMediaEligibilityResult> {
  const parsedQrId = z.string().trim().min(1).parse(qrId);
  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const {
    qrContext: { qr },
    creative,
  } = await resolveSponsoredMediaForProductionQr(parsedQrId);

  const presentationId = `smp_${randomUUID()}`;
  const presentationDigest = createHash('sha256')
    .update(presentationId)
    .digest('hex');
  const eventId = `sme_eligible_${presentationDigest}`;

  const eventData = {
    eventId,
    presentationId,
    eventType: 'ELIGIBLE' as const,
    retailerId: qr.retailerId,
    campaignId: qr.campaignId,
    activationId: qr.activationId,
    deploymentId: qr.deploymentId,
    qrCodeId: qr.qrCodeId,
    partnerId: creative.partnerId,
    creativeId: creative.creativeId,
    format: creative.format,
    configurationVersion: qr.configurationVersion,
    environment: qr.environment,
    timestamp: admin.firestore.Timestamp.now(),
  };

  SponsoredMediaEventSchema.parse(eventData);

  await db
    .collection('sponsoredMediaEvents')
    .doc(eventId)
    .create(eventData);

  return {
    eventId,
    presentationId,
  };
}
