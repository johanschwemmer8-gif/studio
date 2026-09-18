'use server';

import { getDb } from './firebase-admin';
import { verifyRetailMediaPartnerAccess } from './retail-media-auth-server';
import {
  aggregateRetailMediaMetrics,
  type RetailMediaMetrics,
} from './retail-media-reporting';
import {
  SponsoredMediaEventSchema,
  type SponsoredMediaEvent,
} from './schemas/sponsored-media-event';

export type PartnerRetailMediaReportInput = {
  idToken?: string;
  retailerId: string;
  partnerId: string;
};

export type PartnerRetailMediaReport = {
  retailerId: string;
  partnerId: string;
  metrics: RetailMediaMetrics;
};

/**
 * Authoritative Partner-scoped Retail Media reporting.
 *
 * SECURITY:
 * - Client-supplied retailerId/partnerId are requested scope only.
 * - verifyRetailMediaPartnerAccess() must authorize that exact scope.
 * - Reporting queries use only the returned authorized context.
 * - Firestore is constrained by BOTH retailerId and partnerId.
 * - Every event is schema-validated and scope-rechecked.
 * - No retailer Profit & ROI or competing-Partner data is returned.
 */
export async function getPartnerRetailMediaReport(
  input: PartnerRetailMediaReportInput
): Promise<PartnerRetailMediaReport> {
  const auth = await verifyRetailMediaPartnerAccess({
    idToken: input.idToken,
    retailerId: input.retailerId,
    partnerId: input.partnerId,
    permission: 'viewRetailMedia',
    resource: {
      retailerId: input.retailerId,
      partnerId: input.partnerId,
    },
  });

  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const snapshot = await db
    .collection('sponsoredMediaEvents')
    .where('retailerId', '==', auth.retailerId)
    .where('partnerId', '==', auth.partnerId)
    .get();

  const events: SponsoredMediaEvent[] = snapshot.docs.map(doc => {
    const parsed = SponsoredMediaEventSchema.safeParse(doc.data());

    if (!parsed.success) {
      throw new Error(
        `SPONSORED_MEDIA_EVENT_INTEGRITY_ERROR: ${doc.id}`
      );
    }

    if (
      parsed.data.retailerId !== auth.retailerId ||
      parsed.data.partnerId !== auth.partnerId
    ) {
      throw new Error(
        `SPONSORED_MEDIA_EVENT_SCOPE_MISMATCH: ${doc.id}`
      );
    }

    return parsed.data;
  });

  return {
    retailerId: auth.retailerId,
    partnerId: auth.partnerId,
    metrics: aggregateRetailMediaMetrics(events),
  };
}
