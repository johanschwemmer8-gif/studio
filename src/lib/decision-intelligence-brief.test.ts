import {
  buildUnavailableDecisionIntelligenceBrief,
  validateDecisionIntelligenceBrief,
} from './decision-intelligence-brief';
import type {
  DecisionIntelligenceBriefProposal,
} from './schemas/decision-intelligence-brief';

function proposal(
  overrides: Partial<DecisionIntelligenceBriefProposal> = {},
): DecisionIntelligenceBriefProposal {
  return {
    executiveSummary: 'Verified activity shows a measurable decision journey.',
    factualObservations: [
      {
        statement: 'Ten qualifying shopper sessions were observed.',
        evidenceRefs: ['overview:qualifyingShopperSessions'],
      },
    ],
    identifiedIndicators: [
      {
        statement: 'Observed comparison activity may indicate active consideration.',
        evidenceRefs: ['overview:productComparisons'],
      },
    ],
    suggestedActions: [
      {
        statement: 'Review the product-comparison journey for friction.',
        evidenceRefs: ['overview:productComparisons'],
      },
    ],
    hypothesesToInvestigate: [
      {
        hypothesis: 'Comparison activity may be associated with unresolved product choice.',
        evidenceRefs: ['overview:productComparisons'],
        investigation: 'Compare subsequent basket and rejection evidence.',
      },
    ],
    evidenceLimitations: [
      'Observed association does not establish causality.',
    ],
    ...overrides,
  };
}

describe('Decision Intelligence brief evidence boundary', () => {
  const evidence = {
    evidenceRefs: [
      'overview:qualifyingShopperSessions',
      'overview:productComparisons',
    ],
  };

  it('accepts a proposal whose substantive statements cite only admissible evidence', () => {
    const result = validateDecisionIntelligenceBrief(
      evidence,
      proposal(),
    );

    expect(result.status).toBe('AVAILABLE');
    expect(result.factualObservations).toHaveLength(1);
    expect(result.identifiedIndicators).toHaveLength(1);
    expect(result.suggestedActions).toHaveLength(1);
    expect(result.hypothesesToInvestigate).toHaveLength(1);
  });

  it('rejects the entire proposal when Gemini invents an evidence reference', () => {
    const result = validateDecisionIntelligenceBrief(
      evidence,
      proposal({
        suggestedActions: [
          {
            statement: 'Increase stock immediately.',
            evidenceRefs: ['inventory:invented-stock-level'],
          },
        ],
      }),
    );

    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.factualObservations).toEqual([]);
    expect(result.identifiedIndicators).toEqual([]);
    expect(result.suggestedActions).toEqual([]);
    expect(result.hypothesesToInvestigate).toEqual([]);
    expect(result.evidenceLimitations).toContain(
      'The AI interpretation referenced evidence outside the authoritative evidence boundary.',
    );
  });

  it('fails closed when no admissible authoritative evidence exists', () => {
    const result = validateDecisionIntelligenceBrief(
      { evidenceRefs: [] },
      proposal(),
    );

    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.factualObservations).toEqual([]);
    expect(result.identifiedIndicators).toEqual([]);
    expect(result.suggestedActions).toEqual([]);
    expect(result.hypothesesToInvestigate).toEqual([]);
  });

  it('returns a truthful AI-unavailable state without manufacturing intelligence', () => {
    const result = buildUnavailableDecisionIntelligenceBrief(
      'Governed model unavailable.',
    );

    expect(result.status).toBe('AI_UNAVAILABLE');
    expect(result.factualObservations).toEqual([]);
    expect(result.identifiedIndicators).toEqual([]);
    expect(result.suggestedActions).toEqual([]);
    expect(result.hypothesesToInvestigate).toEqual([]);
    expect(result.evidenceLimitations).toEqual([
      'Governed model unavailable.',
    ]);
  });
});
