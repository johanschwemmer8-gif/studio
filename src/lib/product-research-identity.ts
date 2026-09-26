import { parseGS1 } from "@/lib/gs1-parser";

import type {
  ProductEvidenceIdentity,
} from "@/lib/schemas/product-evidence";

import type {
  ProductResearchCandidate,
} from "@/lib/product-research-provider";

export type ProductResearchIdentityEvidence = {
  /**
   * GTINs explicitly observed in the retrieved candidate content or its
   * structured product metadata.
   */
  observedGtins?: string[];

  /**
   * Product naming evidence observed from the retrieved source.
   * These fields may support research but do not independently establish
   * exact canonical identity.
   */
  observedProductName?: string;
  observedBrandName?: string;
};

export type ProductResearchIdentityVerification =
  | {
      status: "EXACT_MATCH";
      method: "GTIN";
      matchedGtin: string;
    }
  | {
      status: "POSSIBLE_MATCH";
      method: "NAME_BRAND";
      reason: string;
    }
  | {
      status: "MISMATCH";
      reason: string;
    }
  | {
      status: "INSUFFICIENT";
      reason: string;
    };

function normalizeGtin(value: string): string | null {
  const compact = value.replace(/\s+/g, "");
  const parsed = parseGS1(compact);

  return parsed?.gtin ?? null;
}

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Verifies whether retrieved research evidence belongs to the canonical
 * product identity Ari is currently researching.
 *
 * SECURITY / EVIDENCE RULE:
 * - Exact normalized GTIN match may establish exact product identity.
 * - Name/brand similarity alone may identify a POSSIBLE candidate but must
 *   not establish exact identity.
 * - Explicit conflicting GTIN evidence is a mismatch.
 */
export function verifyProductResearchIdentity(
  identity: ProductEvidenceIdentity,
  candidate: ProductResearchCandidate,
  evidence: ProductResearchIdentityEvidence
): ProductResearchIdentityVerification {
  const expectedGtin = normalizeGtin(identity.gtin);

  /**
   * The canonical Product Evidence identity itself must remain GS1-valid.
   * If it is not, external research must not establish an exact match.
   */
  if (!expectedGtin) {
    return {
      status: "INSUFFICIENT",
      reason:
        "Canonical product identity does not contain a valid GS1 GTIN.",
    };
  }

  const observedGtins = Array.from(
    new Set(
      (evidence.observedGtins ?? [])
        .map(normalizeGtin)
        .filter((gtin): gtin is string => Boolean(gtin))
    )
  );

  if (observedGtins.includes(expectedGtin)) {
    return {
      status: "EXACT_MATCH",
      method: "GTIN",
      matchedGtin: expectedGtin,
    };
  }

  /**
   * If the retrieved source explicitly identifies product GTINs and none
   * matches the canonical product, fail closed rather than relying on text
   * similarity.
   */
  if (observedGtins.length > 0) {
    return {
      status: "MISMATCH",
      reason:
        "Retrieved source contains explicit GTIN evidence that does not match the canonical product.",
    };
  }

  const expectedName = normalizeText(identity.productName);
  const expectedBrand = normalizeText(identity.brandName);

  const observedName = normalizeText(evidence.observedProductName);
  const observedBrand = normalizeText(evidence.observedBrandName);

  const nameMatches =
    Boolean(expectedName) &&
    Boolean(observedName) &&
    expectedName === observedName;

  const brandMatches =
    Boolean(expectedBrand) &&
    Boolean(observedBrand) &&
    expectedBrand === observedBrand;

  if (nameMatches && brandMatches) {
    return {
      status: "POSSIBLE_MATCH",
      method: "NAME_BRAND",
      reason:
        "Product name and brand match, but exact canonical identity has not been established by GTIN.",
    };
  }

  /**
   * Candidate metadata is intentionally not used as identity authority.
   * Search titles/snippets help discovery only.
   */
  void candidate;

  return {
    status: "INSUFFICIENT",
    reason:
      "Retrieved source does not contain sufficient exact product identity evidence.",
  };
}
