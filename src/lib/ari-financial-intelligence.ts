import type { ProfitRoiInterpretation } from '@/lib/schemas/profit-roi-interpretation';
import {
  AriFinancialIntelligenceSchema,
  AriFinancialNarrativeSchema,
  type AriFinancialIntelligence,
  type AriFinancialNarrative,
} from '@/lib/schemas/ari-financial-intelligence';

export interface AriFinancialNarrativeProvider {
  enhance(
    interpretation: ProfitRoiInterpretation
  ): Promise<unknown>;
}

function deterministicNarrative(
  interpretation: ProfitRoiInterpretation
): AriFinancialNarrative {
  const observations = [
    ...interpretation.factualObservations,
    ...interpretation.identifiedIndicators,
  ].map(statement => statement.text);

  const actions = interpretation.suggestedActions.map(
    statement => statement.text
  );

  const summary =
    observations.length > 0
      ? observations.join(' ')
      : actions.length > 0
        ? 'Financial outcomes remain evidence-constrained for the selected reporting context.'
        : 'No authoritative financial observations are available for the selected reporting context.';

  return {
    summary,
    observations,
    actions,
  };
}

export async function buildAriFinancialIntelligence(
  interpretation: ProfitRoiInterpretation,
  provider?: AriFinancialNarrativeProvider
): Promise<AriFinancialIntelligence> {
  const deterministic = deterministicNarrative(interpretation);

  if (!provider) {
    return AriFinancialIntelligenceSchema.parse({
      mode: 'DETERMINISTIC',
      interpretation,
      narrative: deterministic,
    });
  }

  try {
    const candidate = await provider.enhance(interpretation);
    const narrative = AriFinancialNarrativeSchema.parse(candidate);

    return AriFinancialIntelligenceSchema.parse({
      mode: 'ENHANCED',
      interpretation,
      narrative,
    });
  } catch {
    return AriFinancialIntelligenceSchema.parse({
      mode: 'DETERMINISTIC',
      interpretation,
      narrative: deterministic,
    });
  }
}
