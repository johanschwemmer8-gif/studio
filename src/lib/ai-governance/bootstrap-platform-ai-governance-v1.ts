import { admin, getDb } from '@/lib/firebase-admin';
import { verifyPlatformOperator } from '@/lib/auth-server';
import { PlatformAiGovernancePolicySchema } from '@/lib/schemas/ai-governance';
import { PlatformAiGovernanceChangeEventSchema } from '@/lib/schemas/ai-governance-evidence';
import {
  governanceChangeEventDocumentId,
  governancePolicyDocumentId,
} from './governance-document-ids';
import {
  PLATFORM_AI_GOVERNANCE_V1_ID,
  PLATFORM_AI_GOVERNANCE_V1_NAME,
  PLATFORM_AI_GOVERNANCE_V1_VERSION,
} from './platform-governance-v1';

export interface BootstrapPlatformAiGovernanceV1Input {
  idToken: string;
  reason?: string;
}

export interface BootstrapPlatformAiGovernanceV1Result {
  governanceId: string;
  governanceVersion: string;
  policyDocumentId: string;
  alreadyExists: boolean;
}

export async function bootstrapPlatformAiGovernanceV1(
  input: BootstrapPlatformAiGovernanceV1Input
): Promise<BootstrapPlatformAiGovernanceV1Result> {
  const operator = await verifyPlatformOperator(input.idToken);
  const db = getDb();

  if (!db) {
    throw new Error('AI_GOVERNANCE_FIRESTORE_UNAVAILABLE');
  }

  const governanceId = PLATFORM_AI_GOVERNANCE_V1_ID;
  const governanceVersion = PLATFORM_AI_GOVERNANCE_V1_VERSION;
  const policyDocumentId = governancePolicyDocumentId(
    governanceId,
    governanceVersion
  );

  return db.runTransaction(async transaction => {
    const policyRef = db
      .collection('aiGovernancePolicies')
      .doc(policyDocumentId);

    const existing = await transaction.get(policyRef);

    if (existing.exists) {
      const data = existing.data();

      if (data === undefined) {
        throw new Error('AI_GOVERNANCE_POLICY_INTEGRITY_ERROR');
      }

      const policy = PlatformAiGovernancePolicySchema.parse(data);

      if (
        policy.governanceId !== governanceId ||
        policy.governanceVersion !== governanceVersion
      ) {
        throw new Error(
          'AI_GOVERNANCE_POLICY_DOCUMENT_IDENTITY_MISMATCH'
        );
      }

      return {
        governanceId,
        governanceVersion,
        policyDocumentId,
        alreadyExists: true,
      };
    }

    const now = admin.firestore.Timestamp.now();

    const policy = PlatformAiGovernancePolicySchema.parse({
      governanceId,
      governanceVersion,
      name: PLATFORM_AI_GOVERNANCE_V1_NAME,
      status: 'DRAFT',
      createdAt: now,
      createdBy: operator.uid,
      updatedAt: now,
      updatedBy: operator.uid,
    });

    const changeEventId = governanceChangeEventDocumentId(
      governanceId,
      governanceVersion,
      'POLICY_CREATED',
      now.toMillis()
    );

    const changeEvent =
      PlatformAiGovernanceChangeEventSchema.parse({
        changeEventId,
        governanceId,
        governanceVersion,
        changeType: 'POLICY_CREATED',
        actorId: operator.uid,
        occurredAt: now,
        targetType: 'AI_GOVERNANCE_POLICY',
        targetId: policyDocumentId,
        reason: input.reason,
        changeSummary:
          'Canonical Platform AI Governance policy created as DRAFT.',
        evidenceIds: [],
      });

    transaction.create(policyRef, policy);

    transaction.create(
      db
        .collection('aiGovernanceChangeEvents')
        .doc(changeEventId),
      changeEvent
    );

    return {
      governanceId,
      governanceVersion,
      policyDocumentId,
      alreadyExists: false,
    };
  });
}
