import { admin, getDb } from '@/lib/firebase-admin';
import { verifyPlatformOperator } from '@/lib/auth-server';
import {
  ActiveAiGovernancePointerSchema,
  PlatformAiGovernancePolicySchema,
} from '@/lib/schemas/ai-governance';
import { PlatformAiGovernanceChangeEventSchema } from '@/lib/schemas/ai-governance-evidence';
import {
  ACTIVE_AI_GOVERNANCE_POINTER_COLLECTION,
  ACTIVE_AI_GOVERNANCE_POINTER_DOCUMENT,
  governanceChangeEventDocumentId,
  governancePolicyDocumentId,
} from './governance-document-ids';

export interface ActivatePlatformAiGovernanceInput {
  idToken: string;
  governanceId: string;
  governanceVersion: string;
  reason?: string;
}

export interface ActivatePlatformAiGovernanceResult {
  governanceId: string;
  governanceVersion: string;
  policyDocumentId: string;
  alreadyActive: boolean;
}

export async function activatePlatformAiGovernance(
  input: ActivatePlatformAiGovernanceInput
): Promise<ActivatePlatformAiGovernanceResult> {
  const operator = await verifyPlatformOperator(input.idToken);
  const db = getDb();

  if (!db) {
    throw new Error('AI_GOVERNANCE_FIRESTORE_UNAVAILABLE');
  }

  const targetPolicyDocumentId = governancePolicyDocumentId(
    input.governanceId,
    input.governanceVersion
  );

  const targetPolicyRef = db
    .collection('aiGovernancePolicies')
    .doc(targetPolicyDocumentId);

  const pointerRef = db
    .collection(ACTIVE_AI_GOVERNANCE_POINTER_COLLECTION)
    .doc(ACTIVE_AI_GOVERNANCE_POINTER_DOCUMENT);

  return db.runTransaction(async (transaction) => {
    const targetSnapshot = await transaction.get(targetPolicyRef);

    if (!targetSnapshot.exists) {
      throw new Error('AI_GOVERNANCE_POLICY_NOT_FOUND');
    }

    const targetRaw = targetSnapshot.data();

    if (targetRaw === undefined) {
      throw new Error('AI_GOVERNANCE_POLICY_INTEGRITY_ERROR');
    }

    const targetPolicy =
      PlatformAiGovernancePolicySchema.parse(targetRaw);

    if (
      targetPolicy.governanceId !== input.governanceId ||
      targetPolicy.governanceVersion !== input.governanceVersion
    ) {
      throw new Error('AI_GOVERNANCE_POLICY_IDENTITY_MISMATCH');
    }

    const pointerSnapshot = await transaction.get(pointerRef);

    if (pointerSnapshot.exists) {
      const pointerRaw = pointerSnapshot.data();

      if (pointerRaw === undefined) {
        throw new Error('AI_GOVERNANCE_POINTER_INTEGRITY_ERROR');
      }

      const activePointer =
        ActiveAiGovernancePointerSchema.parse(pointerRaw);

      if (
        activePointer.governanceId === input.governanceId &&
        activePointer.governanceVersion === input.governanceVersion &&
        activePointer.policyDocumentId === targetPolicyDocumentId
      ) {
        if (targetPolicy.status !== 'ACTIVE') {
          throw new Error(
            'AI_GOVERNANCE_ACTIVE_POINTER_POLICY_MISMATCH'
          );
        }

        return {
          governanceId: input.governanceId,
          governanceVersion: input.governanceVersion,
          policyDocumentId: targetPolicyDocumentId,
          alreadyActive: true,
        };
      }
    }

    if (targetPolicy.status !== 'APPROVED') {
      throw new Error(
        `AI_GOVERNANCE_POLICY_NOT_APPROVED:${targetPolicy.status}`
      );
    }

    const now = admin.firestore.Timestamp.now();
    const nowMillis = now.toMillis();

    let previousPolicyRef:
      | FirebaseFirestore.DocumentReference
      | undefined;

    let previousPolicy:
      | ReturnType<typeof PlatformAiGovernancePolicySchema.parse>
      | undefined;

    let activePointer:
      | ReturnType<typeof ActiveAiGovernancePointerSchema.parse>
      | undefined;

    if (pointerSnapshot.exists) {
      const pointerRaw = pointerSnapshot.data();

      if (pointerRaw === undefined) {
        throw new Error('AI_GOVERNANCE_POINTER_INTEGRITY_ERROR');
      }

      activePointer =
        ActiveAiGovernancePointerSchema.parse(pointerRaw);

      const expectedPreviousDocumentId =
        governancePolicyDocumentId(
          activePointer.governanceId,
          activePointer.governanceVersion
        );

      if (
        activePointer.policyDocumentId !==
        expectedPreviousDocumentId
      ) {
        throw new Error(
          'AI_GOVERNANCE_POINTER_DOCUMENT_ID_MISMATCH'
        );
      }

      previousPolicyRef = db
        .collection('aiGovernancePolicies')
        .doc(activePointer.policyDocumentId);

      const previousSnapshot =
        await transaction.get(previousPolicyRef);

      if (!previousSnapshot.exists) {
        throw new Error(
          'AI_GOVERNANCE_ACTIVE_POLICY_NOT_FOUND'
        );
      }

      const previousRaw = previousSnapshot.data();

      if (previousRaw === undefined) {
        throw new Error(
          'AI_GOVERNANCE_ACTIVE_POLICY_INTEGRITY_ERROR'
        );
      }

      previousPolicy =
        PlatformAiGovernancePolicySchema.parse(previousRaw);

      if (
        previousPolicy.governanceId !==
          activePointer.governanceId ||
        previousPolicy.governanceVersion !==
          activePointer.governanceVersion ||
        previousPolicy.status !== 'ACTIVE'
      ) {
        throw new Error(
          'AI_GOVERNANCE_ACTIVE_POINTER_POLICY_MISMATCH'
        );
      }
    }

    if (previousPolicyRef && previousPolicy) {
      const supersededPolicy = {
        ...previousPolicy,
        status: 'SUPERSEDED' as const,
        updatedAt: now,
        updatedBy: operator.uid,
        supersededAt: now,
        supersededBy: operator.uid,
      };

      PlatformAiGovernancePolicySchema.parse(
        supersededPolicy
      );

      transaction.set(
        previousPolicyRef,
        supersededPolicy
      );

      const supersededEventId =
        governanceChangeEventDocumentId(
          previousPolicy.governanceId,
          previousPolicy.governanceVersion,
          'POLICY_SUPERSEDED',
          nowMillis
        );

      const supersededEvent = {
        changeEventId: supersededEventId,
        governanceId: previousPolicy.governanceId,
        governanceVersion:
          previousPolicy.governanceVersion,
        changeType: 'POLICY_SUPERSEDED' as const,
        actorId: operator.uid,
        occurredAt: now,
        targetType: 'AI_GOVERNANCE_POLICY',
        targetId: activePointer!.policyDocumentId,
        reason: input.reason,
        changeSummary:
          `Superseded by ${targetPolicyDocumentId}.`,
        evidenceIds: [],
      };

      PlatformAiGovernanceChangeEventSchema.parse(
        supersededEvent
      );

      transaction.create(
        db
          .collection('aiGovernanceChangeEvents')
          .doc(supersededEventId),
        supersededEvent
      );
    }

    const activatedPolicy = {
      ...targetPolicy,
      status: 'ACTIVE' as const,
      effectiveAt: now,
      updatedAt: now,
      updatedBy: operator.uid,
      activatedAt: now,
      activatedBy: operator.uid,
    };

    PlatformAiGovernancePolicySchema.parse(
      activatedPolicy
    );

    const pointer = {
      governanceId: input.governanceId,
      governanceVersion: input.governanceVersion,
      policyDocumentId: targetPolicyDocumentId,
      activatedAt: now,
      activatedBy: operator.uid,
    };

    ActiveAiGovernancePointerSchema.parse(pointer);

    const activatedEventId =
      governanceChangeEventDocumentId(
        input.governanceId,
        input.governanceVersion,
        'POLICY_ACTIVATED',
        nowMillis
      );

    const activatedEvent = {
      changeEventId: activatedEventId,
      governanceId: input.governanceId,
      governanceVersion: input.governanceVersion,
      changeType: 'POLICY_ACTIVATED' as const,
      actorId: operator.uid,
      occurredAt: now,
      targetType: 'AI_GOVERNANCE_POLICY',
      targetId: targetPolicyDocumentId,
      reason: input.reason,
      changeSummary:
        `Activated ${targetPolicyDocumentId}.`,
      evidenceIds: [],
    };

    PlatformAiGovernanceChangeEventSchema.parse(
      activatedEvent
    );

    transaction.set(targetPolicyRef, activatedPolicy);
    transaction.set(pointerRef, pointer);
    transaction.create(
      db
        .collection('aiGovernanceChangeEvents')
        .doc(activatedEventId),
      activatedEvent
    );

    return {
      governanceId: input.governanceId,
      governanceVersion: input.governanceVersion,
      policyDocumentId: targetPolicyDocumentId,
      alreadyActive: false,
    };
  });
}
