import { getDb } from '@/lib/firebase-admin';
import {
  RetailerAiGovernanceSchema,
} from '@/lib/schemas/retailer-ai-governance';

function requireDb() {
  const db = getDb();

  if (!db) {
    throw new Error(
      'RETAILER_AI_GOVERNANCE_FIRESTORE_UNAVAILABLE'
    );
  }

  return db;
}

export async function getRetailerAiGovernance(
  retailerId: string
) {
  if (!retailerId) {
    throw new Error(
      'RETAILER_AI_GOVERNANCE_DENIED:RETAILER_ID_REQUIRED'
    );
  }

  const db = requireDb();

  const snapshot = await db
    .collection('retailerAiGovernance')
    .doc(retailerId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();

  if (data === undefined) {
    throw new Error(
      'RETAILER_AI_GOVERNANCE_INTEGRITY_ERROR'
    );
  }

  const governance =
    RetailerAiGovernanceSchema.parse(data);

  if (governance.retailerId !== retailerId) {
    throw new Error(
      'RETAILER_AI_GOVERNANCE_DENIED:TENANT_IDENTITY_MISMATCH'
    );
  }

  return governance;
}
