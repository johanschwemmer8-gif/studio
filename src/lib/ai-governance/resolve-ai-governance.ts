import {
  PLATFORM_AI_CAPABILITY_IDENTITIES_V1,
  PLATFORM_AI_MODELS_V1,
  PLATFORM_AI_PROVIDERS_V1,
  PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1,
  type PlatformAiCapabilityId,
} from './platform-ai-capabilities-v1';
import { PLATFORM_AI_RUNTIME_BASELINE_V1 } from './platform-ai-runtime-baseline-v1';

export type ResolvedAiGovernance = {
  governanceId: string;
  governanceVersion: string;
  capabilityId: PlatformAiCapabilityId;
  capabilityVersion: string;
  executionType: 'DETERMINISTIC' | 'MODEL_BACKED' | 'HYBRID';
  effectiveControlIds: readonly string[];
  providerId?: string;
  modelId?: string;
  providerModelBindingId?: string;
};

function fail(code: string): never {
  throw new Error(`AI_GOVERNANCE_DENIED:${code}`);
}

export function resolveAiGovernance(
  capabilityId: string
): ResolvedAiGovernance {
  const capability = PLATFORM_AI_CAPABILITY_IDENTITIES_V1.find(
    item => item.capabilityId === capabilityId
  );

  if (!capability) {
    return fail('UNREGISTERED_CAPABILITY');
  }

  if (capability.status !== 'ACTIVE') {
    return fail(`CAPABILITY_NOT_ACTIVE:${capability.capabilityId}`);
  }

  const base = {
    governanceId: PLATFORM_AI_RUNTIME_BASELINE_V1.governanceId,
    governanceVersion: PLATFORM_AI_RUNTIME_BASELINE_V1.governanceVersion,
    capabilityId: capability.capabilityId,
    capabilityVersion: '1.0.0',
    executionType: capability.executionType,
    effectiveControlIds: PLATFORM_AI_RUNTIME_BASELINE_V1.controlIds,
  };

  if (capability.executionType === 'DETERMINISTIC') {
    const authorizedBindings =
      PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1.filter(
        binding =>
          binding.capabilityId === capability.capabilityId &&
          binding.status === 'ACTIVE' &&
          binding.executionAuthorization === 'AUTHORIZED'
      );

    if (authorizedBindings.length !== 0) {
      return fail(
        `DETERMINISTIC_CAPABILITY_HAS_AUTHORIZED_MODEL:${capability.capabilityId}`
      );
    }

    return base;
  }

  const authorizedBindings =
    PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1.filter(
      binding =>
        binding.capabilityId === capability.capabilityId &&
        binding.status === 'ACTIVE' &&
        binding.executionAuthorization === 'AUTHORIZED'
    );

  if (authorizedBindings.length !== 1) {
    return fail(
      `AUTHORIZED_BINDING_COUNT:${capability.capabilityId}:${authorizedBindings.length}`
    );
  }

  const binding = authorizedBindings[0];

  const provider = PLATFORM_AI_PROVIDERS_V1.find(
    item => item.providerId === binding.providerId
  );

  if (!provider || provider.status !== 'ACTIVE') {
    return fail(`PROVIDER_NOT_ACTIVE:${binding.providerId}`);
  }

  const model = PLATFORM_AI_MODELS_V1.find(
    item => item.modelId === binding.modelId
  );

  if (
    !model ||
    model.status !== 'ACTIVE' ||
    model.providerId !== provider.providerId
  ) {
    return fail(`MODEL_NOT_ACTIVE_OR_INVALID:${binding.modelId}`);
  }

  return {
    ...base,
    providerId: provider.providerId,
    modelId: model.modelId,
    providerModelBindingId: binding.bindingId,
  };
}
