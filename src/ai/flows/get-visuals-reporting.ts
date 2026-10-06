'use server';

import { verifyAuth } from '@/lib/auth-server';

import {
  resolveOrganizationScope,
} from '@/lib/organization-scope-server';

import { resolveReportingCalendar } from '@/lib/reporting-calendar-server';
import { resolveReportingPeriod } from '@/lib/reporting-period-server';

import {
  acquireReportingEvidence,
} from '@/lib/reporting-evidence-server';

import {
  assertReportingScopeAuthorized,
  canonicalizeReportingScope,
} from '@/lib/visuals-reporting-authorization';

import {
  projectReportingEvidence,
} from '@/lib/visuals-reporting-evidence';

import {
  VisualsReportingRequestSchema,
  VisualsReportingResponseSchema,
  type VisualsReportingRequest,
  type VisualsReportingResponse,
  type VisualsReportingMetric,
} from '@/lib/schemas/visuals-reporting';

type GetVisualsReportingInput = {
  idToken?: string;
  request: VisualsReportingRequest;
};

function metric(
  value: number,
  unit: VisualsReportingMetric['unit'],
  evidenceCount: number,
): VisualsReportingMetric {
  return {
    status: value === 0 ? 'NO_ACTIVITY' : 'MEASURED',
    value,
    unit,
    evidenceLevel: 'E1',
    evidenceCount,
  };
}

function rateMetric(
  numerator: number,
  denominator: number,
): VisualsReportingMetric {
  if (denominator === 0) {
    return {
      status: 'NO_ACTIVITY',
      value: null,
      unit: 'PERCENT',
      evidenceLevel: 'E0',
      evidenceCount: 0,
      statusDetail:
        'Exposure-to-session rate is unavailable because there were no QR exposures in the selected reporting scope and period.',
    };
  }

  return {
    status: 'MEASURED',
    value: (numerator / denominator) * 100,
    unit: 'PERCENT',
    evidenceLevel: 'E1',
    evidenceCount: Math.min(numerator, denominator),
  };
}

function unavailableMetric(
  unit: VisualsReportingMetric['unit'],
  detail: string,
): VisualsReportingMetric {
  return {
    status: 'UNAVAILABLE',
    value: null,
    unit,
    evidenceLevel: 'E0',
    evidenceCount: 0,
    statusDetail: detail,
  };
}

function determineEvidenceStatus(
  sourcesComplete: {
    exposures: boolean;
    sessions: boolean;
    events: boolean;
    transactions: boolean;
  },
  totalEvidenceCount: number,
): 'AVAILABLE' | 'LIMITED_EVIDENCE' | 'NO_ACTIVITY' | 'UNAVAILABLE' {
  if (
    !sourcesComplete.exposures ||
    !sourcesComplete.sessions ||
    !sourcesComplete.events
  ) {
    return 'LIMITED_EVIDENCE';
  }

  return totalEvidenceCount === 0
    ? 'NO_ACTIVITY'
    : 'AVAILABLE';
}

/**
 * Canonical Visuals & Reporting server boundary.
 *
 * Security and evidence sequence:
 *
 * ID token
 * -> authoritative Firestore authorization profile
 * -> visualsReporting permission
 * -> structural scope containment
 * -> canonical organisation scope resolution
 * -> authoritative reporting calendar
 * -> exact [startAt, endAt) reporting period
 * -> canonical bounded evidence
 * -> deterministic reporting projection
 *
 * Gemini is deliberately absent from this boundary.
 */
export async function getVisualsReporting(
  input: GetVisualsReportingInput,
): Promise<VisualsReportingResponse> {
  const parsedRequest =
    VisualsReportingRequestSchema.parse(input.request);

  const auth = await verifyAuth(input.idToken);

  if ('error' in auth) {
    throw new Error(auth.error);
  }

  if (!auth.isActive) {
    throw new Error('ACCOUNT_INACTIVE');
  }

  if (!auth.retailerId) {
    throw new Error('RETAILER_AUTHORIZATION_REQUIRED');
  }

  if (auth.permissions.visualsReporting !== true) {
    throw new Error('VISUALS_REPORTING_PERMISSION_REQUIRED');
  }

  const canonicalScope = canonicalizeReportingScope(
    auth.scope,
    parsedRequest.scope,
  );

  assertReportingScopeAuthorized(
    auth.scope,
    canonicalScope,
  );

  const retailerId = auth.retailerId;

  const [
    resolvedScope,
    reportingCalendar,
  ] = await Promise.all([
    resolveOrganizationScope(
      retailerId,
      canonicalScope,
    ),
    resolveReportingCalendar(retailerId),
  ]);

  if (!reportingCalendar) {
    throw new Error('REPORTING_CALENDAR_UNAVAILABLE');
  }

  const calculatedAt = new Date();

  const reportingPeriod = resolveReportingPeriod(
    calculatedAt,
    parsedRequest.granularity,
    reportingCalendar,
  );

  const evidence = await acquireReportingEvidence({
    retailerId,
    authorizedStoreIds: new Set(
      resolvedScope.storeIds,
    ),
    startAt: reportingPeriod.startAt,
    endAt: reportingPeriod.endAt,
  });

  const projection = projectReportingEvidence(evidence);

  const totalEvidenceCount =
    projection.counts.qrExposures +
    projection.counts.qualifyingShopperSessions +
    projection.counts.ariInteractions +
    projection.counts.decisionSignals;

  const commerceUnavailable =
    'Commerce Evidence Unavailable — verified transaction reporting has not yet been projected into this reporting response.';

  const podUnavailable =
    'Verified Decision Journey evidence has not yet been projected for this exact reporting scope and period.';

  const response: VisualsReportingResponse = {
    retailerId,

    scope: canonicalScope,

    reportingPeriod: {
      granularity: reportingPeriod.granularity,
      startAt: reportingPeriod.startAt.toISOString(),
      endAt: reportingPeriod.endAt.toISOString(),
      timezone: reportingCalendar.timezone,
      financialYearStartMonth:
        reportingCalendar.financialYearStartMonth,
    },

    evidenceStatus: determineEvidenceStatus(
      evidence.sourcesComplete,
      totalEvidenceCount,
    ),

    networkPerformance: {
      qrExposures: metric(
        projection.counts.qrExposures,
        'COUNT',
        projection.counts.qrExposures,
      ),

      qualifyingShopperSessions: metric(
        projection.counts.qualifyingShopperSessions,
        'COUNT',
        projection.counts.qualifyingShopperSessions,
      ),

      exposureToSessionRatePercent: rateMetric(
        projection.counts.qualifyingShopperSessions,
        projection.counts.qrExposures,
      ),

      ariInteractions: metric(
        projection.counts.ariInteractions,
        'COUNT',
        projection.counts.ariInteractions,
      ),

      decisionSignals: metric(
        projection.counts.decisionSignals,
        'COUNT',
        projection.counts.decisionSignals,
      ),

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
      statusDetail: podUnavailable,
    },

    campaignActivationPerformance:
      projection.activationPerformance,

    commerceOutcomes: {
      verifiedPurchases: unavailableMetric(
        'COUNT',
        commerceUnavailable,
      ),
      associatedRevenue: unavailableMetric(
        'RAND',
        commerceUnavailable,
      ),
      conversionRatePercent: unavailableMetric(
        'PERCENT',
        commerceUnavailable,
      ),
      averageBasketValue: unavailableMetric(
        'RAND',
        commerceUnavailable,
      ),
    },

    latestEvidenceAt: projection.latestEvidenceAt,
    calculatedAt: calculatedAt.toISOString(),
  };

  return VisualsReportingResponseSchema.parse(response);
}
