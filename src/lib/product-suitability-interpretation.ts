import type { ProductSuitabilityAssessment } from "@/lib/product-suitability";

export type ProductSuitabilityInterpretationProposal = {
  outcome: "SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE";
  supportingFactKeys: string[];
  explanation: string;
};

export type ProductSuitabilityInterpretation = {
  outcome: "SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE";
  supportingFactKeys: string[];
  explanation: string;
  requiresProfessionalAdvice: boolean;
};

function insufficient(
  assessment: ProductSuitabilityAssessment,
  explanation = "The available product information is not sufficient to determine this reliably.",
): ProductSuitabilityInterpretation {
  return {
    outcome: "INSUFFICIENT_EVIDENCE",
    supportingFactKeys: [],
    explanation,
    requiresProfessionalAdvice: assessment.requiresProfessionalAdvice,
  };
}

/**
 * Validates an interpretation proposal against the deterministic evidence
 * boundary before it may be shown to the shopper.
 *
 * The interpreter may reason about admitted facts, but it may never create
 * new evidence or cite facts outside the boundary.
 */
export function validateProductSuitabilityInterpretation(
  assessment: ProductSuitabilityAssessment,
  proposal: ProductSuitabilityInterpretationProposal,
): ProductSuitabilityInterpretation {
  const explanation = proposal.explanation?.trim();

  if (!explanation) {
    return insufficient(assessment);
  }

  const admissibleKeys = new Set(
    assessment.supportingFacts.map((fact) => fact.key),
  );

  const proposedKeys = Array.from(
    new Set(
      proposal.supportingFactKeys
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  );

  const citesUnknownFact = proposedKeys.some(
    (key) => !admissibleKeys.has(key),
  );

  if (citesUnknownFact) {
    return insufficient(assessment);
  }

  if (proposal.outcome === "INSUFFICIENT_EVIDENCE") {
    return {
      outcome: "INSUFFICIENT_EVIDENCE",
      supportingFactKeys: proposedKeys,
      explanation,
      requiresProfessionalAdvice: assessment.requiresProfessionalAdvice,
    };
  }

  /*
   * A positive or negative suitability conclusion must cite at least one
   * admissible VERIFIED/SUPPORTED, non-conflicted product fact.
   */
  if (proposedKeys.length === 0) {
    return insufficient(assessment);
  }

  /*
   * Medical and safety-sensitive questions may communicate factual product
   * information, but must not become individualized medical/safety clearance.
   */
  if (assessment.requiresProfessionalAdvice) {
    return {
      outcome: "INSUFFICIENT_EVIDENCE",
      supportingFactKeys: proposedKeys,
      explanation,
      requiresProfessionalAdvice: true,
    };
  }

  return {
    outcome: proposal.outcome,
    supportingFactKeys: proposedKeys,
    explanation,
    requiresProfessionalAdvice: false,
  };
}
