import { getDb } from './firebase-admin';
import {
  resolveProductionQr,
  type ResolvedProductionQr,
} from './qr-resolution';
import {
  RetailMediaPartnerSchema,
  type RetailMediaPartner,
} from './schemas/retail-media-partner';
import {
  SponsoredCreativeSchema,
  type SponsoredCreative,
} from './schemas/sponsored-creative';

export type ResolvedSponsoredMedia = {
  qrContext: ResolvedProductionQr;
  partner: RetailMediaPartner;
  creative: SponsoredCreative;
};

/**
 * Resolve and validate canonical sponsored-media identity from a production QR.
 *
 * ARCHITECTURE:
 * - qrId is the only caller-supplied resource identity.
 * - Retailer, Campaign, Activation, Deployment, Partner and Creative identity
 *   are derived from canonical server-side records.
 * - Legacy Objective 15A sponsored media may continue to render, but sponsored
 *   media without partnerId + creativeId is not canonically measurable.
 * - This helper is read-only. It creates no measurement event or Shopper Session.
 */
export async function resolveSponsoredMediaForProductionQr(
  qrId: string
): Promise<ResolvedSponsoredMedia> {
  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const qrContext = await resolveProductionQr(qrId);
  const { qr, activation } = qrContext;

  const sponsoredMedia = activation.experienceConfig.sponsoredMedia;

  if (!sponsoredMedia) {
    throw new Error('SPONSORED_MEDIA_NOT_CONFIGURED');
  }

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

  return {
    qrContext,
    partner,
    creative,
  };
}
