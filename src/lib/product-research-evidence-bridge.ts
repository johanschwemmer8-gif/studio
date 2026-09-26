import type {
  ProductEvidenceFact,
  ProductEvidenceIdentity,
} from "@/lib/schemas/product-evidence";

import type {
  ProductResearchCandidate,
} from "@/lib/product-research-provider";

import {
  verifyProductResearchIdentity,
  type ProductResearchIdentityEvidence,
  type ProductResearchIdentityVerification,
} from "@/lib/product-research-identity";

import {
  admitExtractedProductEvidence,
  type ExtractedProductClaim,
  type ProductEvidenceExtractionResult,
} from "@/lib/product-evidence-extraction";

export type ProductResearchEvidenceObservation = {
  candidate: ProductResearchCandidate;

  /**
   * Identity evidence observed from retrieved source content or structured
   * product metadata. Search titles/snippets are not sufficient.
   */
  identityEvidence: ProductResearchIdentityEvidence;

  /**
   * Claims extracted from the retrieved source itself.
   * Grounded model prose and search metadata must not be supplied here.
   */
  claims: ExtractedProductClaim[];

  /**
   * Canonical ISO timestamp representing when the source was retrieved.
   */
  retrievedAt: string;
};

export type ProductResearchEvidenceBridgeResult =
  | {
      status: "ADMITTED";
      identityVerification: Extract<
        ProductResearchIdentityVerification,
        { status: "EXACT_MATCH" }
      >;
      facts: ProductEvidenceFact[];
    }
  | {
      status: "REJECTED";
      identityVerification: ProductResearchIdentityVerification;
      reason:
        | "IDENTITY_NOT_EXACT"
        | "NO_USABLE_CLAIMS"
        | "INVALID_RETRIEVAL_TIMESTAMP";
    };

/**
 * Deterministic bridge between external product research and normalized
 * Product Evidence.
 *
 * This bridge establishes no facts itself. It composes the existing identity
 * verification and evidence-admission boundaries so Compare, Suitability,
 * Explore Product and Ari do not bypass either control.
 */
export function bridgeProductResearchToEvidence(
  identity: ProductEvidenceIdentity,
  observation: ProductResearchEvidenceObservation
): ProductResearchEvidenceBridgeResult {
  const identityVerification = verifyProductResearchIdentity(
    identity,
    observation.candidate,
    observation.identityEvidence
  );

  const extraction: ProductEvidenceExtractionResult =
    admitExtractedProductEvidence({
      candidate: observation.candidate,
      identityVerification,
      claims: observation.claims,
      retrievedAt: observation.retrievedAt,
    });

  if (extraction.status === "REJECTED") {
    return {
      status: "REJECTED",
      identityVerification,
      reason: extraction.reason,
    };
  }

  if (identityVerification.status !== "EXACT_MATCH") {
    /**
     * Defensive invariant. admitExtractedProductEvidence() already rejects
     * every non-exact identity state, so this branch must never be reached.
     */
    return {
      status: "REJECTED",
      identityVerification,
      reason: "IDENTITY_NOT_EXACT",
    };
  }

  return {
    status: "ADMITTED",
    identityVerification,
    facts: extraction.facts,
  };
}
