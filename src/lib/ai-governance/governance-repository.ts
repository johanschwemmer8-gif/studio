import { getDb } from '@/lib/firebase-admin';
import {
  ActiveAiGovernancePointerSchema,
  PlatformAiGovernancePolicySchema,
} from '@/lib/schemas/ai-governance';
import {
  ACTIVE_AI_GOVERNANCE_POINTER_COLLECTION,
  ACTIVE_AI_GOVERNANCE_POINTER_DOCUMENT,
  governancePolicyDocumentId,
} from './governance-document-ids';

function requireDb() {
  const db = getDb();

  if (!db) {
    throw new Error('AI_GOVERNANCE_FIRESTORE_UNAVAILABLE');
  }

  return db;
}

export async function getGovernancePolicy(
  governanceId: string,
  governanceVersion: string
) {
  const db = requireDb();

  const documentId = governancePolicyDocumentId(
    governanceId,
    governanceVersion
  );

  const snapshot = await db
    .collection('aiGovernancePolicies')
    .doc(documentId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();

  if (data === undefined) {
    throw new Error('AI_GOVERNANCE_POLICY_INTEGRITY_ERROR');
  }

  return PlatformAiGovernancePolicySchema.parse(data);
}

export async function getActiveGovernancePointer() {
  const db = requireDb();

  const snapshot = await db
    .collection(ACTIVE_AI_GOVERNANCE_POINTER_COLLECTION)
    .doc(ACTIVE_AI_GOVERNANCE_POINTER_DOCUMENT)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();

  if (data === undefined) {
    throw new Error('AI_GOVERNANCE_POINTER_INTEGRITY_ERROR');
  }

  return ActiveAiGovernancePointerSchema.parse(data);
}
