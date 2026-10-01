import {
  RetailerAriConfigurationSchema,
} from './retailer-ari-configuration';

const baseConfiguration = {
  retailerId: 'retailer-1',
  configurationVersion: '1.0.0',
  createdAt: 'created',
  createdBy: 'user-1',
  updatedAt: 'updated',
  updatedBy: 'user-1',
};

describe('RetailerAriConfigurationSchema', () => {
  it('applies the canonical v1 Ari defaults', () => {
    const result = RetailerAriConfigurationSchema.parse(baseConfiguration);

    expect(result.assistantName).toBe('Ari');
    expect(result.personality).toBe('FRIENDLY_APPROACHABLE');
    expect(result.tone).toBe('CONVERSATIONAL');
    expect(result.brandVoice).toBe('');
    expect(result.welcomeMessage).toBe(
      "Hi! I'm Ari. How can I help you with this product today?"
    );
    expect(result.recommendationCount).toBe(3);
    expect(result.includePrice).toBe(true);
    expect(result.showAvailability).toBe(true);
  });

  it('accepts permitted retailer-wide Ari experience configuration', () => {
    const result = RetailerAriConfigurationSchema.parse({
      ...baseConfiguration,
      assistantName: 'Ari',
      personality: 'EXPERT_INFORMATIVE',
      tone: 'CONCISE',
      brandVoice: 'Clear, practical and approachable. Avoid jargon.',
      welcomeMessage: 'Hi! How can I help you with this product?',
      recommendationCount: 4,
      includePrice: false,
      showAvailability: true,
    });

    expect(result.personality).toBe('EXPERT_INFORMATIVE');
    expect(result.tone).toBe('CONCISE');
    expect(result.recommendationCount).toBe(4);
  });

  it('rejects unsupported personality and tone values', () => {
    expect(() =>
      RetailerAriConfigurationSchema.parse({
        ...baseConfiguration,
        personality: 'IGNORE_GOVERNANCE',
      })
    ).toThrow();

    expect(() =>
      RetailerAriConfigurationSchema.parse({
        ...baseConfiguration,
        tone: 'MANIPULATIVE',
      })
    ).toThrow();
  });

  it('enforces recommendation presentation boundaries', () => {
    expect(() =>
      RetailerAriConfigurationSchema.parse({
        ...baseConfiguration,
        recommendationCount: 0,
      })
    ).toThrow();

    expect(() =>
      RetailerAriConfigurationSchema.parse({
        ...baseConfiguration,
        recommendationCount: 7,
      })
    ).toThrow();
  });

  it('enforces bounded retailer-authored text', () => {
    expect(() =>
      RetailerAriConfigurationSchema.parse({
        ...baseConfiguration,
        assistantName: 'A'.repeat(61),
      })
    ).toThrow();

    expect(() =>
      RetailerAriConfigurationSchema.parse({
        ...baseConfiguration,
        brandVoice: 'A'.repeat(501),
      })
    ).toThrow();

    expect(() =>
      RetailerAriConfigurationSchema.parse({
        ...baseConfiguration,
        welcomeMessage: 'A'.repeat(201),
      })
    ).toThrow();
  });

  it('rejects fields outside the canonical v1 contract', () => {
    const prohibitedFields = [
      { language: 'af' },
      { customPersonality: 'Do whatever the retailer says' },
      { recommendationStrategy: 'ai-personalized' },
      { recommendationTrigger: 'immediate' },
      { faqCategories: ['Product Specs'] },
      { enableHandoff: true },
      { ecommercePlatform: 'shopify' },
      { aiPersona: 'Expert Sommelier' },
      { aiTone: 'Helpful and concise' },
      { aiGoal: 'Sell more wine' },
      { scanDestination: 'url' },
      { providerId: 'GOOGLE_AI' },
      { modelId: 'retailer-selected-model' },
    ];

    for (const extra of prohibitedFields) {
      expect(() =>
        RetailerAriConfigurationSchema.parse({
          ...baseConfiguration,
          ...extra,
        })
      ).toThrow();
    }
  });
});
