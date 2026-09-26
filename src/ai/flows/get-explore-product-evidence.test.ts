const firestoreGetMock = jest.fn();
const collectProductEvidenceMock = jest.fn();
const createProvidersMock = jest.fn();

const mockDb = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: firestoreGetMock,
    })),
  })),
};

jest.mock('@/lib/firebase-admin', () => ({
  getDb: jest.fn(() => mockDb),
}));

jest.mock('@/lib/product-evidence-orchestrator', () => ({
  collectProductEvidence: (...args: unknown[]) =>
    collectProductEvidenceMock(...args),
}));

jest.mock(
  '@/lib/product-evidence-providers/production-product-evidence',
  () => ({
    createProductionProductEvidenceProviders: (...args: unknown[]) =>
      createProvidersMock(...args),
  }),
);

import { getExploreProductEvidence } from './get-explore-product-evidence';

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

const productionSession = {
  sessionId: 'session-1',
  retailerId: 'retailer-1',
  campaignId: 'campaign-1',
  activationId: 'activation-1',
  deploymentId: 'deployment-1',
  qrCodeId: 'qr-1',
  configurationVersion: 1,
  environment: 'PRODUCTION',
  startedAt: timestamp,
  lastInteractionAt: timestamp,
  entryGtin: '06001234567890',
};

function evidenceFact(
  key: string,
  verificationState:
    | 'VERIFIED'
    | 'SUPPORTED'
    | 'UNVERIFIED'
    | 'CONFLICTED',
  hasConflict = false,
) {
  return {
    key,
    label: key,
    value: `${key}-value`,
    source: {
      sourceType: 'INTERACT_PRODUCT_CATALOG',
      sourceName: 'Test source',
      retrievedAt: '2026-09-26T00:00:00.000Z',
      identityMatched: true,
    },
    verificationState,
    hasConflict,
  };
}

describe('getExploreProductEvidence', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    createProvidersMock.mockReturnValue([
      { sourceType: 'INTERACT_PRODUCT_CATALOG' },
    ]);

    firestoreGetMock.mockResolvedValue({
      exists: true,
      data: () => productionSession,
    });

    collectProductEvidenceMock.mockResolvedValue({
      evidence: {
        identity: {
          gtin: '06001234567890',
          productName: 'Test Product',
          brandName: 'Test Brand',
        },
        facts: [
          evidenceFact('verifiedFact', 'VERIFIED'),
          evidenceFact('supportedFact', 'SUPPORTED'),
        ],
        evidenceState: 'SUFFICIENT',
        limitations: [],
      },
      sourceResults: [],
    });
  });

  it('rejects a missing session id before accessing Firestore', async () => {
    const result = await getExploreProductEvidence({
      sessionId: '   ',
    });

    expect(result).toMatchObject({
      success: false,
      code: 'SESSION_UNAVAILABLE',
    });

    expect(mockDb.collection).not.toHaveBeenCalled();
    expect(collectProductEvidenceMock).not.toHaveBeenCalled();
  });

  it('uses authoritative session identity and retailer context', async () => {
    const result = await getExploreProductEvidence({
      sessionId: '  session-1  ',
    });

    expect(collectProductEvidenceMock).toHaveBeenCalledWith(
      {
        gtin: '06001234567890',
      },
      {
        retailerId: 'retailer-1',
      },
      expect.any(Array),
    );

    expect(result).toMatchObject({
      success: true,
      product: {
        gtin: '06001234567890',
        productName: 'Test Product',
        brandName: 'Test Brand',
      },
    });
  });

  it('exposes only non-conflicted VERIFIED and SUPPORTED facts', async () => {
    collectProductEvidenceMock.mockResolvedValue({
      evidence: {
        identity: {
          gtin: '06001234567890',
        },
        facts: [
          evidenceFact('verifiedFact', 'VERIFIED'),
          evidenceFact('supportedFact', 'SUPPORTED'),
          evidenceFact('unverifiedFact', 'UNVERIFIED'),
          evidenceFact('conflictedFact', 'CONFLICTED', true),
          evidenceFact('conflictedVerifiedFact', 'VERIFIED', true),
        ],
        evidenceState: 'LIMITED',
        limitations: ['Some information is unavailable.'],
      },
      sourceResults: [],
    });

    const result = await getExploreProductEvidence({
      sessionId: 'session-1',
    });

    expect(result).toEqual({
      success: true,
      product: {
        gtin: '06001234567890',
      },
      facts: [
        {
          key: 'verifiedFact',
          label: 'verifiedFact',
          value: 'verifiedFact-value',
          verificationState: 'VERIFIED',
        },
        {
          key: 'supportedFact',
          label: 'supportedFact',
          value: 'supportedFact-value',
          verificationState: 'SUPPORTED',
        },
      ],
      evidenceState: 'LIMITED',
      limitations: ['Some information is unavailable.'],
    });
  });

  it('allows insufficient evidence to remain a successful truthful result', async () => {
    collectProductEvidenceMock.mockResolvedValue({
      evidence: {
        identity: {
          gtin: '06001234567890',
        },
        facts: [],
        evidenceState: 'INSUFFICIENT',
        limitations: ['No reliable product facts are currently available.'],
      },
      sourceResults: [],
    });

    const result = await getExploreProductEvidence({
      sessionId: 'session-1',
    });

    expect(result).toEqual({
      success: true,
      product: {
        gtin: '06001234567890',
      },
      facts: [],
      evidenceState: 'INSUFFICIENT',
      limitations: [
        'No reliable product facts are currently available.',
      ],
    });
  });

  it('fails closed when the session has no authoritative product identity', async () => {
    firestoreGetMock.mockResolvedValue({
      exists: true,
      data: () => ({
        ...productionSession,
        entryGtin: undefined,
      }),
    });

    const result = await getExploreProductEvidence({
      sessionId: 'session-1',
    });

    expect(result).toMatchObject({
      success: false,
      code: 'PRIMARY_PRODUCT_UNAVAILABLE',
    });

    expect(collectProductEvidenceMock).not.toHaveBeenCalled();
  });

  it('contains unexpected evidence acquisition failure', async () => {
    collectProductEvidenceMock.mockRejectedValue(
      new Error('provider failure'),
    );

    const result = await getExploreProductEvidence({
      sessionId: 'session-1',
    });

    expect(result).toMatchObject({
      success: false,
      code: 'EVIDENCE_UNAVAILABLE',
    });
  });
});
