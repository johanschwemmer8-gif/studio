import type {
  RawEvidenceDocument,
} from './profit-roi-evidence';

import type {
  ReportingEvidenceWindow,
} from './reporting-evidence-server';

export type VisualsReportingEvidenceCounts = {
  qrExposures: number;
  qualifyingShopperSessions: number;
  ariInteractions: number;
  decisionSignals: number;
};

export type VisualsReportingActivationEvidenceRow = {
  campaignId: string;
  activationId: string;
  deploymentId: string;
  qrCodeId: string;
  storeId: string;
  storeName: string;
  qrExposures: number;
  qualifyingShopperSessions: number;
  exposureToSessionRatePercent: number | null;
  latestExposureAt: string | null;
};

export type VisualsReportingEvidenceProjection = {
  counts: VisualsReportingEvidenceCounts;
  activationPerformance: VisualsReportingActivationEvidenceRow[];
  latestEvidenceAt: string | null;
};

function record(
  document: RawEvidenceDocument,
): Record<string, unknown> {
  return document.data;
}

function stringValue(
  value: unknown,
): string | null {
  return typeof value === 'string' && value.length > 0
    ? value
    : null;
}

function dateValue(
  value: unknown,
): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (
      value as { toDate: () => Date }
    ).toDate();

    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function latestIso(
  documents: RawEvidenceDocument[],
  fields: string[],
): string | null {
  let latest: Date | null = null;

  for (const document of documents) {
    const data = record(document);

    for (const field of fields) {
      const candidate = dateValue(data[field]);

      if (
        candidate &&
        (!latest || candidate.getTime() > latest.getTime())
      ) {
        latest = candidate;
      }
    }
  }

  return latest ? latest.toISOString() : null;
}

function isAuthorizedDeployment(
  document: RawEvidenceDocument,
  authorizedDeploymentIds: ReadonlySet<string>,
): boolean {
  const deploymentId = stringValue(
    record(document).deploymentId,
  );

  return deploymentId !== null &&
    authorizedDeploymentIds.has(deploymentId);
}

function authorizedDocuments(
  documents: RawEvidenceDocument[],
  authorizedDeploymentIds: ReadonlySet<string>,
): RawEvidenceDocument[] {
  return documents.filter(document =>
    isAuthorizedDeployment(
      document,
      authorizedDeploymentIds,
    ),
  );
}

function isAriInteraction(
  document: RawEvidenceDocument,
): boolean {
  const data = record(document);

  const eventType =
    stringValue(data.eventType) ??
    stringValue(data.type) ??
    stringValue(data.name);

  if (!eventType) {
    return false;
  }

  const normalized = eventType.toLowerCase();

  return (
    normalized.includes('ari') ||
    normalized.includes('assistant') ||
    normalized.includes('question')
  );
}

function isDecisionSignal(
  document: RawEvidenceDocument,
): boolean {
  const data = record(document);

  const eventType =
    stringValue(data.eventType) ??
    stringValue(data.type) ??
    stringValue(data.name);

  if (!eventType) {
    return false;
  }

  const normalized = eventType.toLowerCase();

  return (
    normalized.includes('compare') ||
    normalized.includes('consider') ||
    normalized.includes('reject') ||
    normalized.includes('barrier') ||
    normalized.includes('alternative') ||
    normalized.includes('basket') ||
    normalized.includes('purchase')
  );
}

function exposureIdentity(
  document: RawEvidenceDocument,
): string | null {
  const data = record(document);

  return (
    stringValue(data.exposureId) ??
    stringValue(data.qrExposureId) ??
    stringValue(document.id)
  );
}

function sessionIdentity(
  document: RawEvidenceDocument,
): string | null {
  const data = record(document);

  return (
    stringValue(data.sessionId) ??
    stringValue(document.id)
  );
}

function uniqueCount(
  documents: RawEvidenceDocument[],
  identity: (
    document: RawEvidenceDocument,
  ) => string | null,
): number {
  const identities = new Set<string>();

  for (const document of documents) {
    const value = identity(document);

    if (value) {
      identities.add(value);
    }
  }

  return identities.size;
}

/**
 * Deterministically project the bounded canonical evidence window into
 * reporting evidence facts.
 *
 * This layer does not authenticate, authorize, query Firestore or invoke AI.
 * It may only derive facts from evidence already constrained to the exact
 * retailer, organisational scope and reporting period.
 */
export function projectReportingEvidence(
  evidence: ReportingEvidenceWindow,
): VisualsReportingEvidenceProjection {
  const authorizedDeploymentIds = new Set(
    evidence.authorizedDeploymentStoreIds.keys(),
  );

  const exposures = authorizedDocuments(
    evidence.exposures,
    authorizedDeploymentIds,
  );

  const sessions = authorizedDocuments(
    evidence.sessions,
    authorizedDeploymentIds,
  );

  const events = authorizedDocuments(
    evidence.events,
    authorizedDeploymentIds,
  );

  const ariEvents = events.filter(isAriInteraction);
  const decisionEvents = events.filter(isDecisionSignal);

  const counts: VisualsReportingEvidenceCounts = {
    qrExposures: uniqueCount(
      exposures,
      exposureIdentity,
    ),
    qualifyingShopperSessions: uniqueCount(
      sessions,
      sessionIdentity,
    ),
    ariInteractions: ariEvents.length,
    decisionSignals: decisionEvents.length,
  };

  const latestEvidenceAt = [
    latestIso(exposures, ['timestamp']),
    latestIso(sessions, ['startedAt']),
    latestIso(events, ['timestamp']),
    latestIso(evidence.transactions, ['timestamp']),
  ]
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1) ?? null;

  return {
    counts,
    activationPerformance: [],
    latestEvidenceAt,
  };
}
