import {
  buildProductSuitabilityEvidenceBoundary,
  type ProductSuitabilityRequirement,
} from "@/lib/product-suitability";
import type { ProductEvidencePackage } from "@/lib/schemas/product-evidence";

const requirement = (
  text: string,
  sensitivity: ProductSuitabilityRequirement["sensitivity"] = "STANDARD",
): ProductSuitabilityRequirement => ({
  text,
  sensitivity,
});

const evidence = (
  overrides: Partial<ProductEvidencePackage> = {},
): ProductEvidencePackage => ({
  identity: {
    gtin: "06001234567890",
    productName: "Test Product",
  },
  facts: [],
  evidenceState: "SUFFICIENT",
  limitations: [],
  ...overrides,
});

describe("buildProductSuitabilityEvidenceBoundary", () => {
  it("does not treat the mere presence of product evidence as proof of suitability", () => {
    const result = buildProductSuitabilityEvidenceBoundary(
      evidence({
        facts: [
          {
            key: "waterproof",
            label: "Waterproof",
            value: "Yes",
            source: {
              sourceType: "MANUFACTURER",
              sourceName: "Manufacturer",
              retrievedAt: "2026-09-26T10:00:00.000Z",
              identityMatched: true,
            },
            verificationState: "SUPPORTED",
            hasConflict: false,
          },
        ],
      }),
      requirement("I need something waterproof"),
    );

    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.supportingFacts).toHaveLength(1);
  });

  it("excludes conflicted facts from the admissible evidence boundary", () => {
    const result = buildProductSuitabilityEvidenceBoundary(
      evidence({
        facts: [
          {
            key: "material",
            label: "Material",
            value: "Cotton",
            source: {
              sourceType: "PUBLIC_WEB",
              sourceName: "Public source",
              retrievedAt: "2026-09-26T10:00:00.000Z",
              identityMatched: true,
            },
            verificationState: "CONFLICTED",
            hasConflict: true,
          },
        ],
      }),
      requirement("I need cotton"),
    );

    expect(result.supportingFacts).toHaveLength(0);
    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("excludes unverified facts from the admissible evidence boundary", () => {
    const result = buildProductSuitabilityEvidenceBoundary(
      evidence({
        facts: [
          {
            key: "size",
            label: "Size",
            value: "Large",
            source: {
              sourceType: "PUBLIC_WEB",
              sourceName: "Public source",
              retrievedAt: "2026-09-26T10:00:00.000Z",
              identityMatched: true,
            },
            verificationState: "UNVERIFIED",
            hasConflict: false,
          },
        ],
      }),
      requirement("I need a large size"),
    );

    expect(result.supportingFacts).toHaveLength(0);
  });

  it("requires professional advice for medical suitability", () => {
    const result = buildProductSuitabilityEvidenceBoundary(
      evidence(),
      requirement(
        "Is this suitable for my medical condition?",
        "MEDICAL",
      ),
    );

    expect(result.requiresProfessionalAdvice).toBe(true);
    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("requires professional advice for safety-sensitive suitability", () => {
    const result = buildProductSuitabilityEvidenceBoundary(
      evidence(),
      requirement(
        "Is this safe for this safety-critical use?",
        "SAFETY_SENSITIVE",
      ),
    );

    expect(result.requiresProfessionalAdvice).toBe(true);
  });

  it("does not require professional advice for ordinary shopping suitability", () => {
    const result = buildProductSuitabilityEvidenceBoundary(
      evidence(),
      requirement("I need something lightweight"),
    );

    expect(result.requiresProfessionalAdvice).toBe(false);
  });

  it("preserves evidence limitations without duplicates", () => {
    const result = buildProductSuitabilityEvidenceBoundary(
      evidence({
        limitations: [
          "Manufacturer information unavailable.",
          "Manufacturer information unavailable.",
        ],
      }),
      requirement("I need something lightweight"),
    );

    expect(result.limitations).toEqual([
      "Manufacturer information unavailable.",
    ]);
  });
});
