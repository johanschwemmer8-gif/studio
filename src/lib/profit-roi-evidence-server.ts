'use server';

/**
 * Authoritative Profit & ROI server action boundary.
 *
 * Authentication, authorization, tenant scope, reporting-period resolution
 * and Firestore access happen here.
 *
 * Deterministic evidence assembly is delegated to the pure
 * profit-roi-evidence module.
 */

import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import { resolveOrganizationScope } from '@/lib/organization-scope-server';
import { resolveReportingCalendar } from '@/lib/reporting-calendar-server';
import { resolveReportingPeriod } from '@/lib/reporting-period-server';

import { DeploymentSchema } from '@/lib/schemas/deployment';

import type { ProfitRoiSnapshot } from '@/lib/schemas/profit-roi';

import type {
  OverviewPeriodGranularity,
  OverviewScope,
} from '@/lib/schemas/overview-intelligence';

import {
  assembleProfitRoiEvidence,
  type RawEvidenceDocument,
} from '@/lib/profit-roi-evidence';

const MAX_SOURCE_RECORDS = 5000;
const COMPLETENESS_PROBE_LIMIT = MAX_SOURCE_RECORDS + 1;
function toScope(
  scope: {
    level: 'network' | 'brand' | 'division' | 'region' | 'area' | 'store';
    networkId?: string;
    brandId?: string;
    divisionId?: string;
    regionId?: string;
    areaId?: string;
    storeId?: string;
  }
): OverviewScope {
  return {
    level: scope.level,
    ...(scope.networkId ? { networkId: scope.networkId } : {}),
    ...(scope.brandId ? { brandId: scope.brandId } : {}),
    ...(scope.divisionId ? { divisionId: scope.divisionId } : {}),
    ...(scope.regionId ? { regionId: scope.regionId } : {}),
    ...(scope.areaId ? { areaId: scope.areaId } : {}),
    ...(scope.storeId ? { storeId: scope.storeId } : {}),
  };
}

/**
 * Pure evidence assembly kernel.
 *
 * Firestore access and authorization happen outside this function.
 * This kernel converts already-scoped source records into the canonical
 * ProfitRoiSnapshot while preserving the evidence ladder.
 */
export async function getProfitRoiEvidence(
  idToken: string | undefined,
  granularity: OverviewPeriodGranularity = 'MONTHLY'
): Promise<ProfitRoiSnapshot> {
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

  const period = resolveReportingPeriod(
    calculatedAt,
    granularity,
    reportingCalendar
  );

  const authorizedStoreIds = new Set(resolvedScope.storeIds);

  const deploymentSnapshot = await db
    .collection('deployments')
    .where('retailerId', '==', retailerId)
    .get();

  const authorizedDeploymentStoreIds = new Map<string, string>();

  for (const document of deploymentSnapshot.docs) {
    const deployment = DeploymentSchema.parse(document.data());

    if (deployment.retailerId !== retailerId) {
      throw new Error('DEPLOYMENT_TENANT_MISMATCH');
    }

    if (authorizedStoreIds.has(deployment.storeId)) {
      authorizedDeploymentStoreIds.set(
        deployment.deploymentId,
        deployment.storeId
      );
    }
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
      .where('timestamp', '>=', period.startAt)
      .where('timestamp', '<', period.endAt)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('sessions')
      .where('retailerId', '==', retailerId)
      .where('startedAt', '>=', period.startAt)
      .where('startedAt', '<', period.endAt)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('events')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', period.startAt)
      .where('timestamp', '<', period.endAt)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('transactions')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', period.startAt)
      .where('timestamp', '<', period.endAt)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),
  ]);

  const sourcesComplete = {
    exposures:
      exposureSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    sessions:
      sessionSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    events:
      eventSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    transactions:
      transactionSnapshot.docs.length <= MAX_SOURCE_RECORDS,
  };

  const toDocuments = (
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

  return assembleProfitRoiEvidence({
    retailerId,
    scope: toScope(resolvedScope.scope),
    reportingPeriod: {
      granularity: period.granularity,
      startAt: period.startAt,
      endAt: period.endAt,
      timezone: reportingCalendar.timezone,
      financialYearStartMonth:
        reportingCalendar.financialYearStartMonth,
    },
    authorizedDeploymentStoreIds,
    exposures: toDocuments(
      exposureSnapshot,
      sourcesComplete.exposures
    ),
    sessions: toDocuments(
      sessionSnapshot,
      sourcesComplete.sessions
    ),
    events: toDocuments(
      eventSnapshot,
      sourcesComplete.events
    ),
    transactions: toDocuments(
      transactionSnapshot,
      sourcesComplete.transactions
    ),
    sourcesComplete,
    calculatedAt,
  });
}
