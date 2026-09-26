import {
  validateProductSuitabilityInterpretation,
} from "@/lib/product-suitability-interpretation";
import type { ProductSuitabilityAssessment } from "@/lib/product-suitability";

function assessment(
  overrides: Partial<ProductSuitabilityAssessment> = {},
): ProductSuitabilityAssessment {
  return {
    product: {
      gtin: "06001234567890",
      productName: "Test Product",
    },
    requirement: {
      text: "I need something waterproof",
      sensitivity: "STANDARD",
    },
    outcome: "INSUFFICIENT_EVIDENCE",
    supportingFacts: [
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
    limitations: [],
    requiresProfessionalAdvice: false,
    ...overrides,
  };
}

describe("validateProductSuitabilityInterpretation", () => {
  it("accepts a supported conclusion only when it cites admitted evidence", () => {
    const result = validateProductSuitabilityInterpretation(
      assessment(),
      {
        outcome: "SUPPORTED",
        supportingFactKeys: ["waterproof"],
        explanation:
          "The available product information states that the product is waterproof.",
      },
    );

    expect(result.outcome).toBe("SUPPORTED");
    expect(result.supportingFactKeys).toEqual(["waterproof"]);
  });

  it("accepts a not-supported conclusion only when it cites admitted evidence", () => {
    const result = validateProductSuitabilityInterpretation(
      assessment(),
      {
        outcome: "NOT_SUPPORTED",
        supportingFactKeys: ["waterproof"],
        explanation:
          "The available product information does not support the stated requirement.",
      },
    );

    expect(result.outcome).toBe("NOT_SUPPORTED");
  });

  it("fails closed when a conclusion cites evidence outside the boundary", () => {
    const result = validateProductSuitabilityInterpretation(
      assessment(),
      {
        outcome: "SUPPORTED",
        supportingFactKeys: ["invented_fact"],
        explanation: "This product is suitable.",
      },
    );

    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.supportingFactKeys).toEqual([]);
  });

  it("fails closed when a supported conclusion cites no evidence", () => {
    const result = validateProductSuitabilityInterpretation(
      assessment(),
      {
        outcome: "SUPPORTED",
        supportingFactKeys: [],
        explanation: "This product is suitable.",
      },
    );

    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("preserves a legitimate insufficient-evidence conclusion", () => {
    const result = validateProductSuitabilityInterpretation(
      assessment(),
      {
        outcome: "INSUFFICIENT_EVIDENCE",
        supportingFactKeys: [],
        explanation:
          "The available information does not establish whether this requirement is met.",
      },
    );

    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("prevents medical questions from becoming personal suitability clearance", () => {
    const result = validateProductSuitabilityInterpretation(
      assessment({
        requirement: {
          text: "Is this suitable for my medical condition?",
          sensitivity: "MEDICAL",
        },
        requiresProfessionalAdvice: true,
      }),
      {
        outcome: "SUPPORTED",
        supportingFactKeys: ["waterproof"],
        explanation:
          "The available product information contains a relevant supported fact.",
      },
    );

    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.requiresProfessionalAdvice).toBe(true);
  });

  it("prevents safety-sensitive questions from becoming personal safety clearance", () => {
    const result = validateProductSuitabilityInterpretation(
      assessment({
        requirement: {
          text: "Is this safe for my safety-critical use?",
          sensitivity: "SAFETY_SENSITIVE",
        },
        requiresProfessionalAdvice: true,
      }),
      {
        outcome: "SUPPORTED",
        supportingFactKeys: ["waterproof"],
        explanation:
          "The available product information contains a relevant supported fact.",
      },
    );

    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.requiresProfessionalAdvice).toBe(true);
  });
});
