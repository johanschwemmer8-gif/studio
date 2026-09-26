import {
  verifyProductResearchIdentity,
} from "@/lib/product-research-identity";

import type {
  ProductEvidenceIdentity,
} from "@/lib/schemas/product-evidence";

import type {
  ProductResearchCandidate,
} from "@/lib/product-research-provider";

const identity: ProductEvidenceIdentity = {
  gtin: "00012345678912",
  productName: "Test Product 500ml",
  brandName: "Test Brand",
};

const candidate: ProductResearchCandidate = {
  sourceType: "MANUFACTURER",
  sourceName: "Test Manufacturer",
  sourceUrl: "https://example.com/product",
  title: "Test Product 500ml",
  snippet: "Search-result metadata must not establish identity.",
};

describe("verifyProductResearchIdentity", () => {
  it("establishes EXACT_MATCH from the canonical GTIN", () => {
    const result = verifyProductResearchIdentity(
      identity,
      candidate,
      {
        observedGtins: ["00012345678912"],
        observedProductName: "Test Product 500ml",
        observedBrandName: "Test Brand",
      }
    );

    expect(result).toEqual({
      status: "EXACT_MATCH",
      method: "GTIN",
      matchedGtin: "00012345678912",
    });
  });

  it("normalizes formatting around an otherwise exact GTIN", () => {
    const result = verifyProductResearchIdentity(
      identity,
      candidate,
      {
        observedGtins: ["0001 2345 6789 12"],
      }
    );

    expect(result.status).toBe("EXACT_MATCH");
  });

  it("fails closed when explicit GTIN evidence identifies another product", () => {
    const result = verifyProductResearchIdentity(
      identity,
      candidate,
      {
        observedGtins: ["00012345678929"],
        observedProductName: "Test Product 500ml",
        observedBrandName: "Test Brand",
      }
    );

    expect(result.status).toBe("MISMATCH");
  });

  it("treats exact name and brand as POSSIBLE_MATCH rather than exact identity", () => {
    const result = verifyProductResearchIdentity(
      identity,
      candidate,
      {
        observedProductName: "Test Product 500ml",
        observedBrandName: "Test Brand",
      }
    );

    expect(result.status).toBe("POSSIBLE_MATCH");

    if (result.status === "POSSIBLE_MATCH") {
      expect(result.method).toBe("NAME_BRAND");
    }
  });

  it("does not use search title or snippet as identity authority", () => {
    const result = verifyProductResearchIdentity(
      identity,
      candidate,
      {}
    );

    expect(result.status).toBe("INSUFFICIENT");
  });

  it("does not establish identity from product name alone", () => {
    const result = verifyProductResearchIdentity(
      identity,
      candidate,
      {
        observedProductName: "Test Product 500ml",
      }
    );

    expect(result.status).toBe("INSUFFICIENT");
  });

  it("does not establish identity from brand alone", () => {
    const result = verifyProductResearchIdentity(
      identity,
      candidate,
      {
        observedBrandName: "Test Brand",
      }
    );

    expect(result.status).toBe("INSUFFICIENT");
  });
});
