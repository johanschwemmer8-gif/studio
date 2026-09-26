import {
  projectProductComparison,
} from "./product-comparison-projection";
import type {
  ProductComparisonEvidence,
  ProductEvidenceFact,
} from "./schemas/product-evidence";

function fact(
  key: string,
  value: string,
  verificationState:
    | "VERIFIED"
    | "SUPPORTED"
    | "UNVERIFIED"
    | "CONFLICTED",
  options: {
    label?: string;
    hasConflict?: boolean;
  } = {}
): ProductEvidenceFact {
  return {
    key,
    label: options.label ?? key,
    value,
    source: {
      sourceType: "INTERACT_PRODUCT_CATALOG",
      sourceName: "Test source",
      retrievedAt: "2026-09-26T10:00:00.000Z",
      identityMatched: true,
    },
    verificationState,
    hasConflict: options.hasConflict ?? false,
  };
}

function comparison(
  factsA: ProductEvidenceFact[],
  factsB: ProductEvidenceFact[]
): ProductComparisonEvidence {
  return {
    productA: {
      identity: {
        gtin: "00012345678912",
        productName: "Product A",
      },
      facts: factsA,
      evidenceState: "SUFFICIENT",
      limitations: [],
    },
    productB: {
      identity: {
        gtin: "00012345678913",
        productName: "Product B",
      },
      facts: factsB,
      evidenceState: "SUFFICIENT",
      limitations: [],
    },
  };
}

describe("projectProductComparison", () => {
  it("creates a comparable row when both products have usable evidence", () => {
    const result = projectProductComparison(
      comparison(
        [
          fact(
            "weight",
            "500",
            "VERIFIED",
            { label: "Weight" }
          ),
        ],
        [
          fact(
            "weight",
            "450",
            "SUPPORTED",
            { label: "Weight" }
          ),
        ]
      )
    );

    expect(result.rows).toEqual([
      {
        key: "weight",
        label: "Weight",
        state: "COMPARABLE",
        productA: {
          value: "500",
          verificationState: "VERIFIED",
        },
        productB: {
          value: "450",
          verificationState: "SUPPORTED",
        },
      },
    ]);
  });

  it("does not invent Product B evidence when only Product A has a fact", () => {
    const result = projectProductComparison(
      comparison(
        [
          fact(
            "brand",
            "Brand A",
            "VERIFIED",
            { label: "Brand" }
          ),
        ],
        []
      )
    );

    expect(result.rows[0]).toEqual({
      key: "brand",
      label: "Brand",
      state: "PRODUCT_A_ONLY",
      productA: {
        value: "Brand A",
        verificationState: "VERIFIED",
      },
    });
  });

  it("preserves conflicted evidence as unresolved", () => {
    const result = projectProductComparison(
      comparison(
        [
          fact(
            "weight",
            "500",
            "CONFLICTED",
            {
              label: "Weight",
              hasConflict: true,
            }
          ),
        ],
        [
          fact(
            "weight",
            "450",
            "VERIFIED",
            { label: "Weight" }
          ),
        ]
      )
    );

    expect(result.rows[0]).toEqual({
      key: "weight",
      label: "Weight",
      state: "UNRESOLVED",
      productB: {
        value: "450",
        verificationState: "VERIFIED",
      },
    });
  });

  it("does not expose unverified evidence as a settled comparison value", () => {
    const result = projectProductComparison(
      comparison(
        [
          fact(
            "material",
            "Cotton",
            "UNVERIFIED",
            { label: "Material" }
          ),
        ],
        []
      )
    );

    expect(result.rows[0]).toEqual({
      key: "material",
      label: "Material",
      state: "UNRESOLVED",
    });
  });

  it("combines and deduplicates evidence limitations", () => {
    const input = comparison([], []);

    input.productA.limitations = [
      "Manufacturer evidence unavailable.",
    ];

    input.productB.limitations = [
      "Manufacturer evidence unavailable.",
      "Retailer evidence unavailable.",
    ];

    const result =
      projectProductComparison(input);

    expect(result.limitations).toEqual([
      "Manufacturer evidence unavailable.",
      "Retailer evidence unavailable.",
    ]);
  });
});
