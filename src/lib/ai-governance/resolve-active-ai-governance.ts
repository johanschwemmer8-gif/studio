import {
  PLATFORM_AI_MODELS_V1,
} from './platform-ai-capabilities-v1';
import {
  governancePolicyDocumentId,
} from './governance-document-ids';
import {
  getActiveGovernancePointer,
  getGovernancePolicy,
} from './governance-repository';
import {
  resolveAiGovernance,
  type ResolvedAiGovernance,
} from './resolve-ai-governance';

export type ResolvedActiveAiGovernance =
  ResolvedAiGovernance & {
    policyDocumentId: string;
    providerModelIdentifier?: string;
  };

function fail(code: string): never {
  throw new Error(`AI_GOVERNANCE_DENIED:${code}`);
}

export async function resolveActiveAiGovernance(
  capabilityId: string
): Promise<ResolvedActiveAiGovernance> {
  const pointer = await getActiveGovernancePointer();

  if (!pointer) {
    return fail('NO_ACTIVE_GOVERNANCE');
  }

  const expectedPolicyDocumentId = governancePolicyDocumentId(
    pointer.governanceId,
    pointer.governanceVersion
  );

  if (pointer.policyDocumentId !== expectedPolicyDocumentId) {
    return fail('ACTIVE_POINTER_DOCUMENT_ID_MISMATCH');
  }

  const policy = await getGovernancePolicy(
    pointer.governanceId,
    pointer.governanceVersion
  );

  if (!policy) {
    return fail('ACTIVE_POLICY_NOT_FOUND');
  }

  if (
    policy.governanceId !== pointer.governanceId ||
    policy.governanceVersion !== pointer.governanceVersion
  ) {
    return fail('ACTIVE_POLICY_IDENTITY_MISMATCH');
  }

  if (policy.status !== 'ACTIVE') {
    return fail(`ACTIVE_POLICY_STATUS:${policy.status}`);
  }

  const resolved = resolveAiGovernance(capabilityId);

  if (
    resolved.governanceId !== policy.governanceId ||
    resolved.governanceVersion !== policy.governanceVersion
  ) {
    return fail('RUNTIME_GOVERNANCE_VERSION_MISMATCH');
  }

  if (resolved.executionType === 'DETERMINISTIC') {
    return {
      ...resolved,
      policyDocumentId: pointer.policyDocumentId,
    };
  }

  if (!resolved.modelId) {
    return fail('MODEL_ID_MISSING');
  }

  const model = PLATFORM_AI_MODELS_V1.find(
    item => item.modelId === resolved.modelId
  );

  if (!model || model.status !== 'ACTIVE') {
    return fail(`EXECUTION_MODEL_NOT_ACTIVE:${resolved.modelId}`);
  }

  if (
    resolved.providerId &&
    model.providerId !== resolved.providerId
  ) {
    return fail('EXECUTION_MODEL_PROVIDER_MISMATCH');
  }

  return {
    ...resolved,
    policyDocumentId: pointer.policyDocumentId,
    providerModelIdentifier: model.providerModelIdentifier,
  };
}
