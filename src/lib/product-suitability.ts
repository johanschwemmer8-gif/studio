import type {
  ProductEvidenceFact,
  ProductEvidencePackage,
} from "@/lib/schemas/product-evidence";

export type ProductSuitabilityOutcome =
  | "SUPPORTED"
  | "NOT_SUPPORTED"
  | "INSUFFICIENT_EVIDENCE";

export type ProductSuitabilitySensitivity =
  | "STANDARD"
  | "MEDICAL"
  | "SAFETY_SENSITIVE";

export type ProductSuitabilityRequirement = {
  text: string;
  sensitivity: ProductSuitabilitySensitivity;
};

export type ProductSuitabilityAssessment = {
  product: ProductEvidencePackage["identity"];
  requirement: ProductSuitabilityRequirement;
  outcome: ProductSuitabilityOutcome;
  supportingFacts: ProductEvidenceFact[];
  limitations: string[];
  requiresProfessionalAdvice: boolean;
};

function isUsableFact(fact: ProductEvidenceFact): boolean {
  return (
    !fact.hasConflict &&
    (fact.verificationState === "VERIFIED" ||
      fact.verificationState === "SUPPORTED")
  );
}

/**
 * Builds the evidence boundary for a suitability assessment.
 *
 * IMPORTANT:
 * This function deliberately does NOT infer whether a product satisfies a
 * free-text shopper requirement. Semantic interpretation belongs to the
 * controlled suitability interpretation layer.
 *
 * Its responsibility is to ensure that only admissible product evidence can
 * support that interpretation and that medical/safety-sensitive requests
 * cannot silently become personal medical or safety determinations.
 */
export function buildProductSuitabilityEvidenceBoundary(
  evidence: ProductEvidencePackage,
  requirement: ProductSuitabilityRequirement,
): ProductSuitabilityAssessment {
  const supportingFacts = evidence.facts.filter(isUsableFact);

  const limitations = Array.from(new Set(evidence.limitations));

  if (supportingFacts.length === 0 || evidence.evidenceState === "INSUFFICIENT") {
    return {
      product: evidence.identity,
      requirement,
      outcome: "INSUFFICIENT_EVIDENCE",
      supportingFacts: [],
      limitations,
      requiresProfessionalAdvice:
        requirement.sensitivity === "MEDICAL" ||
        requirement.sensitivity === "SAFETY_SENSITIVE",
    };
  }

  /*
   * Presence of usable evidence is NOT itself proof of suitability.
   * Until the controlled interpretation layer evaluates the shopper's
   * explicit requirement against these facts, the correct state remains
   * INSUFFICIENT_EVIDENCE.
   */
  return {
    product: evidence.identity,
    requirement,
    outcome: "INSUFFICIENT_EVIDENCE",
    supportingFacts,
    limitations,
    requiresProfessionalAdvice:
      requirement.sensitivity === "MEDICAL" ||
      requirement.sensitivity === "SAFETY_SENSITIVE",
  };
}
