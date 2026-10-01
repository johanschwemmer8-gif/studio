const mockResolveActiveAiGovernance = jest.fn();
const mockGetRetailerAiGovernance = jest.fn();

jest.mock('./resolve-active-ai-governance', () => ({
  resolveActiveAiGovernance: (...args: unknown[]) =>
    mockResolveActiveAiGovernance(...args),
}));

jest.mock('./retailer-governance-repository', () => ({
  getRetailerAiGovernance: (...args: unknown[]) =>
    mockGetRetailerAiGovernance(...args),
}));

import {
  resolveEffectiveAiGovernance,
} from './resolve-effective-ai-governance';

const platformGovernance = {
  governanceId: 'INTERACT-AI-GOVERNANCE-V1',
  governanceVersion: '1.0.0',
  capabilityId: 'ARI_PRODUCT_CHAT',
  executionType: 'MODEL_BACKED',
  providerId: 'GOOGLE_AI',
  modelId: 'GOOGLE_AI_GEMINI_2_5_FLASH',
  policyDocumentId:
    'INTERACT-AI-GOVERNANCE-V1__1.0.0',
  providerModelIdentifier:
    'googleai/gemini-2.5-flash',
};

const validRule = {
  ruleId: 'rule-001',
  ruleType: 'TRANSPARENCY_REQUIREMENT',
  platformControlId: 'GOV-12-001',
  title: 'Additional AI disclosure',
  description:
    'Retailer requires additional AI disclosure.',
  value: 'Additional retailer disclosure.',
};

function retailerGovernance(
  overrides: Record<string, unknown> = {}
) {
  return {
    retailerId: 'retailer-a',
    governanceVersion: '1.0.0',
    status: 'ACTIVE',
    additiveRules: [validRule],
    createdAt: 'created',
    createdBy: 'user-1',
    updatedAt: 'updated',
    updatedBy: 'user-1',
    ...overrides,
  };
}

describe('resolveEffectiveAiGovernance', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockResolveActiveAiGovernance.mockResolvedValue(
      platformGovernance
    );

    mockGetRetailerAiGovernance.mockResolvedValue(
      null
    );
  });

  it('requires a retailer identity', async () => {
    await expect(
      resolveEffectiveAiGovernance(
        'ARI_PRODUCT_CHAT',
        ''
      )
    ).rejects.toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:RETAILER_ID_REQUIRED'
    );

    expect(
      mockResolveActiveAiGovernance
    ).not.toHaveBeenCalled();
  });

  it('propagates Platform Governance failure unchanged', async () => {
    mockResolveActiveAiGovernance.mockRejectedValue(
      new Error(
        'AI_GOVERNANCE_DENIED:NO_ACTIVE_GOVERNANCE'
      )
    );

    await expect(
      resolveEffectiveAiGovernance(
        'ARI_PRODUCT_CHAT',
        'retailer-a'
      )
    ).rejects.toThrow(
      'AI_GOVERNANCE_DENIED:NO_ACTIVE_GOVERNANCE'
    );

    expect(
      mockGetRetailerAiGovernance
    ).not.toHaveBeenCalled();
  });

  it('uses Platform baseline when retailer governance is absent', async () => {
    const result =
      await resolveEffectiveAiGovernance(
        'ARI_PRODUCT_CHAT',
        'retailer-a'
      );

    expect(result).toEqual({
      ...platformGovernance,
      retailerId: 'retailer-a',
      retailerGovernanceVersion: null,
      retailerGovernanceApplied: false,
      retailerAdditiveRules: [],
    });
  });

  it('uses Platform baseline when retailer governance is inactive', async () => {
    mockGetRetailerAiGovernance.mockResolvedValue(
      retailerGovernance({
        status: 'INACTIVE',
      })
    );

    const result =
      await resolveEffectiveAiGovernance(
        'ARI_PRODUCT_CHAT',
        'retailer-a'
      );

    expect(
      result.retailerGovernanceApplied
    ).toBe(false);

    expect(
      result.retailerGovernanceVersion
    ).toBe('1.0.0');

    expect(
      result.retailerAdditiveRules
    ).toEqual([]);
  });

  it('applies valid ACTIVE retailer additive governance', async () => {
    mockGetRetailerAiGovernance.mockResolvedValue(
      retailerGovernance()
    );

    const result =
      await resolveEffectiveAiGovernance(
        'ARI_PRODUCT_CHAT',
        'retailer-a'
      );

    expect(
      result.retailerGovernanceApplied
    ).toBe(true);

    expect(
      result.retailerGovernanceVersion
    ).toBe('1.0.0');

    expect(
      result.retailerAdditiveRules
    ).toEqual([validRule]);

    expect(result.governanceId).toBe(
      platformGovernance.governanceId
    );

    expect(result.modelId).toBe(
      platformGovernance.modelId
    );
  });

  it('fails closed when ACTIVE retailer governance is unauthorized', async () => {
    mockGetRetailerAiGovernance.mockResolvedValue(
      retailerGovernance({
        additiveRules: [
          {
            ...validRule,
            platformControlId: 'GOV-05-001',
          },
        ],
      })
    );

    await expect(
      resolveEffectiveAiGovernance(
        'ARI_PRODUCT_CHAT',
        'retailer-a'
      )
    ).rejects.toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:PLATFORM_CONTROL_NOT_EXTENSIBLE'
    );
  });

  it('fails closed when persisted retailer governance is malformed', async () => {
    mockGetRetailerAiGovernance.mockResolvedValue({
      retailerId: 'retailer-a',
      governanceVersion: '',
      status: 'ACTIVE',
      additiveRules: [],
    });

    await expect(
      resolveEffectiveAiGovernance(
        'ARI_PRODUCT_CHAT',
        'retailer-a'
      )
    ).rejects.toThrow();
  });
});
