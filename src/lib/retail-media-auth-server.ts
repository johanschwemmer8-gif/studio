'use server';

import { admin, getDb } from './firebase-admin';
import {
  canAccessRetailMediaPartnerResource,
  type RetailMediaPartnerPermission,
  type RetailMediaPartnerResource,
} from './retail-media-authorization';
import { RetailMediaPartnerSchema } from './schemas/retail-media-partner';
import { RetailMediaPartnerMembershipSchema } from './schemas/retail-media-partner-membership';

export type VerifyRetailMediaPartnerAccessInput = {
  idToken?: string;
  retailerId: string;
  partnerId: string;
  permission: RetailMediaPartnerPermission;
  resource: RetailMediaPartnerResource;
};

export type RetailMediaPartnerAuthorizedContext = {
  uid: string;
  retailerId: string;
  partnerId: string;
  membershipId: string;
};

/**
 * Authoritative server-side Retail Media Partner authorization.
 *
 * This authorization domain is deliberately separate from retailer
 * organizational authorization.
 *
 * Security chain:
 * Firebase identity
 * -> canonical Partner membership
 * -> canonical Partner
 * -> permission
 * -> retailer boundary
 * -> Partner boundary
 * -> requested resource association
 *
 * Client-supplied membership data is never trusted.
 */
export async function verifyRetailMediaPartnerAccess(
  input: VerifyRetailMediaPartnerAccessInput
): Promise<RetailMediaPartnerAuthorizedContext> {
  if (!input.idToken) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }

  let decodedToken: { uid: string };

  try {
    decodedToken = await admin.auth().verifyIdToken(input.idToken);
  } catch {
    throw new Error('AUTHENTICATION_FAILED');
  }

  if (!decodedToken.uid) {
    throw new Error('AUTHENTICATION_FAILED');
  }

  const db = getDb();

  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const membershipSnapshot = await db
    .collection('retailMediaPartnerMemberships')
    .where('uid', '==', decodedToken.uid)
    .where('retailerId', '==', input.retailerId)
    .where('partnerId', '==', input.partnerId)
    .get();

  if (membershipSnapshot.empty || membershipSnapshot.docs.length === 0) {
    throw new Error('ACCESS_DENIED: Retail Media Partner membership not found.');
  }

  if (membershipSnapshot.docs.length !== 1) {
    throw new Error(
      'ACCESS_DENIED: Ambiguous Retail Media Partner membership.'
    );
  }

  const membership = RetailMediaPartnerMembershipSchema.parse(
    membershipSnapshot.docs[0].data()
  );

  if (membership.uid !== decodedToken.uid) {
    throw new Error('ACCESS_DENIED: Membership identity mismatch.');
  }

  if (
    membership.retailerId !== input.retailerId ||
    membership.partnerId !== input.partnerId
  ) {
    throw new Error('ACCESS_DENIED: Membership scope mismatch.');
  }

  const partnerSnapshot = await db
    .collection('retailMediaPartners')
    .doc(input.partnerId)
    .get();

  if (!partnerSnapshot.exists) {
    throw new Error('ACCESS_DENIED: Retail Media Partner not found.');
  }

  const partnerData = partnerSnapshot.data();

  if (partnerData === undefined) {
    throw new Error('ACCESS_DENIED: Retail Media Partner not found.');
  }

  const partner = RetailMediaPartnerSchema.parse(partnerData);

  if (
    partner.partnerId !== input.partnerId ||
    partner.retailerId !== input.retailerId
  ) {
    throw new Error('ACCESS_DENIED: Retail Media Partner scope mismatch.');
  }

  if (partner.status !== 'ACTIVE') {
    throw new Error('ACCESS_DENIED: Retail Media Partner is inactive.');
  }

  const decision = canAccessRetailMediaPartnerResource(
    membership,
    input.resource,
    input.permission
  );

  if (!decision.allowed) {
    throw new Error(`ACCESS_DENIED: ${decision.reason ?? 'Access denied.'}`);
  }

  return {
    uid: decodedToken.uid,
    retailerId: membership.retailerId,
    partnerId: membership.partnerId,
    membershipId: membership.membershipId,
  };
}
