import {
  admitExtractedProductEvidence,
} from "@/lib/product-evidence-extraction";

import type {
  ProductResearchCandidate,
} from "@/lib/product-research-provider";

const candidate: ProductResearchCandidate = {
  sourceType: "MANUFACTURER",
  sourceName: "Test Manufacturer",
  sourceUrl: "https://example.com/product",
};

const exactMatch = {
  status: "EXACT_MATCH",
  method: "GTIN",
  matchedGtin: "00012345678912",
} as const;

const retrievedAt = "2026-09-25T12:00:00.000Z";

describe("admitExtractedProductEvidence", () => {
  it("admits claims only after EXACT_MATCH identity verification", () => {
    const result = admitExtractedProductEvidence({
      candidate,
      identityVerification: exactMatch,
      retrievedAt,
      claims: [
        {
          key: "capacity",
          label: "Capacity",
          value: "500",
          unit: "ml",
        },
      ],
    });

    expect(result.status).toBe("ADMITTED");

    if (result.status === "ADMITTED") {
      expect(result.facts).toHaveLength(1);
      expect(result.facts[0]).toEqual(
        expect.objectContaining({
          key: "capacity",
          label: "Capacity",
          value: "500",
          unit: "ml",
          verificationState: "SUPPORTED",
          hasConflict: false,
        })
      );
    }
  });

  it("preserves source provenance on admitted facts", () => {
    const result = admitExtractedProductEvidence({
      candidate,
      identityVerification: exactMatch,
      retrievedAt,
      claims: [
        {
          key: "material",
          label: "Material",
          value: "Stainless steel",
        },
      ],
    });

    expect(result.status).toBe("ADMITTED");

    if (result.status === "ADMITTED") {
      expect(result.facts[0].source).toEqual({
        sourceType: "MANUFACTURER",
        sourceName: "Test Manufacturer",
        sourceUrl: "https://example.com/product",
        retrievedAt,
        identityMatched: true,
      });
    }
  });

  it("rejects POSSIBLE_MATCH identity", () => {
    const result = admitExtractedProductEvidence({
      candidate,
      identityVerification: {
        status: "POSSIBLE_MATCH",
        method: "NAME_BRAND",
        reason: "Name and brand match only.",
      },
      retrievedAt,
      claims: [
        {
          key: "capacity",
          label: "Capacity",
          value: "500 ml",
        },
      ],
    });

    expect(result).toEqual({
      status: "REJECTED",
      reason: "IDENTITY_NOT_EXACT",
    });
  });

  it("rejects MISMATCH identity", () => {
    const result = admitExtractedProductEvidence({
      candidate,
      identityVerification: {
        status: "MISMATCH",
        reason: "Explicit GTIN mismatch.",
      },
      retrievedAt,
      claims: [
        {
          key: "capacity",
          label: "Capacity",
          value: "500 ml",
        },
      ],
    });

    expect(result).toEqual({
      status: "REJECTED",
      reason: "IDENTITY_NOT_EXACT",
    });
  });

  it("rejects INSUFFICIENT identity", () => {
    const result = admitExtractedProductEvidence({
      candidate,
      identityVerification: {
        status: "INSUFFICIENT",
        reason: "No exact product identity evidence.",
      },
      retrievedAt,
      claims: [
        {
          key: "capacity",
          label: "Capacity",
          value: "500 ml",
        },
      ],
    });

    expect(result).toEqual({
      status: "REJECTED",
      reason: "IDENTITY_NOT_EXACT",
    });
  });

  it("discards malformed claims while retaining usable claims", () => {
    const result = admitExtractedProductEvidence({
      candidate,
      identityVerification: exactMatch,
      retrievedAt,
      claims: [
        {
          key: "capacity",
          label: "Capacity",
          value: "500",
          unit: "ml",
        },
        {
          key: "",
          label: "Broken",
          value: "Should disappear",
        },
        {
          key: "empty-value",
          label: "Empty Value",
          value: "   ",
        },
      ],
    });

    expect(result.status).toBe("ADMITTED");

    if (result.status === "ADMITTED") {
      expect(result.facts).toHaveLength(1);
      expect(result.facts[0].key).toBe("capacity");
    }
  });

  it("rejects the extraction when no usable claims remain", () => {
    const result = admitExtractedProductEvidence({
      candidate,
      identityVerification: exactMatch,
      retrievedAt,
      claims: [
        {
          key: "",
          label: "",
          value: "",
        },
      ],
    });

    expect(result).toEqual({
      status: "REJECTED",
      reason: "NO_USABLE_CLAIMS",
    });
  });

  it("rejects an invalid retrieval timestamp", () => {
    const result = admitExtractedProductEvidence({
      candidate,
      identityVerification: exactMatch,
      retrievedAt: "not-a-timestamp",
      claims: [
        {
          key: "capacity",
          label: "Capacity",
          value: "500 ml",
        },
      ],
    });

    expect(result).toEqual({
      status: "REJECTED",
      reason: "INVALID_RETRIEVAL_TIMESTAMP",
    });
  });
});
