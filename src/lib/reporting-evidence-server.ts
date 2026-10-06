import { getDb } from '@/lib/firebase-admin';
import { DeploymentSchema } from '@/lib/schemas/deployment';

import type { RawEvidenceDocument } from '@/lib/profit-roi-evidence';

const MAX_SOURCE_RECORDS = 5000;
const COMPLETENESS_PROBE_LIMIT = MAX_SOURCE_RECORDS + 1;

export type ReportingEvidenceCompleteness = {
  exposures: boolean;
  sessions: boolean;
  events: boolean;
  transactions: boolean;
};

export type ReportingEvidenceWindow = {
  retailerId: string;
  authorizedDeploymentStoreIds: Map<string, string>;
  exposures: RawEvidenceDocument[];
  sessions: RawEvidenceDocument[];
  events: RawEvidenceDocument[];
  transactions: RawEvidenceDocument[];
  sourcesComplete: ReportingEvidenceCompleteness;
};

type ReportingEvidenceInput = {
  retailerId: string;
  authorizedStoreIds: ReadonlySet<string>;
  startAt: Date;
  endAt: Date;
};

function assertEvidenceInput(input: ReportingEvidenceInput): void {
  if (!input.retailerId.trim()) {
    throw new Error('RETAILER_AUTHORIZATION_REQUIRED');
  }

  if (
    Number.isNaN(input.startAt.getTime()) ||
    Number.isNaN(input.endAt.getTime()) ||
    input.endAt.getTime() <= input.startAt.getTime()
  ) {
    throw new Error('INVALID_REPORTING_PERIOD');
  }
}

export function resolveAuthorizedDeploymentStoreIds(
  retailerId: string,
  authorizedStoreIds: ReadonlySet<string>,
  deployments: Array<{
    id: string;
    data: Record<string, unknown>;
  }>,
): Map<string, string> {
  const result = new Map<string, string>();

  for (const document of deployments) {
    const deployment = DeploymentSchema.parse(document.data);

    if (deployment.retailerId !== retailerId) {
      throw new Error('DEPLOYMENT_TENANT_MISMATCH');
    }

    if (authorizedStoreIds.has(deployment.storeId)) {
      result.set(deployment.deploymentId, deployment.storeId);
    }
  }

  return result;
}

function toDocuments(
  documents: Array<{
    id: string;
    data: () => Record<string, unknown>;
  }>,
  complete: boolean,
): RawEvidenceDocument[] {
  if (!complete) {
    return [];
  }

  return documents.map(document => ({
    id: document.id,
    data: document.data(),
  }));
}

/**
 * Acquire the canonical bounded reporting evidence window.
 *
 * SECURITY / EVIDENCE CONTRACT
 * - Authentication and permission checks happen before this function.
 * - Organisational scope has already been authorised and resolved.
 * - retailerId remains mandatory on every source query.
 * - Deployment identity bridges organisational scope to POD evidence.
 * - Every source uses the same exact [startAt, endAt) reporting period.
 * - Incomplete source coverage fails closed rather than returning partial
 *   evidence as if it were complete.
 */
export async function acquireReportingEvidence(
  input: ReportingEvidenceInput,
): Promise<ReportingEvidenceWindow> {
  assertEvidenceInput(input);

  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const deploymentSnapshot = await db
    .collection('deployments')
    .where('retailerId', '==', input.retailerId)
    .get();

  const authorizedDeploymentStoreIds =
    resolveAuthorizedDeploymentStoreIds(
      input.retailerId,
      input.authorizedStoreIds,
      deploymentSnapshot.docs.map(document => ({
        id: document.id,
        data: document.data(),
      })),
    );

  const [
    exposureSnapshot,
    sessionSnapshot,
    eventSnapshot,
    transactionSnapshot,
  ] = await Promise.all([
    db
      .collection('qrExposures')
      .where('retailerId', '==', input.retailerId)
      .where('timestamp', '>=', input.startAt)
      .where('timestamp', '<', input.endAt)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('sessions')
      .where('retailerId', '==', input.retailerId)
      .where('startedAt', '>=', input.startAt)
      .where('startedAt', '<', input.endAt)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('events')
      .where('retailerId', '==', input.retailerId)
      .where('timestamp', '>=', input.startAt)
      .where('timestamp', '<', input.endAt)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('transactions')
      .where('retailerId', '==', input.retailerId)
      .where('timestamp', '>=', input.startAt)
      .where('timestamp', '<', input.endAt)
      .limit(COMPLETENESS_PROBE_LIMIT)
      .get(),
  ]);

  const sourcesComplete: ReportingEvidenceCompleteness = {
    exposures:
      exposureSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    sessions:
      sessionSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    events:
      eventSnapshot.docs.length <= MAX_SOURCE_RECORDS,
    transactions:
      transactionSnapshot.docs.length <= MAX_SOURCE_RECORDS,
  };

  return {
    retailerId: input.retailerId,
    authorizedDeploymentStoreIds,
    exposures: toDocuments(
      exposureSnapshot.docs,
      sourcesComplete.exposures,
    ),
    sessions: toDocuments(
      sessionSnapshot.docs,
      sourcesComplete.sessions,
    ),
    events: toDocuments(
      eventSnapshot.docs,
      sourcesComplete.events,
    ),
    transactions: toDocuments(
      transactionSnapshot.docs,
      sourcesComplete.transactions,
    ),
    sourcesComplete,
  };
}
