function requireDocumentPart(
  name: string,
  value: string
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      `AI_GOVERNANCE_INVALID_DOCUMENT_ID_PART:${name}`
    );
  }

  if (normalized.includes('/')) {
    throw new Error(
      `AI_GOVERNANCE_INVALID_DOCUMENT_ID_PART:${name}`
    );
  }

  return normalized;
}

export function governancePolicyDocumentId(
  governanceId: string,
  governanceVersion: string
): string {
  return [
    requireDocumentPart('governanceId', governanceId),
    requireDocumentPart('governanceVersion', governanceVersion),
  ].join('__');
}

export function governanceControlDocumentId(
  governanceId: string,
  governanceVersion: string,
  controlId: string
): string {
  return [
    requireDocumentPart('governanceId', governanceId),
    requireDocumentPart('governanceVersion', governanceVersion),
    requireDocumentPart('controlId', controlId),
  ].join('__');
}

export const ACTIVE_AI_GOVERNANCE_POINTER_COLLECTION =
  'platformConfiguration';

export const ACTIVE_AI_GOVERNANCE_POINTER_DOCUMENT =
  'aiGovernance';

export function governanceChangeEventDocumentId(
  governanceId: string,
  governanceVersion: string,
  changeType: string,
  occurredAtMillis: number
): string {
  if (!Number.isSafeInteger(occurredAtMillis) || occurredAtMillis < 0) {
    throw new Error(
      'AI_GOVERNANCE_INVALID_CHANGE_EVENT_TIMESTAMP'
    );
  }

  return [
    requireDocumentPart('governanceId', governanceId),
    requireDocumentPart('governanceVersion', governanceVersion),
    requireDocumentPart('changeType', changeType),
    String(occurredAtMillis),
  ].join('__');
}
