import type { ExtractedProductClaim } from "@/lib/product-evidence-extraction";
import type { ProductResearchIdentityEvidence } from "@/lib/product-research-identity";

export type ProductStructuredDataExtraction = {
  identityEvidence: ProductResearchIdentityEvidence;
  claims: ExtractedProductClaim[];
};

type JsonObject = Record<string, unknown>;

const GTIN_KEYS = ["gtin", "gtin8", "gtin12", "gtin13", "gtin14"] as const;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const normalized = String(value).trim();
  return normalized || undefined;
}

function schemaTypes(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values
    .map(text)
    .filter((item): item is string => Boolean(item))
    .map((item) => item.toLocaleLowerCase());
}

function isProduct(value: JsonObject): boolean {
  return schemaTypes(value["@type"]).some(
    (type) => type === "product" || type.endsWith("/product")
  );
}

function collectObjects(value: unknown, output: JsonObject[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectObjects(item, output);
    return;
  }

  if (!isObject(value)) return;

  if (isProduct(value)) output.push(value);

  if (Array.isArray(value["@graph"])) {
    collectObjects(value["@graph"], output);
  }
}

function brandName(value: unknown): string | undefined {
  const direct = text(value);
  if (direct) return direct;

  if (isObject(value)) {
    return text(value.name);
  }

  return undefined;
}

function propertyValue(value: unknown): string | undefined {
  const direct = text(value);
  if (direct) return direct;

  if (!isObject(value)) return undefined;

  const rawValue = text(value.value);
  const unit = text(value.unitText) ?? text(value.unitCode);

  if (!rawValue) return undefined;
  return unit ? `${rawValue} ${unit}` : rawValue;
}

function claim(
  key: string,
  label: string,
  value: unknown
): ExtractedProductClaim | null {
  const normalized = propertyValue(value);
  if (!normalized) return null;

  return { key, label, value: normalized };
}

function parseDocuments(content: string, contentType: string): unknown[] {
  const documents: unknown[] = [];

  if (
    contentType === "application/json" ||
    contentType === "application/ld+json"
  ) {
    try {
      documents.push(JSON.parse(content));
    } catch {
      return [];
    }

    return documents;
  }

  if (contentType !== "text/html") return [];

  const scriptPattern =
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;

  for (const match of content.matchAll(scriptPattern)) {
    const attributes = match[1] ?? "";
    const raw = (match[2] ?? "").trim();

    const typeMatch = attributes.match(
      /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i
    );

    const scriptType = (
      typeMatch?.[1] ??
      typeMatch?.[2] ??
      typeMatch?.[3] ??
      ""
    )
      .trim()
      .toLocaleLowerCase();

    if (
      scriptType !== "application/ld+json" ||
      !raw
    ) {
      continue;
    }

    try {
      documents.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }

  return documents;
}

function extractProductNode(
  product: JsonObject
): ProductStructuredDataExtraction {
  const observedGtins = new Set<string>();
  const observedProductName = text(product.name);
  const observedBrandName = brandName(product.brand);
  const claims: ExtractedProductClaim[] = [];
  const seenClaims = new Set<string>();

  const addClaim = (candidate: ExtractedProductClaim | null) => {
    if (!candidate) return;

    const fingerprint = `${candidate.key}\u0000${candidate.value}`;
    if (seenClaims.has(fingerprint)) return;

    seenClaims.add(fingerprint);
    claims.push(candidate);
  };

  for (const key of GTIN_KEYS) {
    const value = product[key];
    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      const gtin = text(item);
      if (gtin) observedGtins.add(gtin);
    }
  }

  if (observedBrandName) {
    addClaim({
      key: "brand",
      label: "Brand",
      value: observedBrandName,
    });
  }

  addClaim(claim("sku", "SKU", product.sku));
  addClaim(claim("mpn", "MPN", product.mpn));
  addClaim(claim("model", "Model", product.model));
  addClaim(claim("description", "Description", product.description));
  addClaim(claim("size", "Size", product.size));
  addClaim(claim("weight", "Weight", product.weight));

  const additional = Array.isArray(product.additionalProperty)
    ? product.additionalProperty
    : product.additionalProperty
      ? [product.additionalProperty]
      : [];

  for (const item of additional) {
    if (!isObject(item)) continue;

    const name = text(item.name);
    const value = propertyValue(item);

    if (!name || !value) continue;

    const key = name
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!key) continue;

    addClaim({
      key: `property_${key}`,
      label: name,
      value,
    });
  }

  return {
    identityEvidence: {
      ...(observedGtins.size > 0
        ? { observedGtins: Array.from(observedGtins) }
        : {}),
      ...(observedProductName ? { observedProductName } : {}),
      ...(observedBrandName ? { observedBrandName } : {}),
    },
    claims,
  };
}

export function extractProductStructuredData(
  content: string,
  contentType: string
): ProductStructuredDataExtraction[] {
  const products: JsonObject[] = [];

  for (const document of parseDocuments(content, contentType)) {
    collectObjects(document, products);
  }

  return products.map(extractProductNode);
}
