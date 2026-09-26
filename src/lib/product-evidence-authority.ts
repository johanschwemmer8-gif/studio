import type {
  ProductEvidenceFact,
  ProductEvidenceSourceType,
} from "@/lib/schemas/product-evidence";

export type ProductFactAuthorityDomain =
  | "RETAILER_COMMERCIAL"
  | "MANUFACTURER_PRODUCT"
  | "GENERAL_PRODUCT";

export type ProductEvidenceConflictResolution = {
  key: string;
  facts: ProductEvidenceFact[];
  preferredFact?: ProductEvidenceFact;
  status:
    | "SINGLE"
    | "AGREED"
    | "RESOLVED_BY_AUTHORITY"
    | "CONFLICTED";
};

/**
 * Facts whose current truth is retailer-specific.
 *
 * These values must not be silently replaced by manufacturer or public-web
 * information because the retailer owns the current commercial context.
 */
const RETAILER_COMMERCIAL_KEYS = new Set([
  "price",
  "promotionalPrice",
  "availability",
  "stock",
  "retailerSku",
  "promotion",
]);

/**
 * Product-intrinsic facts normally established most strongly by the
 * manufacturer/brand or its formal documentation.
 */
const MANUFACTURER_PRODUCT_KEYS = new Set([
  "ingredients",
  "composition",
  "material",
  "materials",
  "capacity",
  "dimensions",
  "weight",
  "specification",
  "specifications",
  "model",
  "compatibility",
  "instructions",
  "usage",
]);

function normalizeKey(key: string): string {
  return key.trim().toLocaleLowerCase();
}

function normalizeValue(fact: ProductEvidenceFact): string {
  return [
    fact.value.trim().toLocaleLowerCase(),
    fact.unit?.trim().toLocaleLowerCase() ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function productFactAuthorityDomain(
  key: string
): ProductFactAuthorityDomain {
  const normalized = normalizeKey(key);

  if (RETAILER_COMMERCIAL_KEYS.has(normalized)) {
    return "RETAILER_COMMERCIAL";
  }

  if (MANUFACTURER_PRODUCT_KEYS.has(normalized)) {
    return "MANUFACTURER_PRODUCT";
  }

  return "GENERAL_PRODUCT";
}

function sourceAuthority(
  domain: ProductFactAuthorityDomain,
  sourceType: ProductEvidenceSourceType
): number {
  if (domain === "RETAILER_COMMERCIAL") {
    switch (sourceType) {
      case "INTERACT_PRODUCT_CATALOG":
      case "RETAILER_ECOMMERCE":
      case "RETAILER_PIM":
      case "RETAILER_API":
      case "RETAILER_WEBSITE":
        return 300;

      case "MANUFACTURER":
      case "BRAND":
      case "MANUFACTURER_DOCUMENTATION":
        return 200;

      case "PUBLIC_PRODUCT_DATA":
        return 100;

      case "PUBLIC_WEB":
        return 50;

      case "SHOPPER_PROVIDED":
        return 25;
    }
  }

  if (domain === "MANUFACTURER_PRODUCT") {
    switch (sourceType) {
      case "MANUFACTURER_DOCUMENTATION":
        return 300;

      case "MANUFACTURER":
      case "BRAND":
        return 275;

      case "INTERACT_PRODUCT_CATALOG":
      case "RETAILER_PIM":
      case "RETAILER_API":
      case "RETAILER_ECOMMERCE":
      case "RETAILER_WEBSITE":
        return 200;

      case "PUBLIC_PRODUCT_DATA":
        return 125;

      case "PUBLIC_WEB":
        return 75;

      case "SHOPPER_PROVIDED":
        return 25;
    }
  }

  switch (sourceType) {
    case "INTERACT_PRODUCT_CATALOG":
    case "RETAILER_PIM":
    case "RETAILER_API":
    case "MANUFACTURER_DOCUMENTATION":
    case "MANUFACTURER":
    case "BRAND":
      return 250;

    case "RETAILER_ECOMMERCE":
    case "RETAILER_WEBSITE":
      return 225;

    case "PUBLIC_PRODUCT_DATA":
      return 125;

    case "PUBLIC_WEB":
      return 75;

    case "SHOPPER_PROVIDED":
      return 25;
  }
}

/**
 * Resolves multiple facts for the same semantic key.
 *
 * Rules:
 * - one fact: use it;
 * - multiple sources agreeing on the normalized value: agreed;
 * - disagreement with one uniquely strongest fact-specific authority:
 *   prefer that fact;
 * - disagreement between equally strongest authorities: conflict remains.
 *
 * Conflicts are never silently averaged.
 */
export function resolveProductEvidenceConflict(
  facts: ProductEvidenceFact[]
): ProductEvidenceConflictResolution {
  if (facts.length === 0) {
    throw new Error(
      "resolveProductEvidenceConflict requires at least one fact."
    );
  }

  const key = facts[0].key;
  const normalizedKey = normalizeKey(key);

  if (
    facts.some(
      (fact) => normalizeKey(fact.key) !== normalizedKey
    )
  ) {
    throw new Error(
      "resolveProductEvidenceConflict requires facts with the same semantic key."
    );
  }

  if (facts.length === 1) {
    return {
      key,
      facts,
      preferredFact: facts[0],
      status: "SINGLE",
    };
  }

  const values = new Set(facts.map(normalizeValue));

  if (values.size === 1) {
    return {
      key,
      facts,
      preferredFact: facts[0],
      status: "AGREED",
    };
  }

  const domain = productFactAuthorityDomain(key);

  const ranked = facts.map((fact) => ({
    fact,
    authority: sourceAuthority(
      domain,
      fact.source.sourceType
    ),
  }));

  const highestAuthority = Math.max(
    ...ranked.map((entry) => entry.authority)
  );

  const strongest = ranked.filter(
    (entry) => entry.authority === highestAuthority
  );

  if (strongest.length === 1) {
    return {
      key,
      facts,
      preferredFact: strongest[0].fact,
      status: "RESOLVED_BY_AUTHORITY",
    };
  }

  const strongestValues = new Set(
    strongest.map((entry) => normalizeValue(entry.fact))
  );

  if (strongestValues.size === 1) {
    return {
      key,
      facts,
      preferredFact: strongest[0].fact,
      status: "RESOLVED_BY_AUTHORITY",
    };
  }

  return {
    key,
    facts: facts.map((fact) => ({
      ...fact,
      verificationState: "CONFLICTED",
      hasConflict: true,
    })),
    status: "CONFLICTED",
  };
}
