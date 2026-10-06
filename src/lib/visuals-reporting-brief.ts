import type {
  VisualsReportingBrief,
  VisualsReportingBriefProposal,
} from '@/lib/schemas/visuals-reporting-brief';

export type VisualsReportingBriefEvidence = {
  evidenceRefs: string[];
};

function unavailable(
  status: 'INSUFFICIENT_EVIDENCE' | 'AI_UNAVAILABLE',
  limitation: string,
): VisualsReportingBrief {
  return {
    status,
    executiveSummary:
      status === 'AI_UNAVAILABLE'
        ? 'AI reporting interpretation is currently unavailable. Verified Reporting Evidence remains available.'
        : 'The available verified reporting evidence is not sufficient for an AI Reporting Brief.',
    factualObservations: [],
    notablePatterns: [],
    reportingLimitations: [limitation],
  };
}

export function buildUnavailableVisualsReportingBrief(
  limitation: string,
): VisualsReportingBrief {
  return unavailable('AI_UNAVAILABLE', limitation);
}

export function buildInsufficientVisualsReportingBrief(
  limitation: string,
): VisualsReportingBrief {
  return unavailable('INSUFFICIENT_EVIDENCE', limitation);
}

export function validateVisualsReportingBrief(
  evidence: VisualsReportingBriefEvidence,
  proposal: VisualsReportingBriefProposal,
): VisualsReportingBrief {
  const admissibleRefs = new Set(
    evidence.evidenceRefs
      .map((ref) => ref.trim())
      .filter(Boolean),
  );

  if (admissibleRefs.size === 0) {
    return buildInsufficientVisualsReportingBrief(
      'No admissible verified reporting evidence was available for AI interpretation.',
    );
  }

  const referencedStatements = [
    ...proposal.factualObservations,
    ...proposal.notablePatterns,
  ];

  const hasInvalidEvidenceReference =
    referencedStatements.some(
      (item) =>
        item.evidenceRefs.length === 0 ||
        item.evidenceRefs.some(
          (ref) => !admissibleRefs.has(ref.trim()),
        ),
    );

  if (hasInvalidEvidenceReference) {
    return buildInsufficientVisualsReportingBrief(
      'The AI Reporting Brief referenced evidence outside the verified reporting evidence boundary.',
    );
  }

  return {
    status: 'AVAILABLE',
    executiveSummary: proposal.executiveSummary.trim(),
    factualObservations: proposal.factualObservations,
    notablePatterns: proposal.notablePatterns,
    reportingLimitations: proposal.reportingLimitations,
  };
}
