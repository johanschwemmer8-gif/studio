import {
  bridgeProductResearchToEvidence,
} from "@/lib/product-research-evidence-bridge";

const identity = {
  gtin: "00012345678912",
  productName: "Test Product",
  brandName: "Test Brand",
};

const candidate = {
  sourceType: "PUBLIC_WEB" as const,
  sourceName: "Authoritative Product Source",
  sourceUrl: "https://example.com/product",
};

const retrievedAt = "2026-09-25T12:00:00.000Z";

describe("bridgeProductResearchToEvidence", () => {
  it("admits source claims only after exact GTIN identity verification", () => {
    const result = bridgeProductResearchToEvidence(identity, {
      candidate,
      identityEvidence: {
        observedGtins: ["00012345678912"],
        observedProductName: "Test Product",
        observedBrandName: "Test Brand",
      },
      claims: [
        {
          key: "weight",
          label: "Weight",
          value: "500",
          unit: "g",
        },
      ],
      retrievedAt,
    });

    expect(result.status).toBe("ADMITTED");

    if (result.status === "ADMITTED") {
      expect(result.identityVerification).toEqual({
        status: "EXACT_MATCH",
        method: "GTIN",
        matchedGtin: "00012345678912",
      });

      expect(result.facts).toEqual([
        expect.objectContaining({
          key: "weight",
          label: "Weight",
          value: "500",
          unit: "g",
          verificationState: "SUPPORTED",
          hasConflict: false,
          source: expect.objectContaining({
            sourceType: "PUBLIC_WEB",
            sourceName: "Authoritative Product Source",
            sourceUrl: "https://example.com/product",
            retrievedAt,
            identityMatched: true,
          }),
        }),
      ]);
    }
  });

  it("rejects name and brand agreement without exact GTIN evidence", () => {
    const result = bridgeProductResearchToEvidence(identity, {
      candidate,
      identityEvidence: {
        observedProductName: "Test Product",
        observedBrandName: "Test Brand",
      },
      claims: [
        {
          key: "weight",
          label: "Weight",
          value: "500",
          unit: "g",
        },
      ],
      retrievedAt,
    });

    expect(result.status).toBe("REJECTED");

    if (result.status === "REJECTED") {
      expect(result.identityVerification.status).toBe(
        "POSSIBLE_MATCH"
      );
      expect(result.reason).toBe("IDENTITY_NOT_EXACT");
    }
  });

  it("rejects claims when the retrieved source identifies another GTIN", () => {
    const result = bridgeProductResearchToEvidence(identity, {
      candidate,
      identityEvidence: {
        observedGtins: ["5449000000996"],
        observedProductName: "Test Product",
        observedBrandName: "Test Brand",
      },
      claims: [
        {
          key: "weight",
          label: "Weight",
          value: "500",
          unit: "g",
        },
      ],
      retrievedAt,
    });

    expect(result.status).toBe("REJECTED");

    if (result.status === "REJECTED") {
      expect(result.identityVerification.status).toBe("MISMATCH");
      expect(result.reason).toBe("IDENTITY_NOT_EXACT");
    }
  });

  it("preserves evidence-admission rejection for unusable claims", () => {
    const result = bridgeProductResearchToEvidence(identity, {
      candidate,
      identityEvidence: {
        observedGtins: ["00012345678912"],
      },
      claims: [
        {
          key: "",
          label: "Weight",
          value: "500",
        },
      ],
      retrievedAt,
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "REJECTED",
        reason: "NO_USABLE_CLAIMS",
      })
    );
  });

  it("preserves evidence-admission rejection for invalid timestamps", () => {
    const result = bridgeProductResearchToEvidence(identity, {
      candidate,
      identityEvidence: {
        observedGtins: ["00012345678912"],
      },
      claims: [
        {
          key: "weight",
          label: "Weight",
          value: "500",
          unit: "g",
        },
      ],
      retrievedAt: "not-a-timestamp",
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "REJECTED",
        reason: "INVALID_RETRIEVAL_TIMESTAMP",
      })
    );
  });
});
