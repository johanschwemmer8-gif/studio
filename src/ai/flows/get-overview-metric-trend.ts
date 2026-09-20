'use server';

/**
 * Canonical Retailer Overview metric trend service.
 *
 * Trend aggregation is deliberately separate from the Overview snapshot
 * workload. Historical evidence requirements must never broaden or invalidate
 * an otherwise valid current Overview snapshot.
 *
 * LIVE DATA ONLY:
 * No simulated, synthetic, demo, random or fallback metric values.
 */

import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import { resolveOrganizationScope } from '@/lib/organization-scope-server';
import { resolveReportingCalendar } from '@/lib/reporting-calendar-server';
import { resolveReportingPeriod } from '@/lib/reporting-period-server';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import {
  ShopperSessionSchema,
  type ShopperSession,
} from '@/lib/schemas/shopper-session';
import {
  OverviewMetricTrendRequestSchema,
  OverviewMetricTrendSchema,
  type OverviewMetricTrend,
  type OverviewMetricTrendRequest,
  type OverviewTrendPoint,
} from '@/lib/schemas/overview-intelligence';

const OVERVIEW_MAX_SOURCE_RECORDS = 5000;
const OVERVIEW_COMPLETENESS_PROBE_LIMIT =
  OVERVIEW_MAX_SOURCE_RECORDS + 1;

const TREND_PERIOD_COUNTS = {
  DAILY: 30,
  WEEKLY: 12,
  MONTHLY: 12,
  YTD: 1,
} as const;

type TimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

type EvidenceEvent = {
  sessionId?: string;
  eventType?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

type TrendPeriod = {
  startAt: Date;
  endAt: Date;
};

function timestampMillis(value: unknown): number {
  if (!value || typeof value !== 'object') {
    return 0;
  }

  const timestamp = value as TimestampLike;

  if (typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();

    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  if (
    typeof timestamp.seconds === 'number' &&
    Number.isFinite(timestamp.seconds) &&
    typeof timestamp.nanoseconds === 'number' &&
    Number.isFinite(timestamp.nanoseconds)
  ) {
    return (
      timestamp.seconds * 1000 +
      Math.floor(timestamp.nanoseconds / 1_000_000)
    );
  }

  return 0;
}

function authorizationFailed(
  result: Awaited<ReturnType<typeof verifyAuth>>
): result is { uid: ''; error: string } {
  return result.uid === '';
}

function measuredPoint(
  period: TrendPeriod,
  value: number,
  evidenceCount: number = value
): OverviewTrendPoint {
  return {
    periodStart: period.startAt.toISOString(),
    periodEnd: period.endAt.toISOString(),
    status: value === 0 ? 'NO_ACTIVITY' : 'MEASURED',
    value,
    evidenceCount,
  };
}

function incompletePoint(period: TrendPeriod): OverviewTrendPoint {
  return {
    periodStart: period.startAt.toISOString(),
    periodEnd: period.endAt.toISOString(),
    status: 'INSUFFICIENT_EVIDENCE',
    value: null,
    evidenceCount: 0,
    reason: 'INCOMPLETE_COVERAGE',
  };
}

function unavailablePoint(period: TrendPeriod): OverviewTrendPoint {
  return {
    periodStart: period.startAt.toISOString(),
    periodEnd: period.endAt.toISOString(),
    status: 'UNAVAILABLE',
    value: null,
    evidenceCount: 0,
    reason: 'SOURCE_UNAVAILABLE',
  };
}

function commercialUnavailablePoint(
  period: TrendPeriod,
  metricId: OverviewMetricTrendRequest['metricId']
): OverviewTrendPoint {
  const evidenceLevel =
    metricId === 'conversion_rate_percent'
      ? 'E2'
      : metricId === 'sales_uplift_percent'
        ? 'E4'
        : 'E3';

  void evidenceLevel;

  return {
    periodStart: period.startAt.toISOString(),
    periodEnd: period.endAt.toISOString(),
    status: 'REQUIRES_POS_DATA',
    value: null,
    evidenceCount: 0,
    reason: 'POS_DATA_MISSING',
  };
}

/**
 * Resolve the bounded reporting periods requested by the Overview UI.
 *
 * DAILY   = 30 retailer-local reporting days
 * WEEKLY  = 12 retailer-local reporting weeks
 * MONTHLY = 12 retailer-local reporting months
 * YTD     = one financial-YTD period capped at now
 *
 * Current partial DAILY/WEEKLY/MONTHLY periods end at now. Historical
 * periods retain their actual exclusive reporting boundary.
 */
function resolveTrendPeriods(
  now: Date,
  request: OverviewMetricTrendRequest,
  calendar: NonNullable<
    Awaited<ReturnType<typeof resolveReportingCalendar>>
  >
): TrendPeriod[] {
  const containingPeriod = resolveReportingPeriod(
    now,
    request.granularity,
    calendar
  );

  if (request.granularity === 'YTD') {
    return [
      {
        startAt: containingPeriod.startAt,
        endAt: now,
      },
    ];
  }

  const periodCount = TREND_PERIOD_COUNTS[request.granularity];
  const reversed: TrendPeriod[] = [];

  let cursor = containingPeriod;

  for (let index = 0; index < periodCount; index += 1) {
    const isCurrent = index === 0;

    reversed.push({
      startAt: cursor.startAt,
      endAt: isCurrent ? now : cursor.endAt,
    });

    if (index < periodCount - 1) {
      cursor = resolveReportingPeriod(
        new Date(cursor.startAt.getTime() - 1),
        request.granularity,
        calendar
      );
    }
  }

  return reversed.reverse();
}

function belongsToPeriod(timestamp: number, period: TrendPeriod): boolean {
  return (
    timestamp >= period.startAt.getTime() &&
    timestamp < period.endAt.getTime()
  );
}

export async function getOverviewMetricTrend(
  idToken: string | undefined,
  input: OverviewMetricTrendRequest
): Promise<OverviewMetricTrend> {
  const request = OverviewMetricTrendRequestSchema.parse(input);
  const auth = await verifyAuth(idToken);

  if (authorizationFailed(auth)) {
    throw new Error(auth.error);
  }

  if (!auth.retailerId) {
    throw new Error('RETAILER_AUTHORIZATION_REQUIRED');
  }

  if (!auth.permissions.dashboard) {
    throw new Error('DASHBOARD_ACCESS_DENIED');
  }

  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const retailerId = auth.retailerId;

  const [organizationScope, reportingCalendar] = await Promise.all([
    resolveOrganizationScope(retailerId, auth.scope),
    resolveReportingCalendar(retailerId),
  ]);

  /**
   * Daily/Weekly/Monthly/YTD semantics require authoritative retailer
   * calendar configuration. No UTC, January or timezone fallback is allowed.
   */
  if (!reportingCalendar) {
    throw new Error('REPORTING_CALENDAR_REQUIRED');
  }

  const now = new Date();
  const periods = resolveTrendPeriods(now, request, reportingCalendar);

  const firstPeriod = periods[0];

  if (!firstPeriod) {
    throw new Error('TREND_PERIOD_RESOLUTION_FAILED');
  }

  /**
   * Commercial trends inherit the commercial evidence ladder.
   *
   * The current platform does not yet possess the authoritative POS coverage,
   * E3 comparison methodology or E4 counterfactual/control authority required
   * to calculate these historical commercial outcomes defensibly.
   *
   * Do not manufacture historical commercial values.
   */
  if (
    request.metricId === 'conversion_rate_percent' ||
    request.metricId === 'basket_size_increase_percent' ||
    request.metricId === 'basket_size_increase_rand' ||
    request.metricId === 'sales_uplift_percent'
  ) {
    const result: OverviewMetricTrend = {
      metricId: request.metricId,
      granularity: request.granularity,
      points: periods.map((period) =>
        commercialUnavailablePoint(period, request.metricId)
      ),
    };

    return OverviewMetricTrendSchema.parse(result);
  }

  const authorizedStoreIds = new Set(organizationScope.storeIds);

  const deploymentSnapshot = await db
    .collection('deployments')
    .where('retailerId', '==', retailerId)
    .get();

  const authorizedDeploymentIds = new Set<string>();

  for (const document of deploymentSnapshot.docs) {
    const result = DeploymentSchema.safeParse(document.data());

    if (!result.success) {
      continue;
    }

    const deployment = result.data;

    if (deployment.retailerId !== retailerId) {
      throw new Error('DEPLOYMENT_TENANT_MISMATCH');
    }

    if (authorizedStoreIds.has(deployment.storeId)) {
      authorizedDeploymentIds.add(document.id);
    }
  }

  const queryStart = firstPeriod.startAt;

  if (request.metricId === 'qr_exposures') {
    const snapshot = await db
      .collection('qrExposures')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', queryStart)
      .limit(OVERVIEW_COMPLETENESS_PROBE_LIMIT)
      .get();

    const sourceComplete =
      snapshot.docs.length <= OVERVIEW_MAX_SOURCE_RECORDS;

    const exposureTimestamps: number[] = [];

    if (sourceComplete) {
      for (const document of snapshot.docs) {
        const data = document.data();
        const timestamp = timestampMillis(data.timestamp);
        const deploymentId =
          typeof data.deploymentId === 'string'
            ? data.deploymentId
            : undefined;

        if (
          timestamp <= 0 ||
          !deploymentId ||
          !authorizedDeploymentIds.has(deploymentId)
        ) {
          continue;
        }

        exposureTimestamps.push(timestamp);
      }
    }

    const result: OverviewMetricTrend = {
      metricId: request.metricId,
      granularity: request.granularity,
      points: periods.map((period) =>
        sourceComplete
          ? measuredPoint(
              period,
              exposureTimestamps.filter((timestamp) =>
                belongsToPeriod(timestamp, period)
              ).length
            )
          : incompletePoint(period)
      ),
    };

    return OverviewMetricTrendSchema.parse(result);
  }

  /**
   * Sessions are required directly for qualifying Shopper Sessions and are
   * also the authorization/identity anchor for Ari Interactions and Decision
   * Signals.
   */
  const sessionSnapshot = await db
    .collection('sessions')
    .where('retailerId', '==', retailerId)
    .where('startedAt', '>=', queryStart)
    .limit(OVERVIEW_COMPLETENESS_PROBE_LIMIT)
    .get();

  const sessionSourceComplete =
    sessionSnapshot.docs.length <= OVERVIEW_MAX_SOURCE_RECORDS;

  if (!sessionSourceComplete) {
    const result: OverviewMetricTrend = {
      metricId: request.metricId,
      granularity: request.granularity,
      points: periods.map(incompletePoint),
    };

    return OverviewMetricTrendSchema.parse(result);
  }

  const sessionsById = new Map<string, ShopperSession>();
  const sessionStartedAt = new Map<string, number>();

  for (const document of sessionSnapshot.docs) {
    const result = ShopperSessionSchema.safeParse(document.data());

    if (!result.success) {
      continue;
    }

    const session = result.data;

    if (session.sessionId !== document.id) {
      continue;
    }

    if (session.retailerId !== retailerId) {
      throw new Error('SESSION_TENANT_MISMATCH');
    }

    if (!authorizedDeploymentIds.has(session.deploymentId)) {
      continue;
    }

    const startedAt = timestampMillis(session.startedAt);

    if (startedAt <= 0) {
      continue;
    }

    sessionsById.set(session.sessionId, session);
    sessionStartedAt.set(session.sessionId, startedAt);
  }

  if (request.metricId === 'qualifying_shopper_sessions') {
    const timestamps = Array.from(sessionStartedAt.values());

    const result: OverviewMetricTrend = {
      metricId: request.metricId,
      granularity: request.granularity,
      points: periods.map((period) =>
        measuredPoint(
          period,
          timestamps.filter((timestamp) =>
            belongsToPeriod(timestamp, period)
          ).length
        )
      ),
    };

    return OverviewMetricTrendSchema.parse(result);
  }

  const eventSnapshot = await db
    .collection('events')
    .where('retailerId', '==', retailerId)
    .where('timestamp', '>=', queryStart)
    .limit(OVERVIEW_COMPLETENESS_PROBE_LIMIT)
    .get();

  const eventSourceComplete =
    eventSnapshot.docs.length <= OVERVIEW_MAX_SOURCE_RECORDS;

  if (!eventSourceComplete) {
    const result: OverviewMetricTrend = {
      metricId: request.metricId,
      granularity: request.granularity,
      points: periods.map(incompletePoint),
    };

    return OverviewMetricTrendSchema.parse(result);
  }

  const events: EvidenceEvent[] = eventSnapshot.docs
    .map((document) => {
      const data = document.data();

      return {
        sessionId:
          typeof data.sessionId === 'string'
            ? data.sessionId
            : undefined,
        eventType:
          typeof data.eventType === 'string'
            ? data.eventType
            : undefined,
        timestamp: timestampMillis(data.timestamp),
        metadata:
          data.metadata &&
          typeof data.metadata === 'object' &&
          !Array.isArray(data.metadata)
            ? (data.metadata as Record<string, unknown>)
            : undefined,
      };
    })
    .filter(
      (event) =>
        Boolean(event.sessionId) &&
        sessionsById.has(event.sessionId as string) &&
        event.timestamp > 0
    );

  const interactionEvents = events.filter(
    (event) => event.eventType === 'interaction_signal'
  );

  const selectedEvents =
    request.metricId === 'decision_signals'
      ? interactionEvents.filter(
          (event) => event.metadata?.evidenceType !== 'inferred'
        )
      : interactionEvents;

  const result: OverviewMetricTrend = {
    metricId: request.metricId,
    granularity: request.granularity,
    points: periods.map((period) =>
      measuredPoint(
        period,
        selectedEvents.filter((event) =>
          belongsToPeriod(event.timestamp, period)
        ).length
      )
    ),
  };

  return OverviewMetricTrendSchema.parse(result);
}
