'use server';

/**
 * Authoritative Profit & ROI financial-analysis server boundary.
 *
 * Invariants:
 * - Authentication, tenant authority and ROI permission are resolved once.
 * - Historical evidence is acquired over one bounded analysis window.
 * - Every trend point is independently assembled through the canonical
 *   Profit & ROI evidence kernel.
 * - Every breakdown row is independently assembled for its authorized
 *   organizational child scope.
 * - Missing, incomplete or unavailable evidence is never converted to zero.
 * - Child rows are never aggregated to manufacture a parent result.
 */

import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import {
  listOrganizationScopeChildren,
  resolveOrganizationScope,
} from '@/lib/organization-scope-server';
import { resolveReportingCalendar } from '@/lib/reporting-calendar-server';
import { resolveReportingPeriod } from '@/lib/reporting-period-server';
import { canAccessScope } from '@/lib/authorization';

import { DeploymentSchema } from '@/lib/schemas/deployment';

import type {
  OverviewPeriodGranularity,
  OverviewScope,
} from '@/lib/schemas/overview-intelligence';

import type {
  ProfitRoiReportingPeriod,
  ProfitRoiSnapshot,
} from '@/lib/schemas/profit-roi';

import type { ProfitRoiAnalysis } from '@/lib/schemas/profit-roi-analysis';

import {
  assembleProfitRoiEvidence,
  type RawEvidenceDocument,
} from '@/lib/profit-roi-evidence';

import {
  assembleProfitRoiBreakdown,
  assembleProfitRoiTrend,
} from '@/lib/profit-roi-analysis';

const MAX_SOURCE_RECORDS = 5000;
const COMPLETENESS_PROBE_LIMIT = MAX_SOURCE_RECORDS + 1;

const TREND_PERIOD_COUNTS: Record<
  OverviewPeriodGranularity,
  number
> = {
  DAILY: 30,
  WEEKLY: 12,
  MONTHLY: 12,
  YTD: 1,
};

type SourceCompleteness = {
  exposures: boolean;
  sessions: boolean;
  events: boolean;
  transactions: boolean;
};

type AcquiredEvidence = {
  exposures: RawEvidenceDocument[];
  sessions: RawEvidenceDocument[];
  events: RawEvidenceDocument[];
  transactions: RawEvidenceDocument[];
  sourcesComplete: SourceCompleteness;
};

function toOverviewScope(scope: {
  level: 'network' | 'brand' | 'division' | 'region' | 'area' | 'store';
  networkId?: string;
  brandId?: string;
  divisionId?: string;
  regionId?: string;
  areaId?: string;
  storeId?: string;
  displayName?: string;
}): OverviewScope {
  return {
    level: scope.level,
    ...(scope.networkId ? { networkId: scope.networkId } : {}),
    ...(scope.brandId ? { brandId: scope.brandId } : {}),
    ...(scope.divisionId ? { divisionId: scope.divisionId } : {}),
    ...(scope.regionId ? { regionId: scope.regionId } : {}),
    ...(scope.areaId ? { areaId: scope.areaId } : {}),
    ...(scope.storeId ? { storeId: scope.storeId } : {}),
    ...(scope.displayName ? { displayName: scope.displayName } : {}),
  };
}

function buildTrendPeriods(
  calculatedAt: Date,
  granularity: OverviewPeriodGranularity,
  reportingCalendar: Parameters<typeof resolveReportingPeriod>[2]
): ProfitRoiReportingPeriod[] {
  const count = TREND_PERIOD_COUNTS[granularity];

  const toProfitRoiPeriod = (
    period: ReturnType<typeof resolveReportingPeriod>
  ): ProfitRoiReportingPeriod => ({
    granularity: period.granularity,
    startAt: period.startAt.toISOString(),
    endAt: period.endAt.toISOString(),
    timezone: reportingCalendar.timezone,
    financialYearStartMonth:
      reportingCalendar.financialYearStartMonth,
  });

  const current = resolveReportingPeriod(
    calculatedAt,
    granularity,
    reportingCalendar
  );

  if (granularity === 'YTD') {
    return [toProfitRoiPeriod(current)];
  }

  const periods: ProfitRoiReportingPeriod[] = [
    toProfitRoiPeriod(current),
  ];

  let cursor = current;

  while (periods.length < count) {
    const previousReference = new Date(
      cursor.startAt.getTime() - 1
    );

    const previous = resolveReportingPeriod(
      previousReference,
      granularity,
      reportingCalendar
    );

    if (
      previous.startAt.getTime() >= cursor.startAt.getTime() ||
      previous.endAt.getTime() > cursor.startAt.getTime()
    ) {
      throw new Error('REPORTING_PERIOD_SEQUENCE_INVALID');
    }

    periods.unshift(toProfitRoiPeriod(previous));
    cursor = previous;
  }

  return periods;
}

function timestampMillis(value: unknown): number | null {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (
      value as { toDate: () => Date }
    ).toDate();

    return date.getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function documentsForPeriod(
  documents: RawEvidenceDocument[],
  field: 'timestamp' | 'startedAt',
  period: ProfitRoiReportingPeriod
): RawEvidenceDocument[] {
  const start = Date.parse(period.startAt);
  const end = Date.parse(period.endAt);

  return documents.filter(document => {
    const value = timestampMillis(document.data[field]);

    return (
      value !== null &&
      value >= start &&
      value < end
    );
  });
}

function scopeDeploymentMap(
  allDeploymentStoreIds: Map<string, string>,
  authorizedStoreIds: Set<string>
): Map<string, string> {
  return new Map(
    [...allDeploymentStoreIds.entries()].filter(
      ([, storeId]) => authorizedStoreIds.has(storeId)
    )
  );
}

async function acquireEvidenceWindow(
  retailerId: string,
  startAt: string,
  endAt: string
): Promise<AcquiredEvidence> {
  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.getTime() >= end.getTime()
  ) {
    throw new Error('INVALID_EVIDENCE_WINDOW');
  }

  const [
    exposureSnapshot,
    sessionSnapshot,
    eventSnapshot,
    transactionSnapshot,
  ] = await Promise.all([
    db
      .collection('qrExposures')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', start)
      .where('timestamp', '<', end)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('sessions')
      .where('retailerId', '==', retailerId)
      .where('startedAt', '>=', start)
      .where('startedAt', '<', end)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('events')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', start)
      .where('timestamp', '<', end)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('transactions')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', start)
      .where('timestamp', '<', end)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),
  ]);

  const sourcesComplete: SourceCompleteness = {
    exposures:
      exposureSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    sessions:
      sessionSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    events:
      eventSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    transactions:
      transactionSnapshot.docs.length <= MAX_SOURCE_RECORDS,
  };

  const convert = (
    snapshot: {
      docs: Array<{
        id: string;
        data: () => Record<string, unknown>;
      }>;
    },
    complete: boolean
  ): RawEvidenceDocument[] =>
    complete
      ? snapshot.docs.map(document => ({
          id: document.id,
          data: document.data(),
        }))
      : [];

  return {
    exposures: convert(
      exposureSnapshot,
      sourcesComplete.exposures
    ),
    sessions: convert(
      sessionSnapshot,
      sourcesComplete.sessions
    ),
    events: convert(
      eventSnapshot,
      sourcesComplete.events
    ),
    transactions: convert(
      transactionSnapshot,
      sourcesComplete.transactions
    ),
    sourcesComplete,
  };
}

function assembleSnapshot(
  retailerId: string,
  scope: OverviewScope,
  period: ProfitRoiReportingPeriod,
  authorizedDeploymentStoreIds: Map<string, string>,
  evidence: AcquiredEvidence,
  calculatedAt: Date
): ProfitRoiSnapshot {
  return assembleProfitRoiEvidence({
    retailerId,
    scope,
    reportingPeriod: {
      granularity: period.granularity,
      startAt: new Date(period.startAt),
      endAt: new Date(period.endAt),
      timezone: period.timezone,
      financialYearStartMonth:
        period.financialYearStartMonth,
    },
    authorizedDeploymentStoreIds,
    exposures: documentsForPeriod(
      evidence.exposures,
      'timestamp',
      period
    ),
    sessions: documentsForPeriod(
      evidence.sessions,
      'startedAt',
      period
    ),
    events: documentsForPeriod(
      evidence.events,
      'timestamp',
      period
    ),
    transactions: documentsForPeriod(
      evidence.transactions,
      'timestamp',
      period
    ),
    sourcesComplete: evidence.sourcesComplete,
    calculatedAt,
  });
}

export async function getProfitRoiAnalysis(
  idToken: string | undefined,
  granularity: OverviewPeriodGranularity = 'MONTHLY'
): Promise<ProfitRoiAnalysis> {
  const auth = await verifyAuth(idToken);

  if ('error' in auth) {
    throw new Error(auth.error);
  }

  if (!auth.retailerId) {
    throw new Error('RETAILER_AUTHORIZATION_REQUIRED');
  }

  if (!auth.permissions.roi) {
    throw new Error('ROI_ACCESS_DENIED');
  }

  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const retailerId = auth.retailerId;

  const [resolvedScope, reportingCalendar] = await Promise.all([
    resolveOrganizationScope(retailerId, auth.scope),
    resolveReportingCalendar(retailerId),
  ]);

  if (!reportingCalendar) {
    throw new Error('REPORTING_CALENDAR_UNAVAILABLE');
  }

  const calculatedAt = new Date();

  const periods = buildTrendPeriods(
    calculatedAt,
    granularity,
    reportingCalendar
  );

  if (periods.length === 0) {
    throw new Error('REPORTING_PERIOD_UNAVAILABLE');
  }

  const currentPeriod = periods[periods.length - 1];

  const deploymentSnapshot = await db
    .collection('deployments')
    .where('retailerId', '==', retailerId)
    .get();

  const allDeploymentStoreIds = new Map<string, string>();

  for (const document of deploymentSnapshot.docs) {
    const deployment = DeploymentSchema.parse(document.data());

    if (deployment.retailerId !== retailerId) {
      throw new Error('DEPLOYMENT_TENANT_MISMATCH');
    }

    allDeploymentStoreIds.set(
      deployment.deploymentId,
      deployment.storeId
    );
  }

  const parentStoreIds = new Set(resolvedScope.storeIds);

  const parentDeploymentStoreIds = scopeDeploymentMap(
    allDeploymentStoreIds,
    parentStoreIds
  );

  const evidence = await acquireEvidenceWindow(
    retailerId,
    periods[0].startAt,
    currentPeriod.endAt
  );

  const trendSnapshots = periods.map(period =>
    assembleSnapshot(
      retailerId,
      toOverviewScope(resolvedScope.scope),
      period,
      parentDeploymentStoreIds,
      evidence,
      calculatedAt
    )
  );

  const children = await listOrganizationScopeChildren(
    retailerId,
    auth.scope
  );

  const breakdownSnapshots = [];

  for (const child of children) {
    if (!canAccessScope(auth, child.scope)) {
      throw new Error('ROI_SCOPE_ACCESS_DENIED');
    }

    const resolvedChild = await resolveOrganizationScope(
      retailerId,
      child.scope
    );

    const childDeploymentStoreIds = scopeDeploymentMap(
      allDeploymentStoreIds,
      new Set(resolvedChild.storeIds)
    );

    breakdownSnapshots.push({
      scope: toOverviewScope(resolvedChild.scope),
      displayName: child.displayName,
      snapshot: assembleSnapshot(
        retailerId,
        toOverviewScope(resolvedChild.scope),
        currentPeriod,
        childDeploymentStoreIds,
        evidence,
        calculatedAt
      ),
    });
  }

  const scope = toOverviewScope(resolvedScope.scope);

  return {
    scope,
    reportingPeriod: currentPeriod,
    calculatedAt: calculatedAt.toISOString(),
    trend: assembleProfitRoiTrend(
      granularity,
      trendSnapshots
    ),
    breakdown: assembleProfitRoiBreakdown(
      scope,
      currentPeriod,
      breakdownSnapshots
    ),
  };
}
