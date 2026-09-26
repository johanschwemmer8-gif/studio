const mockSessionGet = jest.fn();
const mockResolveComparisonProduct = jest.fn();
const mockCollectProductEvidence = jest.fn();
const mockCreateProviders = jest.fn();

jest.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: mockSessionGet,
      })),
    })),
  },
}));

jest.mock('@/ai/flows/resolve-comparison-product', () => ({
  resolveComparisonProduct: (...args: unknown[]) =>
    mockResolveComparisonProduct(...args),
}));

jest.mock('@/lib/product-evidence-orchestrator', () => ({
  collectProductEvidence: (...args: unknown[]) =>
    mockCollectProductEvidence(...args),
}));

jest.mock(
  '@/lib/product-evidence-providers/production-product-evidence',
  () => ({
    createProductionProductEvidenceProviders: (...args: unknown[]) =>
      mockCreateProviders(...args),
  })
);

import {
  buildProductComparisonEvidence,
} from '@/ai/flows/build-product-comparison-evidence';

function productionSession(
  overrides: Record<string, unknown> = {}
) {
  return {
    sessionId: 'session-1',
    retailerId: 'retailer-1',
    campaignId: 'campaign-1',
    activationId: 'activation-1',
    deploymentId: 'deployment-1',
    qrCodeId: 'qr-a',
    configurationVersion: 1,
    environment: 'PRODUCTION',
    startedAt: {
      seconds: 1,
      nanoseconds: 0,
    },
    lastInteractionAt: {
      seconds: 2,
      nanoseconds: 0,
    },
    entryGtin: '00012345678912',
    ...overrides,
  };
}

function evidence(gtin: string) {
  return {
    evidence: {
      identity: { gtin },
      facts: [],
      evidenceState: 'INSUFFICIENT' as const,
      limitations: [
        'No verified or supported product facts are currently available.',
      ],
    },
    sourceResults: [],
  };
}

describe('buildProductComparisonEvidence', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCreateProviders.mockReturnValue([]);

    mockResolveComparisonProduct.mockResolvedValue({
      success: true,
      product: {
        gtin: '00012345678913',
        productId: 'product-b',
        productName: 'Product B',
      },
    });

    mockSessionGet.mockResolvedValue({
      exists: true,
      data: () => productionSession(),
    });

    mockCollectProductEvidence
      .mockResolvedValueOnce(
        evidence('00012345678912')
      )
      .mockResolvedValueOnce({
        evidence: {
          ...evidence('00012345678913').evidence,
          identity: {
            gtin: '00012345678913',
            productId: 'product-b',
            productName: 'Product B',
          },
        },
        sourceResults: [],
      });
  });

  it('builds canonical A/B comparison evidence from authoritative identities', async () => {
    const result =
      await buildProductComparisonEvidence({
        scannedValue:
          'https://example.test/resolve/qr-b',
        sessionId: 'session-1',
      });

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Expected comparison evidence');
    }

    expect(result.evidence.productA.identity.gtin).toBe(
      '00012345678912'
    );

    expect(result.evidence.productB.identity).toEqual({
      gtin: '00012345678913',
      productId: 'product-b',
      productName: 'Product B',
    });

    expect(mockCollectProductEvidence).toHaveBeenCalledTimes(2);

    expect(mockCollectProductEvidence).toHaveBeenNthCalledWith(
      1,
      {
        gtin: '00012345678912',
      },
      {
        retailerId: 'retailer-1',
      },
      expect.any(Array)
    );

    expect(mockCollectProductEvidence).toHaveBeenNthCalledWith(
      2,
      {
        gtin: '00012345678913',
        productId: 'product-b',
        productName: 'Product B',
      },
      {
        retailerId: 'retailer-1',
      },
      expect.any(Array)
    );
  });

  it('fails closed when Product A has no unambiguous session GTIN', async () => {
    mockSessionGet.mockResolvedValue({
      exists: true,
      data: () =>
        productionSession({
          entryGtin: undefined,
        }),
    });

    const result =
      await buildProductComparisonEvidence({
        scannedValue: 'scanned-qr-b',
        sessionId: 'session-1',
      });

    expect(result).toEqual({
      success: false,
      code: 'PRIMARY_PRODUCT_UNAVAILABLE',
      message:
        'Comparison is unavailable because the current product could not be identified unambiguously.',
    });

    expect(mockCollectProductEvidence).not.toHaveBeenCalled();
  });

  it('fails closed when the shopper session is invalid', async () => {
    mockSessionGet.mockResolvedValue({
      exists: true,
      data: () =>
        productionSession({
          sessionId: 'different-session',
        }),
    });

    const result =
      await buildProductComparisonEvidence({
        scannedValue: 'scanned-qr-b',
        sessionId: 'session-1',
      });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error('Expected session rejection');
    }

    expect(result.code).toBe(
      'SESSION_INTEGRITY_ERROR'
    );

    expect(mockCollectProductEvidence).not.toHaveBeenCalled();
  });

  it('rejects Product B when it equals authoritative Product A', async () => {
    mockResolveComparisonProduct.mockResolvedValue({
      success: true,
      product: {
        gtin: '00012345678912',
      },
    });

    const result =
      await buildProductComparisonEvidence({
        scannedValue: 'scanned-qr-b',
        sessionId: 'session-1',
      });

    expect(result).toEqual({
      success: false,
      code: 'SAME_PRODUCT',
      message:
        'Scan a different product to compare it with this one.',
    });

    expect(mockCollectProductEvidence).not.toHaveBeenCalled();
  });
});
