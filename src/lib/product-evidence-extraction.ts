import type {
  ProductEvidenceFact,
} from "@/lib/schemas/product-evidence";

import type {
  ProductResearchCandidate,
} from "@/lib/product-research-provider";

import type {
  ProductResearchIdentityVerification,
} from "@/lib/product-research-identity";

/**
 * A factual claim extracted from retrieved source content.
 *
 * This is deliberately separate from search titles/snippets. Search metadata
 * is discovery material and must not be promoted directly into evidence.
 */
export type ExtractedProductClaim = {
  key: string;
  label: string;
  value: string;
  unit?: string;
};

/**
 * Input to the deterministic evidence-admission boundary.
 *
 * Claims are assumed to have been extracted from the retrieved source
 * content itself. This function does not perform retrieval or generative
 * extraction.
 */
export type ProductEvidenceExtractionInput = {
  candidate: ProductResearchCandidate;
  identityVerification: ProductResearchIdentityVerification;
  claims: ExtractedProductClaim[];
  retrievedAt: string;
};

export type ProductEvidenceExtractionResult =
  | {
      status: "ADMITTED";
      facts: ProductEvidenceFact[];
    }
  | {
      status: "REJECTED";
      reason:
        | "IDENTITY_NOT_EXACT"
        | "NO_USABLE_CLAIMS"
        | "INVALID_RETRIEVAL_TIMESTAMP";
    };

function normalizeClaim(
  claim: ExtractedProductClaim
): ExtractedProductClaim | null {
  const key = claim.key.trim();
  const label = claim.label.trim();
  const value = claim.value.trim();
  const unit = claim.unit?.trim();

  if (!key || !label || !value) {
    return null;
  }

  return {
    key,
    label,
    value,
    ...(unit ? { unit } : {}),
  };
}

/**
 * Converts retrieved product claims into normalized evidence facts.
 *
 * EVIDENCE RULES:
 * - Only EXACT_MATCH product identity may admit external claims.
 * - Search-result metadata is not accepted here.
 * - Empty/incomplete claims are discarded.
 * - External claims begin as SUPPORTED, not VERIFIED.
 *
 * VERIFIED remains reserved for evidence whose authority/verification policy
 * explicitly establishes that stronger state.
 */
export function admitExtractedProductEvidence(
  input: ProductEvidenceExtractionInput
): ProductEvidenceExtractionResult {
  if (input.identityVerification.status !== "EXACT_MATCH") {
    return {
      status: "REJECTED",
      reason: "IDENTITY_NOT_EXACT",
    };
  }

  const retrievedAt = new Date(input.retrievedAt);

  if (
    Number.isNaN(retrievedAt.getTime()) ||
    retrievedAt.toISOString() !== input.retrievedAt
  ) {
    return {
      status: "REJECTED",
      reason: "INVALID_RETRIEVAL_TIMESTAMP",
    };
  }

  const claims = input.claims
    .map(normalizeClaim)
    .filter(
      (claim): claim is ExtractedProductClaim =>
        claim !== null
    );

  if (claims.length === 0) {
    return {
      status: "REJECTED",
      reason: "NO_USABLE_CLAIMS",
    };
  }

  const source = {
    sourceType: input.candidate.sourceType,
    sourceName: input.candidate.sourceName,
    sourceUrl: input.candidate.sourceUrl,
    retrievedAt: input.retrievedAt,
    identityMatched: true,
  } as const;

  const facts: ProductEvidenceFact[] = claims.map(
    (claim) => ({
      key: claim.key,
      label: claim.label,
      value: claim.value,
      ...(claim.unit ? { unit: claim.unit } : {}),
      source,
      verificationState: "SUPPORTED",
      hasConflict: false,
    })
  );

  return {
    status: "ADMITTED",
    facts,
  };
}
