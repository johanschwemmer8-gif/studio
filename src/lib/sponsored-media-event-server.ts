'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';

import { admin, getDb } from './firebase-admin';
import { resolveProductionQr } from './qr-resolution';
import {
  RetailMediaPartnerSchema,
} from './schemas/retail-media-partner';
import {
  SponsoredCreativeSchema,
} from './schemas/sponsored-creative';
import {
  SponsoredMediaEventSchema,
  type SponsoredMediaEventType,
} from './schemas/sponsored-media-event';

const ClientSponsoredMediaEventTypeSchema = z.enum([
  'IMPRESSION',
  'STARTED',
  'COMPLETED',
  'DISMISSED',
  'REPLAYED',
  'CLICKED',
]);

export type ClientSponsoredMediaEventType = z.infer<
  typeof ClientSponsoredMediaEventTypeSchema
>;

export type RecordSponsoredMediaEventInput = {
  qrId: string;
  eventType: ClientSponsoredMediaEventType;
  presentationId: string;
  playbackOrdinal?: number;
};

export type RecordSponsoredMediaEventResult = {
  eventId: string;
};

function assertEventSemantics(
  format: 'VIDEO' | 'BRAND_STRIP',
  eventType: SponsoredMediaEventType,
  playbackOrdinal?: number
): void {
  if (
    format === 'BRAND_STRIP' &&
    (
      eventType === 'STARTED' ||
      eventType === 'COMPLETED' ||
      eventType === 'REPLAYED'
    )
  ) {
    throw new Error('INVALID_SPONSORED_MEDIA_EVENT');
  }

  const playbackEvent =
    eventType === 'STARTED' ||
    eventType === 'COMPLETED' ||
    eventType === 'REPLAYED';

  if (playbackEvent && playbackOrdinal === undefined) {
    throw new Error('PLAYBACK_ORDINAL_REQUIRED');
  }

  if (!playbackEvent && playbackOrdinal !== undefined) {
    throw new Error('PLAYBACK_ORDINAL_NOT_ALLOWED');
  }

  if (
    playbackOrdinal !== undefined &&
    (!Number.isInteger(playbackOrdinal) || playbackOrdinal < 1)
  ) {
    throw new Error('INVALID_PLAYBACK_ORDINAL');
  }
}

/**
 * Record one browser-observed sponsored-media event.
 *
 * SECURITY / MEASUREMENT BOUNDARY:
 * - The browser reports what happened, not what resource owns the event.
 * - Retailer, Campaign, Activation, Deployment, QR, Partner, Creative,
 *   format, configuration version and environment are resolved server-side.
 * - No shopper session is created here.
 * - No shopper identity is recorded here.
 * - ELIGIBLE is intentionally not client-callable.
 */
export async function recordSponsoredMediaEvent(
  input: RecordSponsoredMediaEventInput
): Promise<RecordSponsoredMediaEventResult> {
  const parsedInput = z
    .object({
      qrId: z.string().trim().min(1),
      eventType: ClientSponsoredMediaEventTypeSchema,
      presentationId: z.string().trim().min(1),
      playbackOrdinal: z.number().int().positive().optional(),
    })
    .parse(input);

  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const { qr, activation } = await resolveProductionQr(parsedInput.qrId);

  const sponsoredMedia = activation.experienceConfig.sponsoredMedia;

  if (!sponsoredMedia) {
    throw new Error('SPONSORED_MEDIA_NOT_CONFIGURED');
  }

  /*
   * Objective 15A backward compatibility:
   * legacy sponsored media may continue to render without canonical
   * Retail Media identity, but it must not create canonical 15B events.
   */
  if (!sponsoredMedia.partnerId || !sponsoredMedia.creativeId) {
    throw new Error('SPONSORED_MEDIA_NOT_MEASURABLE');
  }

  const partnerSnapshot = await db
    .collection('retailMediaPartners')
    .doc(sponsoredMedia.partnerId)
    .get();

  if (!partnerSnapshot.exists) {
    throw new Error('RETAIL_MEDIA_PARTNER_NOT_FOUND');
  }

  const partnerData = partnerSnapshot.data();

  if (partnerData === undefined) {
    throw new Error('RETAIL_MEDIA_PARTNER_NOT_FOUND');
  }

  const partner = RetailMediaPartnerSchema.parse(partnerData);

  if (
    partner.partnerId !== sponsoredMedia.partnerId ||
    partner.retailerId !== qr.retailerId
  ) {
    throw new Error('RETAIL_MEDIA_PARTNER_INTEGRITY_ERROR');
  }

  if (partner.status !== 'ACTIVE') {
    throw new Error('RETAIL_MEDIA_PARTNER_INACTIVE');
  }

  const creativeSnapshot = await db
    .collection('sponsoredCreatives')
    .doc(sponsoredMedia.creativeId)
    .get();

  if (!creativeSnapshot.exists) {
    throw new Error('SPONSORED_CREATIVE_NOT_FOUND');
  }

  const creativeData = creativeSnapshot.data();

  if (creativeData === undefined) {
    throw new Error('SPONSORED_CREATIVE_NOT_FOUND');
  }

  const creative = SponsoredCreativeSchema.parse(creativeData);

  if (
    creative.creativeId !== sponsoredMedia.creativeId ||
    creative.retailerId !== qr.retailerId ||
    creative.partnerId !== sponsoredMedia.partnerId
  ) {
    throw new Error('SPONSORED_CREATIVE_INTEGRITY_ERROR');
  }

  if (creative.status !== 'ACTIVE') {
    throw new Error('SPONSORED_CREATIVE_INACTIVE');
  }

  if (
    creative.format !== sponsoredMedia.format ||
    creative.mediaUrl !== sponsoredMedia.mediaUrl
  ) {
    throw new Error('SPONSORED_CREATIVE_PRESENTATION_MISMATCH');
  }

  assertEventSemantics(
    creative.format,
    parsedInput.eventType,
    parsedInput.playbackOrdinal
  );

  const eventId = `sme_${randomUUID()}`;

  const eventData = {
    eventId,
    presentationId: parsedInput.presentationId,
    eventType: parsedInput.eventType,
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
    ...(parsedInput.playbackOrdinal !== undefined
      ? { playbackOrdinal: parsedInput.playbackOrdinal }
      : {}),
    timestamp: admin.firestore.Timestamp.now(),
  };

  SponsoredMediaEventSchema.parse(eventData);

  await db
    .collection('sponsoredMediaEvents')
    .doc(eventId)
    .create(eventData);

  return { eventId };
}
