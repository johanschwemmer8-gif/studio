'use server';

import { getDb } from './firebase-admin';
import { verifyAuth } from './auth-server';
import {
  aggregateRetailMediaMetrics,
  type RetailMediaMetrics,
} from './retail-media-reporting';
import {
  SponsoredMediaEventSchema,
  type SponsoredMediaEvent,
} from './schemas/sponsored-media-event';

export type RetailerRetailMediaReportInput = {
  idToken?: string;
};

export type RetailerRetailMediaReport = {
  retailerId: string;
  metrics: RetailMediaMetrics;
};

/**
 * Authoritative retailer-side Retail Media reporting.
 *
 * SECURITY:
 * - retailerId is never accepted from the client.
 * - retailer scope comes only from verifyAuth().
 * - retailMediaNetwork permission is mandatory.
 * - only canonical sponsoredMediaEvents are queried.
 * - every event is schema-validated before aggregation.
 * - Partner reporting uses a separate Partner-scoped path.
 */
export async function getRetailerRetailMediaReport(
  input: RetailerRetailMediaReportInput
): Promise<RetailerRetailMediaReport> {
  const auth = await verifyAuth(input.idToken);

  if ('error' in auth) {
    throw new Error('AUTHENTICATION_FAILED');
  }

  if (!auth.isActive) {
    throw new Error('ACCESS_DENIED: Retailer user is inactive.');
  }

  if (!auth.retailerId) {
    throw new Error('ACCESS_DENIED: Authoritative retailer scope is missing.');
  }

  if (auth.permissions.retailMediaNetwork !== true) {
    throw new Error(
      'ACCESS_DENIED: Retail Media Network permission is required.'
    );
  }

  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const snapshot = await db
    .collection('sponsoredMediaEvents')
    .where('retailerId', '==', auth.retailerId)
    .get();

  const events: SponsoredMediaEvent[] = snapshot.docs.map(doc => {
    const parsed = SponsoredMediaEventSchema.safeParse(doc.data());

    if (!parsed.success) {
      throw new Error(
        `SPONSORED_MEDIA_EVENT_INTEGRITY_ERROR: ${doc.id}`
      );
    }

    if (parsed.data.retailerId !== auth.retailerId) {
      throw new Error(
        `SPONSORED_MEDIA_EVENT_SCOPE_MISMATCH: ${doc.id}`
      );
    }

    return parsed.data;
  });

  return {
    retailerId: auth.retailerId,
    metrics: aggregateRetailMediaMetrics(events),
  };
}
