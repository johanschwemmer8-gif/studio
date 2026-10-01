jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
  },
}));

jest.mock('genkit', () => ({
  z: require('zod').z,
}));

jest.mock(
  '@/lib/ai-governance/resolve-active-ai-governance',
  () => ({
    resolveActiveAiGovernance: jest.fn(),
  }),
);

jest.mock('@/lib/firebase-admin', () => ({
  getDb: jest.fn(() => null),
  admin: {},
}));

jest.mock('@/lib/resolve-ari-configuration', () => ({
  createDefaultAriConfiguration: jest.fn((retailerId) => ({
    retailerId,
    configurationVersion: '1.0.0',
    source: 'PLATFORM_DEFAULT',
    assistantName: 'Ari',
    personality: 'FRIENDLY_APPROACHABLE',
    tone: 'CONVERSATIONAL',
    brandVoice: '',
    welcomeMessage:
      "Hi! I'm Ari. How can I help you with this product today?",
    recommendationCount: 3,
    includePrice: true,
    showAvailability: true,
  })),
  resolveAriConfiguration: jest.fn(),
}));

jest.mock('@/ai/fact-context', () => ({
  buildFactContext: jest.fn(),
}));

jest.mock('@/lib/schemas/shopper-session', () => ({
  ShopperSessionSchema: {
    parse: jest.fn((value) => value),
  },
}));

jest.mock('@/lib/shopper-session-authority', () => ({
  deriveShopperSessionAuthority: jest.fn(),
}));

jest.mock('@/lib/resolve-activation-ari-context', () => ({
  resolveActivationAriContext: jest.fn(),
}));

import { ai } from '@/ai/genkit';
import { productChat } from '@/ai/flows/product-chat-flow';
import { resolveActiveAiGovernance } from '@/lib/ai-governance/resolve-active-ai-governance';
import {
  createDefaultAriConfiguration,
  resolveAriConfiguration,
} from '@/lib/resolve-ari-configuration';
import { getDb } from '@/lib/firebase-admin';
import { deriveShopperSessionAuthority } from '@/lib/shopper-session-authority';
import { resolveActivationAriContext } from '@/lib/resolve-activation-ari-context';

const mockGenerate = ai.generate as jest.Mock;
const mockResolveActiveAiGovernance =
  resolveActiveAiGovernance as jest.Mock;
const mockCreateDefaultAriConfiguration =
  createDefaultAriConfiguration as jest.Mock;
const mockResolveAriConfiguration =
  resolveAriConfiguration as jest.Mock;
const mockGetDb = getDb as jest.Mock;
const mockDeriveShopperSessionAuthority =
  deriveShopperSessionAuthority as jest.Mock;
const mockResolveActivationAriContext =
  resolveActivationAriContext as jest.Mock;

const authorizedGovernance = {
  governanceId: 'INTERACT-AI-GOVERNANCE-V1',
  governanceVersion: '1.0.0',
  policyDocumentId: 'INTERACT-AI-GOVERNANCE-V1__1.0.0',
  capabilityId: 'ARI_PRODUCT_CHAT',
  capabilityVersion: '1.0.0',
  executionType: 'HYBRID',
  effectiveControlIds: [],
  providerId: 'GOOGLE_AI',
  modelId: 'GOOGLE_AI_GEMINI_2_5_FLASH',
  providerModelBindingId:
    'ARI_PRODUCT_CHAT__GOOGLE_AI_GEMINI_2_5_FLASH',
  providerModelIdentifier: 'googleai/gemini-2.5-flash',
};

const groundedOutput = {
  message: 'Grounded response.',
  signals: [],
  shopperContext: {
    requirements: [],
    preferences: [],
    dislikes: [],
    consideredGtins: [],
    seenGtins: [],
    unresolvedQuestions: [],
  },
};

describe('productChat governance boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockResolveActivationAriContext.mockResolvedValue({
      activationId: 'activation-a',
      retailerId: 'retailer-a',
      shopperObjective: 'Help the shopper make an informed choice.',
    });
  });

  it('fails closed before model execution when governance denies Product Chat', async () => {
    mockResolveActiveAiGovernance.mockRejectedValue(
      new Error('AI_GOVERNANCE_DENIED:NO_ACTIVE_GOVERNANCE'),
    );

    await expect(
      productChat({
        history: [
          {
            role: 'user',
            content: 'Tell me about this product.',
          },
        ],
        hasConsent: false,
      }),
    ).rejects.toThrow(
      'AI_GOVERNANCE_DENIED:NO_ACTIVE_GOVERNANCE',
    );

    expect(mockResolveActiveAiGovernance).toHaveBeenCalledWith(
      'ARI_PRODUCT_CHAT',
    );
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('uses only the governance-authorized executable model identifier', async () => {
    mockResolveActiveAiGovernance.mockResolvedValue({
      governanceId: 'INTERACT-AI-GOVERNANCE-V1',
      governanceVersion: '1.0.0',
      policyDocumentId:
        'INTERACT-AI-GOVERNANCE-V1__1.0.0',
      capabilityId: 'ARI_PRODUCT_CHAT',
      capabilityVersion: '1.0.0',
      executionType: 'HYBRID',
      effectiveControlIds: [],
      providerId: 'GOOGLE_AI',
      modelId: 'GOOGLE_AI_GEMINI_2_5_FLASH',
      providerModelBindingId:
        'ARI_PRODUCT_CHAT__GOOGLE_AI_GEMINI_2_5_FLASH',
      providerModelIdentifier:
        'googleai/gemini-2.5-flash',
    });

    mockGenerate.mockResolvedValue({
      output: {
        message: 'Grounded response.',
        signals: [],
        shopperContext: {
          requirements: [],
          preferences: [],
          dislikes: [],
          consideredGtins: [],
          seenGtins: [],
          unresolvedQuestions: [],
        },
      },
    });

    const result = await productChat({
      history: [
        {
          role: 'user',
          content: 'Tell me about this product.',
        },
      ],
      hasConsent: false,
    });

    expect(mockResolveActiveAiGovernance).toHaveBeenCalledWith(
      'ARI_PRODUCT_CHAT',
    );

    expect(mockGenerate).toHaveBeenCalledTimes(1);

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'googleai/gemini-2.5-flash',
      }),
    );

    expect(result.message).toBe('Grounded response.');
  });

  it('uses platform Ari defaults when no authoritative shopper session exists', async () => {
    mockGetDb.mockReturnValue(null);
    mockResolveActiveAiGovernance.mockResolvedValue(
      authorizedGovernance
    );
    mockGenerate.mockResolvedValue({
      output: groundedOutput,
    });

    await productChat({
      retailerId: 'caller-controlled-retailer',
      history: [
        {
          role: 'user',
          content: 'Tell me about this product.',
        },
      ],
      hasConsent: false,
    });

    expect(mockCreateDefaultAriConfiguration)
      .toHaveBeenCalledWith('PLATFORM_DEFAULT');
    expect(mockResolveAriConfiguration)
      .not.toHaveBeenCalled();
  });

  it('resolves retailer Ari configuration only from authoritative session identity', async () => {
    const sessionData = {
      sessionId: 'session-a',
      retailerId: 'retailer-authoritative',
    };

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => sessionData,
          }),
        })),
      })),
    });

    mockDeriveShopperSessionAuthority.mockReturnValue({
      sessionId: 'session-a',
      retailerId: 'retailer-authoritative',
      activationId: 'activation-a',
      gtin: undefined,
      shopperId: undefined,
    });

    mockResolveActiveAiGovernance.mockResolvedValue(
      authorizedGovernance
    );

    mockResolveAriConfiguration.mockResolvedValue({
      retailerId: 'retailer-authoritative',
      configurationVersion: '1.0.0',
      source: 'RETAILER_CONFIGURATION',
      assistantName: 'Retail Ari',
      personality: 'PROFESSIONAL_HELPFUL',
      tone: 'FORMAL',
      brandVoice: 'Clear and practical.',
      welcomeMessage: 'Welcome.',
      recommendationCount: 2,
      includePrice: false,
      showAvailability: false,
    });

    mockGenerate.mockRejectedValue(
      new Error('MODEL_TEST_STOP')
    );

    await productChat({
      sessionId: 'session-a',
      retailerId: 'retailer-authoritative',
      history: [
        {
          role: 'user',
          content: 'Help me decide.',
        },
      ],
      hasConsent: false,
    });

    expect(mockDeriveShopperSessionAuthority)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          requestedSessionId: 'session-a',
          requestedRetailerId:
            'retailer-authoritative',
          session: sessionData,
        })
      );

    expect(mockResolveAriConfiguration)
      .toHaveBeenCalledWith(
        'retailer-authoritative'
      );
  });

  it('fails closed on tenant mismatch before configuration or model execution', async () => {
    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              sessionId: 'session-a',
              retailerId: 'retailer-a',
            }),
          }),
        })),
      })),
    });

    mockDeriveShopperSessionAuthority.mockImplementation(
      () => {
        throw new Error(
          'SHOPPER_SESSION_DENIED:TENANT_MISMATCH'
        );
      }
    );

    await expect(
      productChat({
        sessionId: 'session-a',
        retailerId: 'retailer-b',
        history: [
          {
            role: 'user',
            content: 'Tell me about this product.',
          },
        ],
        hasConsent: false,
      })
    ).rejects.toThrow(
      'SHOPPER_SESSION_DENIED:TENANT_MISMATCH'
    );

    expect(mockResolveAriConfiguration)
      .not.toHaveBeenCalled();
    expect(mockResolveActiveAiGovernance)
      .not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('applies bounded retailer communication preferences without changing the governance-authorized model', async () => {
    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              sessionId: 'session-a',
              retailerId: 'retailer-a',
            }),
          }),
        })),
      })),
    });

    mockDeriveShopperSessionAuthority.mockReturnValue({
      sessionId: 'session-a',
      retailerId: 'retailer-a',
      activationId: 'activation-a',
      gtin: undefined,
      shopperId: undefined,
    });

    mockResolveActiveAiGovernance.mockResolvedValue(
      authorizedGovernance
    );

    mockResolveAriConfiguration.mockResolvedValue({
      retailerId: 'retailer-a',
      configurationVersion: '1.0.0',
      source: 'RETAILER_CONFIGURATION',
      assistantName: 'Retail Ari',
      personality: 'EXPERT_INFORMATIVE',
      tone: 'CONCISE',
      brandVoice: 'Clear and practical.',
      welcomeMessage: 'Welcome.',
      recommendationCount: 2,
      includePrice: false,
      showAvailability: false,
    });

    mockGenerate.mockRejectedValue(
      new Error('MODEL_TEST_STOP')
    );

    await productChat({
      sessionId: 'session-a',
      retailerId: 'retailer-a',
      history: [
        {
          role: 'user',
          content: 'Help me decide.',
        },
      ],
      hasConsent: false,
    });

    expect(mockGenerate).toHaveBeenCalledTimes(1);

    const generationRequest =
      mockGenerate.mock.calls[0][0];

    expect(generationRequest.model).toBe(
      'googleai/gemini-2.5-flash'
    );

    const systemText =
      generationRequest.messages[0].content[0].text;

    expect(systemText).toContain(
      'You are Retail Ari'
    );
    expect(systemText).toContain(
      'Expert and informative'
    );
    expect(systemText).toContain(
      'Keep responses concise.'
    );
    expect(systemText).toContain(
      'Clear and practical.'
    );
    expect(systemText).toContain(
      'Maximum recommendations when recommendations are appropriate: 2'
    );
    expect(systemText).toContain(
      'Price presentation enabled: no'
    );
    expect(systemText).toContain(
      'Availability presentation enabled: no'
    );
    expect(systemText).toContain(
      'subordinate to the Ari Evidence Contract'
    );
  });

  it('applies authoritative Activation context with Activation tone precedence', async () => {
    const sessionData = {
      sessionId: 'session-a',
      retailerId: 'retailer-a',
      activationId: 'activation-a',
    };

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => sessionData,
          }),
        })),
      })),
    });

    mockDeriveShopperSessionAuthority.mockReturnValue({
      sessionId: 'session-a',
      retailerId: 'retailer-a',
      activationId: 'activation-a',
      gtin: undefined,
      shopperId: undefined,
    });

    mockResolveActiveAiGovernance.mockResolvedValue(
      authorizedGovernance
    );

    mockResolveAriConfiguration.mockResolvedValue({
      retailerId: 'retailer-a',
      configurationVersion: '1.0.0',
      source: 'RETAILER_CONFIGURATION',
      assistantName: 'Retail Ari',
      personality: 'PROFESSIONAL_HELPFUL',
      tone: 'FORMAL',
      brandVoice: '',
      welcomeMessage: 'Retailer welcome.',
      recommendationCount: 3,
      includePrice: true,
      showAvailability: true,
    });

    mockResolveActivationAriContext.mockResolvedValue({
      activationId: 'activation-a',
      retailerId: 'retailer-a',
      shopperObjective: 'Help the shopper compare suitable options.',
      persona: 'Category specialist',
      tone: 'Warm and concise',
      greeting: 'Activation greeting must not enter Product Chat.',
      goal: 'Legacy goal must not enter Product Chat.',
      advancedInstructions: 'Legacy instructions must not enter Product Chat.',
      landingPageUrl: 'https://example.com/legacy',
    });

    mockGenerate.mockRejectedValue(
      new Error('MODEL_TEST_STOP')
    );

    await productChat({
      sessionId: 'session-a',
      retailerId: 'retailer-a',
      history: [
        {
          role: 'user',
          content: 'Help me compare.',
        },
      ],
      hasConsent: false,
    });

    expect(mockResolveActivationAriContext)
      .toHaveBeenCalledWith(
        'activation-a',
        'retailer-a'
      );

    expect(mockGenerate).toHaveBeenCalledTimes(1);

    const generationRequest =
      mockGenerate.mock.calls[0][0];

    expect(generationRequest.model).toBe(
      'googleai/gemini-2.5-flash'
    );

    const systemText =
      generationRequest.messages[0].content[0].text;

    expect(systemText).toContain(
      'Retailer tone: Use a formal communication tone.'
    );
    expect(systemText).toContain(
      'Shopper objective for this Activation: Help the shopper compare suitable options.'
    );
    expect(systemText).toContain(
      'Activation communication context: Category specialist'
    );
    expect(systemText).toContain(
      'Effective tone: Activation communication tone: Warm and concise'
    );

    expect(systemText).not.toContain(
      'Activation greeting must not enter Product Chat.'
    );
    expect(systemText).not.toContain(
      'Legacy goal must not enter Product Chat.'
    );
    expect(systemText).not.toContain(
      'Legacy instructions must not enter Product Chat.'
    );
    expect(systemText).not.toContain(
      'https://example.com/legacy'
    );
  });

  it('fails closed before model execution when authoritative Activation context is denied', async () => {
    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              sessionId: 'session-a',
              retailerId: 'retailer-a',
              activationId: 'activation-a',
            }),
          }),
        })),
      })),
    });

    mockDeriveShopperSessionAuthority.mockReturnValue({
      sessionId: 'session-a',
      retailerId: 'retailer-a',
      activationId: 'activation-a',
      gtin: undefined,
      shopperId: undefined,
    });

    mockResolveActiveAiGovernance.mockResolvedValue(
      authorizedGovernance
    );

    mockResolveAriConfiguration.mockResolvedValue({
      retailerId: 'retailer-a',
      configurationVersion: '1.0.0',
      source: 'RETAILER_CONFIGURATION',
      assistantName: 'Ari',
      personality: 'FRIENDLY_APPROACHABLE',
      tone: 'CONVERSATIONAL',
      brandVoice: '',
      welcomeMessage: 'Welcome.',
      recommendationCount: 3,
      includePrice: true,
      showAvailability: true,
    });

    mockResolveActivationAriContext.mockRejectedValue(
      new Error(
        'ACTIVATION_CONTEXT_DENIED:TENANT_IDENTITY_MISMATCH'
      )
    );

    await expect(
      productChat({
        sessionId: 'session-a',
        retailerId: 'retailer-a',
        history: [
          {
            role: 'user',
            content: 'Help me decide.',
          },
        ],
        hasConsent: false,
      })
    ).rejects.toThrow(
      'ACTIVATION_CONTEXT_DENIED:TENANT_IDENTITY_MISMATCH'
    );

    expect(mockGenerate).not.toHaveBeenCalled();
  });

});
