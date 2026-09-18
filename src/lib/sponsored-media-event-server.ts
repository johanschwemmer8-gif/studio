'use server';

import { createHash } from 'crypto';
import { z } from 'zod';

import { admin, getDb } from './firebase-admin';
import { resolveSponsoredMediaForProductionQr } from './sponsored-media-resolution';
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

  const {
    qrContext: { qr },
    creative,
  } = await resolveSponsoredMediaForProductionQr(parsedInput.qrId);

  assertEventSemantics(
    creative.format,
    parsedInput.eventType,
    parsedInput.playbackOrdinal
  );

  if (
    parsedInput.eventType === 'REPLAYED' &&
    (parsedInput.playbackOrdinal === undefined ||
      parsedInput.playbackOrdinal < 2)
  ) {
    throw new Error('INVALID_REPLAY_PLAYBACK_ORDINAL');
  }

  const presentationDigest = createHash('sha256')
    .update(parsedInput.presentationId)
    .digest('hex');

  const eligibleEventId = `sme_eligible_${presentationDigest}`;

  const eventIdentity = [
    parsedInput.presentationId,
    parsedInput.eventType,
    parsedInput.playbackOrdinal ?? 0,
  ].join(':');

  const eventDigest = createHash('sha256')
    .update(eventIdentity)
    .digest('hex');

  const eventId = `sme_event_${eventDigest}`;

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

  const events = db.collection('sponsoredMediaEvents');
  const eligibleRef = events.doc(eligibleEventId);
  const eventRef = events.doc(eventId);

  await db.runTransaction(async (transaction) => {
    const eligibleSnapshot = await transaction.get(eligibleRef);

    if (eligibleSnapshot.exists === false) {
      throw new Error('SPONSORED_MEDIA_PRESENTATION_NOT_ESTABLISHED');
    }

    const rawEligible = eligibleSnapshot.data();

    if (rawEligible === undefined) {
      throw new Error('SPONSORED_MEDIA_PRESENTATION_NOT_ESTABLISHED');
    }

    const eligibleEvent = SponsoredMediaEventSchema.parse(rawEligible);

    if (
      eligibleEvent.eventType !== 'ELIGIBLE' ||
      eligibleEvent.presentationId !== parsedInput.presentationId ||
      eligibleEvent.retailerId !== qr.retailerId ||
      eligibleEvent.campaignId !== qr.campaignId ||
      eligibleEvent.activationId !== qr.activationId ||
      eligibleEvent.deploymentId !== qr.deploymentId ||
      eligibleEvent.qrCodeId !== qr.qrCodeId ||
      eligibleEvent.partnerId !== creative.partnerId ||
      eligibleEvent.creativeId !== creative.creativeId ||
      eligibleEvent.format !== creative.format ||
      eligibleEvent.configurationVersion !== qr.configurationVersion ||
      eligibleEvent.environment !== qr.environment
    ) {
      throw new Error('SPONSORED_MEDIA_PRESENTATION_CONTEXT_MISMATCH');
    }

    const existingEventSnapshot = await transaction.get(eventRef);

    if (existingEventSnapshot.exists) {
      const existingRaw = existingEventSnapshot.data();

      if (existingRaw === undefined) {
        throw new Error('SPONSORED_MEDIA_EVENT_INTEGRITY_ERROR');
      }

      const existingEvent = SponsoredMediaEventSchema.parse(existingRaw);

      if (
        existingEvent.eventId !== eventId ||
        existingEvent.presentationId !== parsedInput.presentationId ||
        existingEvent.eventType !== parsedInput.eventType ||
        existingEvent.retailerId !== qr.retailerId ||
        existingEvent.campaignId !== qr.campaignId ||
        existingEvent.activationId !== qr.activationId ||
        existingEvent.deploymentId !== qr.deploymentId ||
        existingEvent.qrCodeId !== qr.qrCodeId ||
        existingEvent.partnerId !== creative.partnerId ||
        existingEvent.creativeId !== creative.creativeId ||
        existingEvent.format !== creative.format ||
        existingEvent.configurationVersion !== qr.configurationVersion ||
        existingEvent.environment !== qr.environment ||
        existingEvent.playbackOrdinal !== parsedInput.playbackOrdinal
      ) {
        throw new Error('SPONSORED_MEDIA_EVENT_INTEGRITY_ERROR');
      }

      return;
    }

    transaction.create(eventRef, eventData);
  });

  return { eventId };
}
