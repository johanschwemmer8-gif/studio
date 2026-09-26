import type {
  ProductComparisonEvidence,
  ProductEvidenceFact,
  ProductEvidencePackage,
  ProductEvidenceVerificationState,
} from "@/lib/schemas/product-evidence";

export type ProductComparisonValue = {
  value: string;
  unit?: string;
  verificationState: ProductEvidenceVerificationState;
};

export type ProductComparisonRowState =
  | "COMPARABLE"
  | "PRODUCT_A_ONLY"
  | "PRODUCT_B_ONLY"
  | "UNRESOLVED";

export type ProductComparisonRow = {
  key: string;
  label: string;
  state: ProductComparisonRowState;
  productA?: ProductComparisonValue;
  productB?: ProductComparisonValue;
};

export type ProductComparisonProjection = {
  productA: ProductEvidencePackage["identity"];
  productB: ProductEvidencePackage["identity"];
  rows: ProductComparisonRow[];
  limitations: string[];
};

function normalizeKey(key: string): string {
  return key.trim().toLocaleLowerCase();
}

function isUsableFact(
  fact: ProductEvidenceFact
): boolean {
  return (
    !fact.hasConflict &&
    (fact.verificationState === "VERIFIED" ||
      fact.verificationState === "SUPPORTED")
  );
}

function toValue(
  fact: ProductEvidenceFact
): ProductComparisonValue {
  return {
    value: fact.value,
    ...(fact.unit ? { unit: fact.unit } : {}),
    verificationState: fact.verificationState,
  };
}

function groupFacts(
  facts: readonly ProductEvidenceFact[]
): Map<string, ProductEvidenceFact[]> {
  const grouped = new Map<
    string,
    ProductEvidenceFact[]
  >();

  for (const fact of facts) {
    const key = normalizeKey(fact.key);
    const existing = grouped.get(key) ?? [];
    existing.push(fact);
    grouped.set(key, existing);
  }

  return grouped;
}

function firstUsableFact(
  facts: readonly ProductEvidenceFact[]
): ProductEvidenceFact | undefined {
  return facts.find(isUsableFact);
}

function hasUnresolvedEvidence(
  facts: readonly ProductEvidenceFact[]
): boolean {
  return facts.some(
    (fact) =>
      fact.hasConflict ||
      fact.verificationState === "CONFLICTED" ||
      fact.verificationState === "UNVERIFIED"
  );
}

/**
 * Deterministic projection of normalized product evidence into shopper-facing
 * comparison rows.
 *
 * IMPORTANT:
 * - This function does not decide which product is "better".
 * - It does not infer missing values.
 * - It does not convert unsupported evidence into settled facts.
 * - Conflicted/unverified evidence remains unresolved.
 */
export function projectProductComparison(
  evidence: ProductComparisonEvidence
): ProductComparisonProjection {
  const productAFacts = groupFacts(
    evidence.productA.facts
  );
  const productBFacts = groupFacts(
    evidence.productB.facts
  );

  const keys = new Set<string>([
    ...productAFacts.keys(),
    ...productBFacts.keys(),
  ]);

  const rows: ProductComparisonRow[] = [];

  for (const key of keys) {
    const factsA = productAFacts.get(key) ?? [];
    const factsB = productBFacts.get(key) ?? [];

    const usableA = firstUsableFact(factsA);
    const usableB = firstUsableFact(factsB);

    const unresolvedA =
      hasUnresolvedEvidence(factsA);
    const unresolvedB =
      hasUnresolvedEvidence(factsB);

    const label =
      usableA?.label ??
      usableB?.label ??
      factsA[0]?.label ??
      factsB[0]?.label ??
      key;

    if (unresolvedA || unresolvedB) {
      rows.push({
        key,
        label,
        state: "UNRESOLVED",
        ...(usableA
          ? { productA: toValue(usableA) }
          : {}),
        ...(usableB
          ? { productB: toValue(usableB) }
          : {}),
      });

      continue;
    }

    if (usableA && usableB) {
      rows.push({
        key,
        label,
        state: "COMPARABLE",
        productA: toValue(usableA),
        productB: toValue(usableB),
      });

      continue;
    }

    if (usableA) {
      rows.push({
        key,
        label,
        state: "PRODUCT_A_ONLY",
        productA: toValue(usableA),
      });

      continue;
    }

    if (usableB) {
      rows.push({
        key,
        label,
        state: "PRODUCT_B_ONLY",
        productB: toValue(usableB),
      });
    }
  }

  return {
    productA: evidence.productA.identity,
    productB: evidence.productB.identity,
    rows,
    limitations: Array.from(
      new Set([
        ...evidence.productA.limitations,
        ...evidence.productB.limitations,
      ])
    ),
  };
}
