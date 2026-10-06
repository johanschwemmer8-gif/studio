jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
  },
}));

jest.mock('@/ai/flows/get-overview-intelligence', () => ({
  getOverviewIntelligence: jest.fn(),
}));

jest.mock('@/ai/flows/get-scan-statistics', () => ({
  getScanStatistics: jest.fn(),
}));

jest.mock('@/ai/flows/decision-journey-intelligence', () => ({
  getDecisionJourneyIntelligence: jest.fn(),
}));

jest.mock(
  '@/lib/ai-governance/resolve-effective-ai-governance',
  () => ({
    resolveEffectiveAiGovernance: jest.fn(),
  }),
);

import { ai } from '@/ai/genkit';
import { getOverviewIntelligence } from '@/ai/flows/get-overview-intelligence';
import { getScanStatistics } from '@/ai/flows/get-scan-statistics';
import { getDecisionJourneyIntelligence } from '@/ai/flows/decision-journey-intelligence';
import { resolveEffectiveAiGovernance } from '@/lib/ai-governance/resolve-effective-ai-governance';
import { generateDecisionIntelligenceBrief } from './generate-decision-intelligence-brief';

const mockGenerate = ai.generate as jest.Mock;
const mockOverview = getOverviewIntelligence as jest.Mock;
const mockScans = getScanStatistics as jest.Mock;
const mockJourney = getDecisionJourneyIntelligence as jest.Mock;
const mockGovernance =
  resolveEffectiveAiGovernance as jest.Mock;

function measuredMetric(
  metricId: string,
  value: number,
  unit: 'COUNT' | 'PERCENT' | 'RAND' = 'COUNT',
) {
  return {
    metricId,
    status: 'MEASURED',
    value,
    unit,
    evidenceLevel: 'DIRECT',
    evidenceCount: value,
  };
}

function overview(retailerId = 'retailer-1') {
  return {
    retailerId,
    scope: {},
    commercialOutcomes: {},
    pointOfDecisionActivity: {
      qrExposures: measuredMetric('qrExposures', 20),
      qualifyingShopperSessions:
        measuredMetric('qualifyingShopperSessions', 10),
      ariInteractions: measuredMetric('ariInteractions', 8),
      decisionSignals: measuredMetric('decisionSignals', 6),
    },
    activityIntelligence: {
      informationRequests:
        measuredMetric('informationRequests', 5),
      productComparisons:
        measuredMetric('productComparisons', 4),
      purchaseBarriersConcerns:
        measuredMetric('purchaseBarriersConcerns', 2),
      productConsideration:
        measuredMetric('productConsideration', 7),
    },
    trends: {},
    groundedSummary: {},
    freshness: {
      calculatedAt: '2026-10-06T09:00:00.000Z',
      latestEvidenceAt: '2026-10-06T08:59:00.000Z',
    },
  };
}

function scans(retailerId = 'retailer-1') {
  return {
    retailerId,
    scope: {},
    evidenceWindow: {
      startAt: '2026-09-06T09:00:00.000Z',
      endAt: '2026-10-06T09:00:00.000Z',
    },
    qrExposures: measuredMetric('qrExposures', 20),
    qualifyingShopperSessions:
      measuredMetric('qualifyingShopperSessions', 10),
    exposureToSessionRatePercent:
      measuredMetric(
        'exposureToSessionRatePercent',
        50,
        'PERCENT',
      ),
    activationPerformance: [
      {
        activationId: 'activation-1',
        qrCodeId: 'qr-1',
        campaignId: 'campaign-1',
        deploymentId: 'deployment-1',
        storeId: 'store-1',
        storeName: 'Test Store',
        qrExposures: 20,
        qualifyingShopperSessions: 10,
        exposureToSessionRatePercent: 50,
        latestExposureAt: '2026-10-06T08:59:00.000Z',
      },
    ],
    latestEvidenceAt: '2026-10-06T08:59:00.000Z',
    calculatedAt: '2026-10-06T09:00:00.000Z',
  };
}

function journey(retailerId = 'retailer-1') {
  return {
    retailerId,
    timeWindow: {
      start: '2026-09-06T09:00:00.000Z',
      end: '2026-10-06T09:00:00.000Z',
    },
    summary: 'Verified journey evidence.',
    funnel: [
      {
        stage: 'EXPOSURE',
        uniqueSessions: 10,
        numerator: 10,
        denominator: 20,
        rate: 50,
        denominatorName: 'QR exposures',
      },
    ],
    rejectionBreakdown: [
      {
        reason: 'PRICE',
        count: 2,
        share: 100,
      },
    ],
    barrierBreakdown: [
      {
        barrier: 'PRICE',
        count: 2,
        share: 20,
      },
    ],
    altProductBreakdown: [
      {
        gtin: '06001234567890',
        uniqueSessions: 2,
        rate: 20,
        purchaseCount: 1,
      },
    ],
    stats: {
      totalUniqueSessions: 10,
      alternativeProductMovements: 2,
      recommendationToPurchaseCount: 1,
      leakagePoints: {},
      rejectionsWithReason: 2,
      rejectionsWithoutReason: 0,
    },
    metadata: {
      aggregationVersion: '1.4.0',
      dataStatus: 'VERIFIED',
      evidenceStrength: 'HIGHER',
      methodology: 'Verified evidence.',
    },
  };
}

function validProposal() {
  return {
    executiveSummary:
      'Authoritative evidence shows measurable shopper activity.',
    factualObservations: [
      {
        statement: 'Twenty QR exposures were measured.',
        evidenceRefs: ['overview:qrExposures'],
      },
    ],
    identifiedIndicators: [
      {
        statement:
          'Product comparison activity indicates active consideration.',
        evidenceRefs: ['overview:productComparisons'],
      },
    ],
    suggestedActions: [
      {
        statement:
          'Review comparison journeys for decision friction.',
        evidenceRefs: ['overview:productComparisons'],
      },
    ],
    hypothesesToInvestigate: [
      {
        hypothesis:
          'Comparison activity may relate to unresolved choice.',
        evidenceRefs: ['overview:productComparisons'],
        investigation:
          'Compare subsequent rejection and basket evidence.',
      },
    ],
    evidenceLimitations: [
      'Observed association does not establish causality.',
    ],
  };
}

describe('generateDecisionIntelligenceBrief', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockOverview.mockResolvedValue(overview());
    mockScans.mockResolvedValue(scans());
    mockJourney.mockResolvedValue(journey());

    mockGovernance.mockResolvedValue({
      providerModelIdentifier: 'governed/test-model',
    });

    mockGenerate.mockResolvedValue({
      output: validProposal(),
    });
  });

  it('uses the server-resolved Overview retailer for Decision Journey authority', async () => {
    await generateDecisionIntelligenceBrief('token-1');

    expect(mockJourney).toHaveBeenCalledWith(
      'token-1',
      'retailer-1',
      30,
      undefined,
    );
  });

  it('resolves aggregate governance for the authoritative retailer and uses its model', async () => {
    const result =
      await generateDecisionIntelligenceBrief('token-1');

    expect(mockGovernance).toHaveBeenCalledWith(
      'RETAIL_AGGREGATE_INTELLIGENCE',
      'retailer-1',
    );

    expect(mockGenerate).toHaveBeenCalledTimes(1);

    expect(mockGenerate.mock.calls[0][0].model).toBe(
      'governed/test-model',
    );

    expect(result.status).toBe('AVAILABLE');
  });

  it('fails closed before Gemini when intelligence sources resolve to different retailers', async () => {
    mockScans.mockResolvedValue(scans('retailer-2'));

    const result =
      await generateDecisionIntelligenceBrief('token-1');

    expect(result.status).toBe('AI_UNAVAILABLE');
    expect(mockGovernance).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('rejects Gemini output that cites evidence outside the admitted evidence package', async () => {
    mockGenerate.mockResolvedValue({
      output: {
        ...validProposal(),
        suggestedActions: [
          {
            statement:
              'Increase stock because inventory is low.',
            evidenceRefs: [
              'inventory:invented-stock-level',
            ],
          },
        ],
      },
    });

    const result =
      await generateDecisionIntelligenceBrief('token-1');

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.suggestedActions).toEqual([]);
    expect(result.evidenceLimitations).toContain(
      'The AI interpretation referenced evidence outside the authoritative evidence boundary.',
    );
  });
});
