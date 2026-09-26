import {
  productFactAuthorityDomain,
  resolveProductEvidenceConflict,
} from "@/lib/product-evidence-authority";

import type {
  ProductEvidenceFact,
  ProductEvidenceSourceType,
} from "@/lib/schemas/product-evidence";

function fact(
  key: string,
  value: string,
  sourceType: ProductEvidenceSourceType,
  unit?: string
): ProductEvidenceFact {
  return {
    key,
    label: key,
    value,
    ...(unit ? { unit } : {}),
    source: {
      sourceType,
      sourceName: sourceType,
      sourceUrl: `https://example.com/${sourceType.toLowerCase()}`,
      retrievedAt: "2026-09-25T12:00:00.000Z",
      identityMatched: true,
    },
    verificationState: "SUPPORTED",
    hasConflict: false,
  };
}

describe("product evidence authority", () => {
  it("classifies retailer-commercial facts separately", () => {
    expect(productFactAuthorityDomain("price")).toBe(
      "RETAILER_COMMERCIAL"
    );
    expect(productFactAuthorityDomain("availability")).toBe(
      "RETAILER_COMMERCIAL"
    );
  });

  it("classifies manufacturer-product facts separately", () => {
    expect(productFactAuthorityDomain("ingredients")).toBe(
      "MANUFACTURER_PRODUCT"
    );
    expect(productFactAuthorityDomain("capacity")).toBe(
      "MANUFACTURER_PRODUCT"
    );
  });

  it("prefers retailer authority for conflicting current price", () => {
    const retailer = fact(
      "price",
      "99.99",
      "INTERACT_PRODUCT_CATALOG",
      "ZAR"
    );

    const publicWeb = fact(
      "price",
      "89.99",
      "PUBLIC_WEB",
      "ZAR"
    );

    const result = resolveProductEvidenceConflict([
      retailer,
      publicWeb,
    ]);

    expect(result.status).toBe("RESOLVED_BY_AUTHORITY");
    expect(result.preferredFact).toBe(retailer);
  });

  it("prefers manufacturer documentation for conflicting technical specification", () => {
    const manufacturer = fact(
      "capacity",
      "500",
      "MANUFACTURER_DOCUMENTATION",
      "ml"
    );

    const retailer = fact(
      "capacity",
      "450",
      "INTERACT_PRODUCT_CATALOG",
      "ml"
    );

    const result = resolveProductEvidenceConflict([
      manufacturer,
      retailer,
    ]);

    expect(result.status).toBe("RESOLVED_BY_AUTHORITY");
    expect(result.preferredFact).toBe(manufacturer);
  });

  it("treats matching values from multiple sources as agreement", () => {
    const manufacturer = fact(
      "capacity",
      "500",
      "MANUFACTURER",
      "ml"
    );

    const publicData = fact(
      "capacity",
      "500",
      "PUBLIC_PRODUCT_DATA",
      "ml"
    );

    const result = resolveProductEvidenceConflict([
      manufacturer,
      publicData,
    ]);

    expect(result.status).toBe("AGREED");
    expect(result.preferredFact).toBe(manufacturer);
  });

  it("keeps equally authoritative disagreement conflicted", () => {
    const retailerPim = fact(
      "price",
      "99.99",
      "RETAILER_PIM",
      "ZAR"
    );

    const retailerApi = fact(
      "price",
      "109.99",
      "RETAILER_API",
      "ZAR"
    );

    const result = resolveProductEvidenceConflict([
      retailerPim,
      retailerApi,
    ]);

    expect(result.status).toBe("CONFLICTED");
    expect(result.preferredFact).toBeUndefined();

    expect(
      result.facts.every(
        (item) =>
          item.verificationState === "CONFLICTED" &&
          item.hasConflict === true
      )
    ).toBe(true);
  });

  it("returns a single fact without manufacturing a conflict", () => {
    const onlyFact = fact(
      "material",
      "Stainless steel",
      "MANUFACTURER"
    );

    const result = resolveProductEvidenceConflict([
      onlyFact,
    ]);

    expect(result.status).toBe("SINGLE");
    expect(result.preferredFact).toBe(onlyFact);
  });

  it("rejects attempts to resolve different semantic keys together", () => {
    expect(() =>
      resolveProductEvidenceConflict([
        fact("price", "99.99", "INTERACT_PRODUCT_CATALOG"),
        fact("capacity", "500", "MANUFACTURER"),
      ])
    ).toThrow(
      "resolveProductEvidenceConflict requires facts with the same semantic key."
    );
  });
});
