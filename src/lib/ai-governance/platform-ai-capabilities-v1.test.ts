import {
  PLATFORM_AI_CAPABILITY_DEPENDENCIES_V1,
  PLATFORM_AI_CAPABILITY_IDENTITIES_V1,
  PLATFORM_AI_CAPABILITY_IDS,
  PLATFORM_AI_DEPENDENCIES_V1,
  PLATFORM_AI_MODELS_V1,
  PLATFORM_AI_PROVIDERS_V1,
  PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1,
} from './platform-ai-capabilities-v1';

describe('Platform AI Capability Registry v1', () => {
  test('contains exactly the nine canonical governed capabilities', () => {
    expect(PLATFORM_AI_CAPABILITY_IDS).toHaveLength(9);
    expect(PLATFORM_AI_CAPABILITY_IDENTITIES_V1).toHaveLength(9);

    expect(
      new Set(PLATFORM_AI_CAPABILITY_IDS).size
    ).toBe(PLATFORM_AI_CAPABILITY_IDS.length);

    expect(
      new Set(
        PLATFORM_AI_CAPABILITY_IDENTITIES_V1.map(
          capability => capability.capabilityId
        )
      ).size
    ).toBe(PLATFORM_AI_CAPABILITY_IDENTITIES_V1.length);

    expect(
      new Set(
        PLATFORM_AI_CAPABILITY_IDENTITIES_V1.map(
          capability => capability.capabilityId
        )
      )
    ).toEqual(new Set(PLATFORM_AI_CAPABILITY_IDS));
  });

  test('all provider/model bindings reference registered identities', () => {
    const capabilityIds = new Set(PLATFORM_AI_CAPABILITY_IDS);
    const providerIds = new Set(
      PLATFORM_AI_PROVIDERS_V1.map(provider => provider.providerId)
    );
    const modelIds = new Set(
      PLATFORM_AI_MODELS_V1.map(model => model.modelId)
    );

    for (const binding of PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1) {
      expect(capabilityIds.has(binding.capabilityId as never)).toBe(true);
      expect(providerIds.has(binding.providerId)).toBe(true);
      expect(modelIds.has(binding.modelId)).toBe(true);
    }
  });

  test('provider/model bindings are unique and use explicit authorization', () => {
    const bindingIds = PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1.map(
      binding => binding.bindingId
    );

    expect(new Set(bindingIds).size).toBe(bindingIds.length);

    for (const binding of PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1) {
      expect(['AUTHORIZED', 'NOT_AUTHORIZED']).toContain(
        binding.executionAuthorization
      );
    }
  });

  test('registered models reference registered providers', () => {
    const providerIds = new Set(
      PLATFORM_AI_PROVIDERS_V1.map(provider => provider.providerId)
    );

    for (const model of PLATFORM_AI_MODELS_V1) {
      expect(providerIds.has(model.providerId)).toBe(true);
    }
  });

  test('capability dependencies reference registered identities', () => {
    const capabilityIds = new Set(PLATFORM_AI_CAPABILITY_IDS);
    const dependencyIds = new Set(
      PLATFORM_AI_DEPENDENCIES_V1.map(
        dependency => dependency.dependencyId
      )
    );

    for (const mapping of PLATFORM_AI_CAPABILITY_DEPENDENCIES_V1) {
      expect(capabilityIds.has(mapping.capabilityId)).toBe(true);

      for (const dependencyId of mapping.dependencyIds) {
        expect(dependencyIds.has(dependencyId)).toBe(true);
      }
    }
  });

  test('Google Search remains a dependency rather than a governed capability', () => {
    expect(PLATFORM_AI_CAPABILITY_IDS).not.toContain(
      'GOOGLE_SEARCH_PRODUCT_RESEARCH'
    );

    expect(
      PLATFORM_AI_DEPENDENCIES_V1.some(
        dependency =>
          dependency.dependencyId === 'GOOGLE_SEARCH_PRODUCT_RESEARCH'
      )
    ).toBe(true);
  });

  test('campaign intelligence remains development and Gemini is not production-authorized', () => {
    const capability = PLATFORM_AI_CAPABILITY_IDENTITIES_V1.find(
      item => item.capabilityId === 'RETAIL_CAMPAIGN_INTELLIGENCE'
    );

    const binding = PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1.find(
      item => item.capabilityId === 'RETAIL_CAMPAIGN_INTELLIGENCE'
    );

    expect(capability).toMatchObject({
      status: 'DEVELOPMENT',
      executionType: 'MODEL_BACKED',
    });

    expect(binding?.executionAuthorization).toBe('NOT_AUTHORIZED');
  });

  test('financial narrative remains deterministic and Gemini is not production-authorized', () => {
    const capability = PLATFORM_AI_CAPABILITY_IDENTITIES_V1.find(
      item => item.capabilityId === 'ARI_FINANCIAL_NARRATIVE'
    );

    const binding = PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1.find(
      item => item.capabilityId === 'ARI_FINANCIAL_NARRATIVE'
    );

    expect(capability).toMatchObject({
      status: 'ACTIVE',
      executionType: 'DETERMINISTIC',
    });

    expect(binding?.executionAuthorization).toBe('NOT_AUTHORIZED');
  });

  test('no deterministic capability has an authorized model binding', () => {
    const deterministicCapabilityIds = new Set(
      PLATFORM_AI_CAPABILITY_IDENTITIES_V1
        .filter(capability => capability.executionType === 'DETERMINISTIC')
        .map(capability => capability.capabilityId)
    );

    for (const binding of PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1) {
      if (
        deterministicCapabilityIds.has(
          binding.capabilityId as never
        )
      ) {
        expect(binding.executionAuthorization).not.toBe('AUTHORIZED');
      }
    }
  });
});
