import type {
  DecisionIntelligenceBrief,
  DecisionIntelligenceBriefProposal,
} from '@/lib/schemas/decision-intelligence-brief';

export type DecisionIntelligenceEvidence = {
  evidenceRefs: string[];
};

function unavailable(
  status: 'INSUFFICIENT_EVIDENCE' | 'AI_UNAVAILABLE',
  limitation: string,
): DecisionIntelligenceBrief {
  return {
    status,
    executiveSummary:
      status === 'AI_UNAVAILABLE'
        ? 'AI interpretation is currently unavailable. Authoritative intelligence remains available.'
        : 'The available authoritative evidence is not sufficient for an AI intelligence brief.',
    factualObservations: [],
    identifiedIndicators: [],
    suggestedActions: [],
    hypothesesToInvestigate: [],
    evidenceLimitations: [limitation],
  };
}

export function buildUnavailableDecisionIntelligenceBrief(
  limitation: string,
): DecisionIntelligenceBrief {
  return unavailable('AI_UNAVAILABLE', limitation);
}

export function validateDecisionIntelligenceBrief(
  evidence: DecisionIntelligenceEvidence,
  proposal: DecisionIntelligenceBriefProposal,
): DecisionIntelligenceBrief {
  const admissibleRefs = new Set(
    evidence.evidenceRefs
      .map(ref => ref.trim())
      .filter(Boolean)
  );

  if (admissibleRefs.size === 0) {
    return unavailable(
      'INSUFFICIENT_EVIDENCE',
      'No admissible authoritative evidence was available for AI interpretation.',
    );
  }

  const allReferencedStatements = [
    ...proposal.factualObservations,
    ...proposal.identifiedIndicators,
    ...proposal.suggestedActions,
    ...proposal.hypothesesToInvestigate,
  ];

  const hasInvalidEvidenceReference =
    allReferencedStatements.some(item =>
      item.evidenceRefs.length === 0 ||
      item.evidenceRefs.some(
        ref => !admissibleRefs.has(ref.trim())
      )
    );

  if (hasInvalidEvidenceReference) {
    return unavailable(
      'INSUFFICIENT_EVIDENCE',
      'The AI interpretation referenced evidence outside the authoritative evidence boundary.',
    );
  }

  return {
    status: 'AVAILABLE',
    executiveSummary: proposal.executiveSummary.trim(),
    factualObservations: proposal.factualObservations,
    identifiedIndicators: proposal.identifiedIndicators,
    suggestedActions: proposal.suggestedActions,
    hypothesesToInvestigate: proposal.hypothesesToInvestigate,
    evidenceLimitations: proposal.evidenceLimitations,
  };
}
