import {
  resolveProductEvidenceConflict,
} from "@/lib/product-evidence-authority";

import type {
  ProductEvidenceFact,
  ProductEvidenceIdentity,
  ProductEvidencePackage,
  ProductEvidenceSourceType,
} from "@/lib/schemas/product-evidence";

/**
 * Result returned by one eligible product-evidence source.
 *
 * Source failure is represented as data rather than an exception escaping
 * the orchestration boundary. One failed source must not cause Ari to fail.
 */
export type ProductEvidenceSourceResult =
  | {
      status: "AVAILABLE";
      sourceType: ProductEvidenceSourceType;
      facts: ProductEvidenceFact[];
      limitations?: string[];
    }
  | {
      status: "UNAVAILABLE";
      sourceType: ProductEvidenceSourceType;
      reason: string;
    }
  | {
      status: "FAILED";
      sourceType: ProductEvidenceSourceType;
      reason: string;
    };

/**
 * Every evidence provider implements this boundary.
 *
 * Future providers may include:
 * - iNteract Product Catalog
 * - retailer ecommerce / PIM / API
 * - retailer website
 * - manufacturer / brand sources
 * - public product data
 * - public web research
 *
 * Providers acquire evidence. They do not make shopper-facing conclusions.
 */
export interface ProductEvidenceProvider {
  readonly sourceType: ProductEvidenceSourceType;

  collect(
    identity: ProductEvidenceIdentity,
    context: ProductEvidenceContext
  ): Promise<ProductEvidenceSourceResult>;
}

export type ProductEvidenceContext = {
  /**
   * Authoritative retailer identity derived from the current shopper
   * session / Activation chain. Evidence providers must not trust a
   * retailer identity discovered from an unrelated product lookup.
   */
  retailerId: string;

  /**
   * Optional orchestration deadline override.
   *
   * Production callers should normally omit this and use the canonical
   * default. The override exists for deterministic testing and future
   * explicitly bounded execution contexts.
   */
  providerTimeoutMs?: number;
};

const DEFAULT_PROVIDER_TIMEOUT_MS = 5000;

async function collectWithDeadline(
  provider: ProductEvidenceProvider,
  identity: ProductEvidenceIdentity,
  context: ProductEvidenceContext
): Promise<ProductEvidenceSourceResult> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      provider.collect(identity, context),
      new Promise<ProductEvidenceSourceResult>((resolve) => {
        timeoutHandle = setTimeout(() => {
          resolve({
            status: "FAILED",
            sourceType: provider.sourceType,
            reason: "SOURCE_TIMEOUT",
          });
        }, context.providerTimeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export type ProductEvidenceOrchestrationResult = {
  evidence: ProductEvidencePackage;
  sourceResults: ProductEvidenceSourceResult[];
};

/**
 * Deterministic multi-source evidence orchestration.
 *
 * IMPORTANT:
 * - Product identity is supplied by the authoritative identity layer.
 * - Providers may enrich knowledge but cannot replace that identity.
 * - A provider failure does not terminate orchestration.
 * - Only identity-matched evidence is admitted.
 * - Conflicted evidence is retained as conflicted evidence.
 * - Missing evidence is never invented.
 *
 * Source precedence and fact-specific authority policies will be added as
 * explicit deterministic policy. Array order must not silently become an
 * authority ranking.
 */
export async function collectProductEvidence(
  identity: ProductEvidenceIdentity,
  context: ProductEvidenceContext,
  providers: readonly ProductEvidenceProvider[]
): Promise<ProductEvidenceOrchestrationResult> {
  const sourceResults: ProductEvidenceSourceResult[] = [];

  for (const provider of providers) {
    try {
      const result = await collectWithDeadline(
        provider,
        identity,
        context
      );
      sourceResults.push(result);
    } catch {
      sourceResults.push({
        status: "FAILED",
        sourceType: provider.sourceType,
        reason: "SOURCE_COLLECTION_FAILED",
      });
    }
  }

  const admittedFacts: ProductEvidenceFact[] = [];
  const limitations: string[] = [];

  for (const result of sourceResults) {
    if (result.status !== "AVAILABLE") {
      limitations.push(
        `${result.sourceType}: ${result.reason}`
      );
      continue;
    }

    if (result.limitations?.length) {
      limitations.push(...result.limitations);
    }

    for (const fact of result.facts) {
      /*
       * Evidence without a verified product-identity match cannot enter
       * Ari's normalized evidence package.
       */
      if (!fact.source.identityMatched) {
        continue;
      }

      admittedFacts.push(fact);
    }
  }

  /**
   * Resolve facts by semantic key before they are exposed to Ari.
   *
   * - A uniquely stronger fact-specific authority wins a disagreement.
   * - Equally authoritative disagreement remains explicitly CONFLICTED.
   * - Conflicting values are never averaged.
   */
  const factsByKey = new Map<string, ProductEvidenceFact[]>();

  for (const fact of admittedFacts) {
    const normalizedKey = fact.key.trim().toLocaleLowerCase();
    const existing = factsByKey.get(normalizedKey) ?? [];
    existing.push(fact);
    factsByKey.set(normalizedKey, existing);
  }

  const resolvedFacts: ProductEvidenceFact[] = [];

  for (const facts of factsByKey.values()) {
    const resolution = resolveProductEvidenceConflict(facts);

    if (resolution.status === "CONFLICTED") {
      resolvedFacts.push(...resolution.facts);
      limitations.push(
        `Conflicting evidence remains unresolved for ${resolution.key}.`
      );
      continue;
    }

    if (resolution.preferredFact) {
      resolvedFacts.push(resolution.preferredFact);
    }
  }

  /**
   * Only settled VERIFIED or SUPPORTED facts may establish evidence
   * sufficiency for Ari.
   *
   * UNVERIFIED and CONFLICTED facts remain in the evidence package for
   * provenance and transparency, but they cannot establish sufficiency
   * or support an unqualified Ari conclusion.
   */
  const usableFacts = resolvedFacts.filter(
    (fact) =>
      fact.verificationState === "VERIFIED" ||
      fact.verificationState === "SUPPORTED"
  );

  const evidenceState: ProductEvidencePackage["evidenceState"] =
    usableFacts.length > 0
      ? limitations.length > 0
        ? "LIMITED"
        : "SUFFICIENT"
      : "INSUFFICIENT";

  if (usableFacts.length === 0) {
    limitations.push(
      "No verified or supported product facts are currently available."
    );
  }

  return {
    evidence: {
      identity,
      facts: resolvedFacts,
      evidenceState,
      limitations: Array.from(new Set(limitations)),
    },
    sourceResults,
  };
}
