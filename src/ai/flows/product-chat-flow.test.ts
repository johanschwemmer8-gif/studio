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

jest.mock('@/ai/fact-context', () => ({
  buildFactContext: jest.fn(),
}));

import { ai } from '@/ai/genkit';
import { productChat } from '@/ai/flows/product-chat-flow';
import { resolveActiveAiGovernance } from '@/lib/ai-governance/resolve-active-ai-governance';

const mockGenerate = ai.generate as jest.Mock;
const mockResolveActiveAiGovernance =
  resolveActiveAiGovernance as jest.Mock;

describe('productChat governance boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
