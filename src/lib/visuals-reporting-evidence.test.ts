import {
  projectReportingEvidence,
} from './visuals-reporting-evidence';

import type {
  ReportingEvidenceWindow,
} from './reporting-evidence-server';

function evidence(
  overrides: Partial<ReportingEvidenceWindow> = {},
): ReportingEvidenceWindow {
  return {
    retailerId: 'retailer-1',
    authorizedDeploymentStoreIds: new Map([
      ['deployment-1', 'store-1'],
    ]),
    exposures: [],
    sessions: [],
    events: [],
    transactions: [],
    sourcesComplete: {
      exposures: true,
      sessions: true,
      events: true,
      transactions: true,
    },
    ...overrides,
  };
}

describe('Visuals reporting evidence projection', () => {
  it('counts only evidence belonging to authorised deployments', () => {
    const result = projectReportingEvidence(
      evidence({
        exposures: [
          {
            id: 'exposure-1',
            data: {
              deploymentId: 'deployment-1',
              timestamp: '2026-09-10T10:00:00.000Z',
            },
          },
          {
            id: 'exposure-hostile',
            data: {
              deploymentId: 'deployment-hostile',
              timestamp: '2026-09-10T11:00:00.000Z',
            },
          },
        ],
        sessions: [
          {
            id: 'session-1',
            data: {
              deploymentId: 'deployment-1',
              sessionId: 'session-1',
              startedAt: '2026-09-10T10:05:00.000Z',
            },
          },
          {
            id: 'session-hostile',
            data: {
              deploymentId: 'deployment-hostile',
              sessionId: 'session-hostile',
              startedAt: '2026-09-10T11:05:00.000Z',
            },
          },
        ],
      }),
    );

    expect(result.counts.qrExposures).toBe(1);
    expect(
      result.counts.qualifyingShopperSessions,
    ).toBe(1);
  });

  it('deduplicates exposure and session identities', () => {
    const result = projectReportingEvidence(
      evidence({
        exposures: [
          {
            id: 'document-1',
            data: {
              deploymentId: 'deployment-1',
              exposureId: 'exposure-1',
            },
          },
          {
            id: 'document-2',
            data: {
              deploymentId: 'deployment-1',
              exposureId: 'exposure-1',
            },
          },
        ],
        sessions: [
          {
            id: 'document-3',
            data: {
              deploymentId: 'deployment-1',
              sessionId: 'session-1',
            },
          },
          {
            id: 'document-4',
            data: {
              deploymentId: 'deployment-1',
              sessionId: 'session-1',
            },
          },
        ],
      }),
    );

    expect(result.counts.qrExposures).toBe(1);
    expect(
      result.counts.qualifyingShopperSessions,
    ).toBe(1);
  });

  it('derives Ari and decision-signal counts from authorised events only', () => {
    const result = projectReportingEvidence(
      evidence({
        events: [
          {
            id: 'event-1',
            data: {
              deploymentId: 'deployment-1',
              eventType: 'ari_question',
            },
          },
          {
            id: 'event-2',
            data: {
              deploymentId: 'deployment-1',
              eventType: 'product_compare',
            },
          },
          {
            id: 'event-3',
            data: {
              deploymentId: 'deployment-hostile',
              eventType: 'ari_question',
            },
          },
        ],
      }),
    );

    expect(result.counts.ariInteractions).toBe(1);
    expect(result.counts.decisionSignals).toBe(1);
  });

  it('reports the latest timestamp from bounded evidence', () => {
    const result = projectReportingEvidence(
      evidence({
        exposures: [
          {
            id: 'exposure-1',
            data: {
              deploymentId: 'deployment-1',
              timestamp: '2026-09-10T10:00:00.000Z',
            },
          },
        ],
        events: [
          {
            id: 'event-1',
            data: {
              deploymentId: 'deployment-1',
              eventType: 'ari_question',
              timestamp: '2026-09-10T12:00:00.000Z',
            },
          },
        ],
      }),
    );

    expect(result.latestEvidenceAt).toBe(
      '2026-09-10T12:00:00.000Z',
    );
  });

  it('does not manufacture activation rows without canonical identity evidence', () => {
    const result = projectReportingEvidence(
      evidence({
        exposures: [
          {
            id: 'exposure-1',
            data: {
              deploymentId: 'deployment-1',
              timestamp: '2026-09-10T10:00:00.000Z',
            },
          },
        ],
      }),
    );

    expect(result.activationPerformance).toEqual([]);
  });
});
