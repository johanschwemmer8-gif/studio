'use server';

import { subDays } from 'date-fns';

import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import {
  resolveOrganizationScope,
} from '@/lib/organization-scope-server';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import { QrExposureSchema } from '@/lib/schemas/qr-exposure';
import { ShopperSessionSchema } from '@/lib/schemas/shopper-session';
import {
  ScanStatisticsResponseSchema,
  type ActivationPerformanceRow,
  type ScanStatisticsCountMetric,
  type ScanStatisticsRateMetric,
  type ScanStatisticsResponse,
} from '@/lib/schemas/scan-statistics';

const SCAN_STATISTICS_LOOKBACK_DAYS = 30;
const SCAN_STATISTICS_MAX_SOURCE_RECORDS = 5000;
const SCAN_STATISTICS_COMPLETENESS_PROBE_LIMIT =
  SCAN_STATISTICS_MAX_SOURCE_RECORDS + 1;

function authorizationFailed(
  result: Awaited<ReturnType<typeof verifyAuth>>
): result is { uid: ''; error: string } {
  return result.uid === '';
}

type DeploymentAuthority = {
  deploymentId: string;
  activationId: string;
  campaignId: string;
  qrCodeId?: string;
  storeId: string;
  storeName: string;
};

type PerformanceAccumulator = {
  authority: DeploymentAuthority;
  activationId: string;
  campaignId: string;
  qrCodeId: string;
  qrExposures: number;
  qualifyingShopperSessions: number;
  latestExposureAtMillis: number;
};

function measuredCount(value: number): ScanStatisticsCountMetric {
  return {
    status: value === 0 ? 'NO_ACTIVITY' : 'MEASURED',
    value,
  };
}

function incompleteCount(): ScanStatisticsCountMetric {
  return {
    status: 'UNAVAILABLE',
    value: null,
    reason: 'INCOMPLETE_COVERAGE',
  };
}

function measuredRate(
  exposures: number,
  sessions: number
): ScanStatisticsRateMetric {
  if (exposures === 0) {
    return {
      status: 'UNAVAILABLE',
      value: null,
      reason: 'NO_DENOMINATOR',
    };
  }

  return {
    status: sessions === 0 ? 'NO_ACTIVITY' : 'MEASURED',
    value: (sessions / exposures) * 100,
  };
}

function incompleteRate(): ScanStatisticsRateMetric {
  return {
    status: 'UNAVAILABLE',
    value: null,
    reason: 'INCOMPLETE_COVERAGE',
  };
}

function timestampMillis(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (
      value as {
        toDate: () => Date;
      }
    ).toDate();

    return date instanceof Date && Number.isFinite(date.getTime())
      ? date.getTime()
      : 0;
  }

  if (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    typeof (value as { seconds?: unknown }).seconds === 'number'
  ) {
    const seconds = (value as { seconds: number }).seconds;
    const nanoseconds =
      'nanoseconds' in value &&
      typeof (value as { nanoseconds?: unknown }).nanoseconds === 'number'
        ? (value as { nanoseconds: number }).nanoseconds
        : 0;

    return seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
  }

  return 0;
}

function performanceKey(
  activationId: string,
  deploymentId: string,
  qrCodeId: string
): string {
  return `${activationId}::${deploymentId}::${qrCodeId}`;
}

export async function getScanStatistics(
  idToken: string | undefined
): Promise<ScanStatisticsResponse> {
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
  const endTime = new Date();
  const startTime = subDays(endTime, SCAN_STATISTICS_LOOKBACK_DAYS);

  const resolvedScope = await resolveOrganizationScope(
    retailerId,
    auth.scope
  );

  const authorizedStoreIds = new Set(resolvedScope.storeIds);

  /**
   * Deployment is the deterministic bridge between organizational scope
   * and QR/POD evidence.
   *
   * Removed Deployments remain valid historical identity.
   */
  const deploymentSnapshot = await db
    .collection('deployments')
    .where('retailerId', '==', retailerId)
    .get();

  const deploymentsById = new Map<string, DeploymentAuthority>();

  for (const document of deploymentSnapshot.docs) {
    const result = DeploymentSchema.safeParse(document.data());

    if (!result.success) {
      continue;
    }

    const deployment = result.data;

    if (deployment.retailerId !== retailerId) {
      throw new Error('DEPLOYMENT_TENANT_MISMATCH');
    }

    if (!authorizedStoreIds.has(deployment.storeId)) {
      continue;
    }

    /**
     * Canonical document identity must agree with canonical Deployment
     * identity before it can authorize evidence.
     */
    if (deployment.deploymentId !== document.id) {
      continue;
    }

    deploymentsById.set(deployment.deploymentId, {
      deploymentId: deployment.deploymentId,
      activationId: deployment.activationId,
      campaignId: deployment.campaignId,
      qrCodeId: deployment.qrCodeId,
      storeId: deployment.storeId,
      storeName: deployment.storeName,
    });
  }

  const [exposureSnapshot, sessionSnapshot] = await Promise.all([
    db
      .collection('qrExposures')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', startTime)
      .limit(SCAN_STATISTICS_COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('sessions')
      .where('retailerId', '==', retailerId)
      .where('startedAt', '>=', startTime)
      .limit(SCAN_STATISTICS_COMPLETENESS_PROBE_LIMIT)
      .get(),
  ]);

  const exposureSourceComplete =
    exposureSnapshot.docs.length <= SCAN_STATISTICS_MAX_SOURCE_RECORDS;

  const sessionSourceComplete =
    sessionSnapshot.docs.length <= SCAN_STATISTICS_MAX_SOURCE_RECORDS;

  const performance = new Map<string, PerformanceAccumulator>();

  let authoritativeExposureCount = 0;
  let authoritativeSessionCount = 0;
  let latestEvidenceAtMillis = 0;

  if (exposureSourceComplete) {
    for (const document of exposureSnapshot.docs) {
      const result = QrExposureSchema.safeParse(document.data());

      if (!result.success) {
        continue;
      }

      const exposure = result.data;

      if (exposure.exposureId !== document.id) {
        continue;
      }

      if (exposure.retailerId !== retailerId) {
        throw new Error('QR_EXPOSURE_TENANT_MISMATCH');
      }

      if (exposure.environment !== 'PRODUCTION') {
        continue;
      }

      const authority = deploymentsById.get(exposure.deploymentId);

      if (!authority) {
        continue;
      }

      /**
       * Evidence identity must agree with its authoritative Deployment.
       * Do not repair or infer mismatched identity.
       */
      if (
        exposure.activationId !== authority.activationId ||
        exposure.campaignId !== authority.campaignId ||
        (authority.qrCodeId &&
          exposure.qrCodeId !== authority.qrCodeId)
      ) {
        continue;
      }

      const timestamp = timestampMillis(exposure.timestamp);

      if (timestamp <= 0) {
        continue;
      }

      authoritativeExposureCount += 1;
      latestEvidenceAtMillis = Math.max(
        latestEvidenceAtMillis,
        timestamp
      );

      const key = performanceKey(
        exposure.activationId,
        exposure.deploymentId,
        exposure.qrCodeId
      );

      const existing = performance.get(key);

      if (existing) {
        existing.qrExposures += 1;
        existing.latestExposureAtMillis = Math.max(
          existing.latestExposureAtMillis,
          timestamp
        );
      } else {
        performance.set(key, {
          authority,
          activationId: exposure.activationId,
          campaignId: exposure.campaignId,
          qrCodeId: exposure.qrCodeId,
          qrExposures: 1,
          qualifyingShopperSessions: 0,
          latestExposureAtMillis: timestamp,
        });
      }
    }
  }

  if (sessionSourceComplete) {
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

      if (session.environment !== 'PRODUCTION') {
        continue;
      }

      const authority = deploymentsById.get(session.deploymentId);

      if (!authority) {
        continue;
      }

      if (
        session.activationId !== authority.activationId ||
        session.campaignId !== authority.campaignId ||
        (authority.qrCodeId &&
          session.qrCodeId !== authority.qrCodeId)
      ) {
        continue;
      }

      const startedAt = timestampMillis(session.startedAt);

      if (startedAt <= 0) {
        continue;
      }

      authoritativeSessionCount += 1;
      latestEvidenceAtMillis = Math.max(
        latestEvidenceAtMillis,
        startedAt
      );

      const key = performanceKey(
        session.activationId,
        session.deploymentId,
        session.qrCodeId
      );

      const existing = performance.get(key);

      if (existing) {
        existing.qualifyingShopperSessions += 1;
      } else {
        /**
         * A qualifying Session can legitimately exist even when the matching
         * exposure falls outside the current evidence window.
         *
         * Preserve the authoritative Session row; do not invent an exposure.
         */
        performance.set(key, {
          authority,
          activationId: session.activationId,
          campaignId: session.campaignId,
          qrCodeId: session.qrCodeId,
          qrExposures: 0,
          qualifyingShopperSessions: 1,
          latestExposureAtMillis: 0,
        });
      }
    }
  }

  const activationPerformance: ActivationPerformanceRow[] =
    Array.from(performance.values())
      .map((entry) => ({
        activationId: entry.activationId,
        qrCodeId: entry.qrCodeId,
        campaignId: entry.campaignId,
        deploymentId: entry.authority.deploymentId,
        storeId: entry.authority.storeId,
        storeName: entry.authority.storeName,

        qrExposures: entry.qrExposures,
        qualifyingShopperSessions:
          entry.qualifyingShopperSessions,

        exposureToSessionRatePercent:
          exposureSourceComplete &&
          sessionSourceComplete &&
          entry.qrExposures > 0
            ? (entry.qualifyingShopperSessions /
                entry.qrExposures) *
              100
            : null,

        latestExposureAt:
          entry.latestExposureAtMillis > 0
            ? new Date(
                entry.latestExposureAtMillis
              ).toISOString()
            : null,
      }))
      .sort((a, b) => {
        if (b.qrExposures !== a.qrExposures) {
          return b.qrExposures - a.qrExposures;
        }

        if (
          b.qualifyingShopperSessions !==
          a.qualifyingShopperSessions
        ) {
          return (
            b.qualifyingShopperSessions -
            a.qualifyingShopperSessions
          );
        }

        return a.activationId.localeCompare(b.activationId);
      });

  const qrExposures = exposureSourceComplete
    ? measuredCount(authoritativeExposureCount)
    : incompleteCount();

  const qualifyingShopperSessions = sessionSourceComplete
    ? measuredCount(authoritativeSessionCount)
    : incompleteCount();

  const exposureToSessionRatePercent =
    exposureSourceComplete && sessionSourceComplete
      ? measuredRate(
          authoritativeExposureCount,
          authoritativeSessionCount
        )
      : incompleteRate();

  const response: ScanStatisticsResponse = {
    retailerId,

    scope: resolvedScope.scope,

    evidenceWindow: {
      startAt: startTime.toISOString(),
      endAt: endTime.toISOString(),
    },

    qrExposures,
    qualifyingShopperSessions,
    exposureToSessionRatePercent,

    activationPerformance:
      exposureSourceComplete && sessionSourceComplete
        ? activationPerformance
        : [],

    latestEvidenceAt:
      latestEvidenceAtMillis > 0
        ? new Date(latestEvidenceAtMillis).toISOString()
        : null,

    calculatedAt: endTime.toISOString(),
  };

  return ScanStatisticsResponseSchema.parse(response);
}
