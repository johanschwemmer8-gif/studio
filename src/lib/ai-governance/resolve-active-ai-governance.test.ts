const mockGetActiveGovernancePointer = jest.fn();
const mockGetGovernancePolicy = jest.fn();

jest.mock('./governance-repository', () => ({
  getActiveGovernancePointer: () =>
    mockGetActiveGovernancePointer(),
  getGovernancePolicy: (
    governanceId: string,
    governanceVersion: string
  ) =>
    mockGetGovernancePolicy(
      governanceId,
      governanceVersion
    ),
}));

import {
  resolveActiveAiGovernance,
} from './resolve-active-ai-governance';

const timestamp = {
  seconds: 1760000000,
  nanoseconds: 0,
};

const pointer = {
  governanceId: 'INTERACT-AI-GOVERNANCE-V1',
  governanceVersion: '1.0.0',
  policyDocumentId:
    'INTERACT-AI-GOVERNANCE-V1__1.0.0',
  activatedAt: timestamp,
  activatedBy: 'operator_1',
};

const activePolicy = {
  governanceId: 'INTERACT-AI-GOVERNANCE-V1',
  governanceVersion: '1.0.0',
  name: 'iNteract Platform AI Governance',
  status: 'ACTIVE',
  createdAt: timestamp,
  createdBy: 'operator_1',
  updatedAt: timestamp,
  updatedBy: 'operator_1',
  effectiveAt: timestamp,
};

describe('resolveActiveAiGovernance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveGovernancePointer.mockResolvedValue(
      pointer
    );
    mockGetGovernancePolicy.mockResolvedValue(
      activePolicy
    );
  });

  test('fails closed when no governance is active', async () => {
    mockGetActiveGovernancePointer.mockResolvedValue(
      null
    );

    await expect(
      resolveActiveAiGovernance('ARI_PRODUCT_CHAT')
    ).rejects.toThrow(
      'AI_GOVERNANCE_DENIED:NO_ACTIVE_GOVERNANCE'
    );
  });

  test('rejects corrupt active pointer identity', async () => {
    mockGetActiveGovernancePointer.mockResolvedValue({
      ...pointer,
      policyDocumentId: 'corrupt-document-id',
    });

    await expect(
      resolveActiveAiGovernance('ARI_PRODUCT_CHAT')
    ).rejects.toThrow(
      'AI_GOVERNANCE_DENIED:ACTIVE_POINTER_DOCUMENT_ID_MISMATCH'
    );
  });

  test('fails closed when active policy is missing', async () => {
    mockGetGovernancePolicy.mockResolvedValue(null);

    await expect(
      resolveActiveAiGovernance('ARI_PRODUCT_CHAT')
    ).rejects.toThrow(
      'AI_GOVERNANCE_DENIED:ACTIVE_POLICY_NOT_FOUND'
    );
  });

  test('requires the persisted policy to be ACTIVE', async () => {
    mockGetGovernancePolicy.mockResolvedValue({
      ...activePolicy,
      status: 'APPROVED',
    });

    await expect(
      resolveActiveAiGovernance('ARI_PRODUCT_CHAT')
    ).rejects.toThrow(
      'AI_GOVERNANCE_DENIED:ACTIVE_POLICY_STATUS:APPROVED'
    );
  });

  test('resolves authorized Product Chat execution', async () => {
    const result =
      await resolveActiveAiGovernance(
        'ARI_PRODUCT_CHAT'
      );

    expect(result.capabilityId).toBe(
      'ARI_PRODUCT_CHAT'
    );
    expect(result.executionType).toBe('HYBRID');
    expect(result.providerId).toBe('GOOGLE_AI');
    expect(result.modelId).toBe(
      'GOOGLE_AI_GEMINI_2_5_FLASH'
    );
    expect(result.providerModelBindingId).toBe(
      'ARI_PRODUCT_CHAT__GOOGLE_AI_GEMINI_2_5_FLASH'
    );
    expect(result.providerModelIdentifier).toBe(
      'googleai/gemini-2.5-flash'
    );
    expect(result.policyDocumentId).toBe(
      'INTERACT-AI-GOVERNANCE-V1__1.0.0'
    );
  });

  test('preserves deterministic capability without model authority', async () => {
    const result =
      await resolveActiveAiGovernance(
        'ARI_FINANCIAL_NARRATIVE'
      );

    expect(result.executionType).toBe(
      'DETERMINISTIC'
    );
    expect(result.providerId).toBeUndefined();
    expect(result.modelId).toBeUndefined();
    expect(
      result.providerModelIdentifier
    ).toBeUndefined();
  });

  test('continues to deny a non-active capability', async () => {
    await expect(
      resolveActiveAiGovernance(
        'RETAIL_CAMPAIGN_INTELLIGENCE'
      )
    ).rejects.toThrow(
      'AI_GOVERNANCE_DENIED:CAPABILITY_NOT_ACTIVE:RETAIL_CAMPAIGN_INTELLIGENCE'
    );
  });
});
