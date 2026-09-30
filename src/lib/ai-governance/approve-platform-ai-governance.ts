import { admin, getDb } from '@/lib/firebase-admin';
import { verifyPlatformOperator } from '@/lib/auth-server';
import { PlatformAiGovernancePolicySchema } from '@/lib/schemas/ai-governance';
import { PlatformAiGovernanceChangeEventSchema } from '@/lib/schemas/ai-governance-evidence';
import {
  governanceChangeEventDocumentId,
  governancePolicyDocumentId,
} from './governance-document-ids';

export interface ApprovePlatformAiGovernanceInput {
  idToken: string;
  governanceId: string;
  governanceVersion: string;
  reason?: string;
}

export interface ApprovePlatformAiGovernanceResult {
  governanceId: string;
  governanceVersion: string;
  policyDocumentId: string;
  alreadyApproved: boolean;
}

export async function approvePlatformAiGovernance(
  input: ApprovePlatformAiGovernanceInput
): Promise<ApprovePlatformAiGovernanceResult> {
  const operator = await verifyPlatformOperator(input.idToken);
  const db = getDb();

  if (!db) {
    throw new Error('AI_GOVERNANCE_FIRESTORE_UNAVAILABLE');
  }

  const policyDocumentId = governancePolicyDocumentId(
    input.governanceId,
    input.governanceVersion
  );

  return db.runTransaction(async transaction => {
    const policyRef = db
      .collection('aiGovernancePolicies')
      .doc(policyDocumentId);

    const snapshot = await transaction.get(policyRef);

    if (!snapshot.exists) {
      throw new Error('AI_GOVERNANCE_POLICY_NOT_FOUND');
    }

    const data = snapshot.data();

    if (data === undefined) {
      throw new Error('AI_GOVERNANCE_POLICY_INTEGRITY_ERROR');
    }

    const policy =
      PlatformAiGovernancePolicySchema.parse(data);

    if (
      policy.governanceId !== input.governanceId ||
      policy.governanceVersion !== input.governanceVersion
    ) {
      throw new Error(
        'AI_GOVERNANCE_POLICY_DOCUMENT_IDENTITY_MISMATCH'
      );
    }

    if (policy.status === 'APPROVED') {
      return {
        governanceId: input.governanceId,
        governanceVersion: input.governanceVersion,
        policyDocumentId,
        alreadyApproved: true,
      };
    }

    if (policy.status !== 'DRAFT') {
      throw new Error(
        `AI_GOVERNANCE_POLICY_NOT_DRAFT:${policy.status}`
      );
    }

    const now = admin.firestore.Timestamp.now();

    const approvedPolicy =
      PlatformAiGovernancePolicySchema.parse({
        ...policy,
        status: 'APPROVED',
        approvedAt: now,
        approvedBy: operator.uid,
        updatedAt: now,
        updatedBy: operator.uid,
      });

    const changeEventId =
      governanceChangeEventDocumentId(
        input.governanceId,
        input.governanceVersion,
        'POLICY_APPROVED',
        now.toMillis()
      );

    const changeEvent =
      PlatformAiGovernanceChangeEventSchema.parse({
        changeEventId,
        governanceId: input.governanceId,
        governanceVersion: input.governanceVersion,
        changeType: 'POLICY_APPROVED',
        actorId: operator.uid,
        occurredAt: now,
        targetType: 'AI_GOVERNANCE_POLICY',
        targetId: policyDocumentId,
        reason: input.reason,
        changeSummary:
          'Platform AI Governance policy approved.',
        evidenceIds: [],
      });

    transaction.set(policyRef, approvedPolicy);

    transaction.create(
      db
        .collection('aiGovernanceChangeEvents')
        .doc(changeEventId),
      changeEvent
    );

    return {
      governanceId: input.governanceId,
      governanceVersion: input.governanceVersion,
      policyDocumentId,
      alreadyApproved: false,
    };
  });
}
