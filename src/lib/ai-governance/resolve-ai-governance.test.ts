import { resolveAiGovernance } from './resolve-ai-governance';

describe('resolveAiGovernance', () => {
  test('fails closed for an unregistered capability', () => {
    expect(() =>
      resolveAiGovernance('UNREGISTERED_AI_CAPABILITY')
    ).toThrow(
      'AI_GOVERNANCE_DENIED:UNREGISTERED_CAPABILITY'
    );
  });

  test('refuses campaign intelligence because it is not ACTIVE', () => {
    expect(() =>
      resolveAiGovernance('RETAIL_CAMPAIGN_INTELLIGENCE')
    ).toThrow(
      'AI_GOVERNANCE_DENIED:CAPABILITY_NOT_ACTIVE:RETAIL_CAMPAIGN_INTELLIGENCE'
    );
  });

  test('resolves financial narrative as deterministic without model authority', () => {
    const result = resolveAiGovernance(
      'ARI_FINANCIAL_NARRATIVE'
    );

    expect(result.executionType).toBe('DETERMINISTIC');
    expect(result.providerId).toBeUndefined();
    expect(result.modelId).toBeUndefined();
    expect(result.providerModelBindingId).toBeUndefined();
  });

  test('resolves product chat through its authorized model binding', () => {
    const result = resolveAiGovernance(
      'ARI_PRODUCT_CHAT'
    );

    expect(result.executionType).toBe('HYBRID');
    expect(result.providerId).toBe('GOOGLE_AI');
    expect(result.modelId).toBe(
      'GOOGLE_AI_GEMINI_2_5_FLASH'
    );
    expect(result.providerModelBindingId).toBeTruthy();
  });

  test('returns the canonical runtime baseline', () => {
    const result = resolveAiGovernance(
      'ARI_PRODUCT_CHAT'
    );

    expect(result.governanceId).toBe(
      'INTERACT-AI-GOVERNANCE-V1'
    );
    expect(result.governanceVersion).toBe('1.0.0');
    expect(result.effectiveControlIds).toHaveLength(13);
    expect(new Set(result.effectiveControlIds).size).toBe(13);
  });

  test.each([
    'ARI_PRODUCT_CHAT',
    'ARI_PRODUCT_SUITABILITY',
    'ARI_CROSS_SELL_RECOMMENDATION',
    'ARI_SCAN_INTERACTION',
    'RETAIL_BEHAVIORAL_INTELLIGENCE',
    'RETAIL_DECISION_JOURNEY_INTELLIGENCE',
    'RETAIL_AGGREGATE_INTELLIGENCE',
  ])(
    'resolves active model-using capability %s through authorized model authority',
    capabilityId => {
      const result = resolveAiGovernance(capabilityId);

      expect(result.providerId).toBe('GOOGLE_AI');
      expect(result.modelId).toBe(
        'GOOGLE_AI_GEMINI_2_5_FLASH'
      );
      expect(result.providerModelBindingId).toBeTruthy();
    }
  );
});
