jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
  },
}));

jest.mock('@/ai/flows/get-visuals-reporting', () => ({
  getVisualsReporting: jest.fn(),
}));

jest.mock(
  '@/lib/ai-governance/resolve-effective-ai-governance',
  () => ({
    resolveEffectiveAiGovernance: jest.fn(),
  }),
);

import { ai } from '@/ai/genkit';
import { getVisualsReporting } from '@/ai/flows/get-visuals-reporting';
import { resolveEffectiveAiGovernance } from '@/lib/ai-governance/resolve-effective-ai-governance';
import type {
  VisualsReportingMetric,
  VisualsReportingResponse,
} from '@/lib/schemas/visuals-reporting';
import { generateVisualsReportingBrief } from './generate-visuals-reporting-brief';

const mockGenerate = ai.generate as jest.Mock;
const mockGetVisualsReporting =
  getVisualsReporting as jest.Mock;
const mockGovernance =
  resolveEffectiveAiGovernance as jest.Mock;

function metric(
  value: number | null,
  status: VisualsReportingMetric['status'] = 'MEASURED',
  unit: VisualsReportingMetric['unit'] = 'COUNT',
): VisualsReportingMetric {
  return {
    status,
    value,
    unit,
    evidenceLevel: value === null ? 'E0' : 'E1',
    evidenceCount: value === null ? 0 : 1,
  };
}

function reportFixture(): VisualsReportingResponse {
  return {
    retailerId: 'retailer-1',
    scope: {
      level: 'brand',
      networkId: 'network-1',
      brandId: 'brand-1',
      displayName: 'Brand',
    },
    reportingPeriod: {
      granularity: 'MONTHLY',
      startAt: '2026-09-01T00:00:00.000Z',
      endAt: '2026-10-01T00:00:00.000Z',
      timezone: 'Africa/Johannesburg',
      financialYearStartMonth: 3,
    },
    evidenceStatus: 'AVAILABLE',
    networkPerformance: {
      qrExposures: metric(12),
      qualifyingShopperSessions: metric(7),
      exposureToSessionRatePercent: metric(
        58.3,
        'MEASURED',
        'PERCENT',
      ),
      ariInteractions: metric(5),
      decisionSignals: metric(3),
      qrExposureTrend: [],
      qualifyingSessionTrend: [],
      ariInteractionTrend: [],
      decisionSignalTrend: [],
    },
    organizationalPerformance: [],
    pointOfDecisionPerformance: {
      status: 'UNAVAILABLE',
      funnel: [],
      rejectionReasons: [],
      purchaseBarriers: [],
      alternativeProductMovement: [],
      statusDetail:
        'Verified Decision Journey evidence is unavailable.',
    },
    campaignActivationPerformance: [],
    commerceOutcomes: {
      verifiedPurchases: metric(
        null,
        'UNAVAILABLE',
      ),
      associatedRevenue: metric(
        null,
        'UNAVAILABLE',
        'RAND',
      ),
      conversionRatePercent: metric(
        null,
        'UNAVAILABLE',
        'PERCENT',
      ),
      averageBasketValue: metric(
        null,
        'UNAVAILABLE',
        'RAND',
      ),
    },
    latestEvidenceAt: '2026-09-20T10:00:00.000Z',
    calculatedAt: '2026-10-01T08:00:00.000Z',
  };
}

function validProposal() {
  return {
    executiveSummary:
      'Verified reporting evidence shows measurable Point-of-Decision activity.',
    factualObservations: [
      {
        statement: 'There were 12 verified QR exposures.',
        evidenceRefs: ['network:qrExposures'],
      },
    ],
    notablePatterns: [
      {
        statement:
          'Qualifying shopper sessions were lower than QR exposures.',
        evidenceRefs: [
          'network:qrExposures',
          'network:qualifyingShopperSessions',
        ],
      },
    ],
    reportingLimitations: [
      'Commerce outcomes are unavailable.',
    ],
  };
}

describe('generateVisualsReportingBrief', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the canonical Visuals Reporting boundary as its reporting authority', async () => {
    mockGetVisualsReporting.mockResolvedValue(
      reportFixture(),
    );

    mockGovernance.mockResolvedValue({
      providerModelIdentifier: 'test-model',
    });

    mockGenerate.mockResolvedValue({
      output: validProposal(),
    });

    const request = {
      scope: {
        level: 'network' as const,
        networkId: 'network-1',
        displayName: 'Network',
      },
      granularity: 'MONTHLY' as const,
    };

    const result = await generateVisualsReportingBrief({
      idToken: 'token-1',
      request,
    });

    expect(mockGetVisualsReporting).toHaveBeenCalledWith({
      idToken: 'token-1',
      request,
    });

    expect(mockGovernance).toHaveBeenCalledWith(
      'RETAIL_AGGREGATE_INTELLIGENCE',
      'retailer-1',
    );

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('AVAILABLE');
  });

  it('does not invoke governance or Gemini when no substantive verified evidence exists', async () => {
    const report = reportFixture();

    report.networkPerformance.qrExposures =
      metric(null, 'UNAVAILABLE');
    report.networkPerformance.qualifyingShopperSessions =
      metric(null, 'UNAVAILABLE');
    report.networkPerformance.exposureToSessionRatePercent =
      metric(null, 'UNAVAILABLE', 'PERCENT');
    report.networkPerformance.ariInteractions =
      metric(null, 'UNAVAILABLE');
    report.networkPerformance.decisionSignals =
      metric(null, 'UNAVAILABLE');

    mockGetVisualsReporting.mockResolvedValue(report);

    const result = await generateVisualsReportingBrief({
      idToken: 'token-1',
      request: {
        scope: {
          level: 'network',
          networkId: 'network-1',
          displayName: 'Network',
        },
        granularity: 'MONTHLY',
      },
    });

    expect(result.status).toBe(
      'INSUFFICIENT_EVIDENCE',
    );
    expect(mockGovernance).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('does not invoke Gemini when effective governance provides no authorized model', async () => {
    mockGetVisualsReporting.mockResolvedValue(
      reportFixture(),
    );

    mockGovernance.mockResolvedValue({
      providerModelIdentifier: undefined,
    });

    const result = await generateVisualsReportingBrief({
      idToken: 'token-1',
      request: {
        scope: {
          level: 'network',
          networkId: 'network-1',
          displayName: 'Network',
        },
        granularity: 'MONTHLY',
      },
    });

    expect(result.status).toBe('AI_UNAVAILABLE');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('rejects AI output that cites evidence outside the verified reporting boundary', async () => {
    mockGetVisualsReporting.mockResolvedValue(
      reportFixture(),
    );

    mockGovernance.mockResolvedValue({
      providerModelIdentifier: 'test-model',
    });

    mockGenerate.mockResolvedValue({
      output: {
        ...validProposal(),
        factualObservations: [
          {
            statement:
              'Invented revenue evidence was observed.',
            evidenceRefs: [
              'commerce:inventedRevenue',
            ],
          },
        ],
      },
    });

    const result = await generateVisualsReportingBrief({
      idToken: 'token-1',
      request: {
        scope: {
          level: 'network',
          networkId: 'network-1',
          displayName: 'Network',
        },
        granularity: 'MONTHLY',
      },
    });

    expect(result.status).toBe(
      'INSUFFICIENT_EVIDENCE',
    );

    expect(result.factualObservations).toEqual([]);
    expect(result.notablePatterns).toEqual([]);
  });

  it('passes reporting context separately from substantive evidence and does not make context admissible evidence', async () => {
    mockGetVisualsReporting.mockResolvedValue(
      reportFixture(),
    );

    mockGovernance.mockResolvedValue({
      providerModelIdentifier: 'test-model',
    });

    mockGenerate.mockResolvedValue({
      output: validProposal(),
    });

    await generateVisualsReportingBrief({
      idToken: 'token-1',
      request: {
        scope: {
          level: 'network',
          networkId: 'network-1',
          displayName: 'Network',
        },
        granularity: 'MONTHLY',
      },
    });

    const generateInput =
      mockGenerate.mock.calls[0][0];

    expect(generateInput.prompt).toContain(
      '"scope": "brand:network-1:brand-1"',
    );

    expect(generateInput.prompt).toContain(
      '"ref": "network:qrExposures"',
    );

    expect(generateInput.prompt).not.toContain(
      '"ref": "report:scope"',
    );

    expect(generateInput.prompt).not.toContain(
      '"ref": "report:period"',
    );
  });

  it('preserves mandatory deterministic limitations in an available AI brief', async () => {
    mockGetVisualsReporting.mockResolvedValue(
      reportFixture(),
    );

    mockGovernance.mockResolvedValue({
      providerModelIdentifier: 'test-model',
    });

    mockGenerate.mockResolvedValue({
      output: validProposal(),
    });

    const result = await generateVisualsReportingBrief({
      idToken: 'token-1',
      request: {
        scope: {
          level: 'network',
          networkId: 'network-1',
          displayName: 'Network',
        },
        granularity: 'MONTHLY',
      },
    });

    expect(result.status).toBe('AVAILABLE');

    expect(result.reportingLimitations).toEqual(
      expect.arrayContaining([
        'Commerce outcomes are unavailable.',
        'Missing, unavailable, insufficient or limited evidence must not be interpreted as zero.',
        'Observed associations do not by themselves establish causality.',
      ]),
    );
  });

  it('returns AI_UNAVAILABLE when governed AI generation fails while leaving reporting evidence authority independent', async () => {
    mockGetVisualsReporting.mockResolvedValue(
      reportFixture(),
    );

    mockGovernance.mockResolvedValue({
      providerModelIdentifier: 'test-model',
    });

    mockGenerate.mockRejectedValue(
      new Error('MODEL_FAILURE'),
    );

    const result = await generateVisualsReportingBrief({
      idToken: 'token-1',
      request: {
        scope: {
          level: 'network',
          networkId: 'network-1',
          displayName: 'Network',
        },
        granularity: 'MONTHLY',
      },
    });

    expect(result.status).toBe('AI_UNAVAILABLE');

    expect(result.executiveSummary).toContain(
      'Verified Reporting Evidence remains available',
    );

    expect(mockGetVisualsReporting).toHaveBeenCalledTimes(1);
  });

  it('propagates canonical reporting authorization failures instead of disguising them as AI unavailability', async () => {
    mockGetVisualsReporting.mockRejectedValue(
      new Error('VISUALS_REPORTING_PERMISSION_REQUIRED'),
    );

    await expect(
      generateVisualsReportingBrief({
        idToken: 'token-1',
        request: {
          scope: {
            level: 'network',
            networkId: 'network-1',
            displayName: 'Network',
          },
          granularity: 'MONTHLY',
        },
      }),
    ).rejects.toThrow(
      'VISUALS_REPORTING_PERMISSION_REQUIRED',
    );

    expect(mockGovernance).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
