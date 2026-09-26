import {
  collectProductEvidence,
  type ProductEvidenceProvider,
} from "@/lib/product-evidence-orchestrator";

import type {
  ProductEvidenceFact,
  ProductEvidenceIdentity,
  ProductEvidenceSourceType,
} from "@/lib/schemas/product-evidence";

const identity: ProductEvidenceIdentity = {
  gtin: "00012345678912",
  productName: "Test Product",
};

const context = {
  retailerId: "retailer-a",
  providerTimeoutMs: 20,
};

function makeFact(
  verificationState:
    | "VERIFIED"
    | "SUPPORTED"
    | "UNVERIFIED"
    | "CONFLICTED",
  identityMatched = true
): ProductEvidenceFact {
  return {
    key: "brand",
    label: "Brand",
    value: "Test Brand",
    source: {
      sourceType: "INTERACT_PRODUCT_CATALOG",
      sourceName: "Test Source",
      retrievedAt: "2026-09-25T12:00:00.000Z",
      identityMatched,
    },
    verificationState,
    hasConflict: verificationState === "CONFLICTED",
  };
}

function provider(
  sourceType: ProductEvidenceSourceType,
  collect: ProductEvidenceProvider["collect"]
): ProductEvidenceProvider {
  return {
    sourceType,
    collect,
  };
}

describe("collectProductEvidence", () => {
  it("returns authoritative surviving evidence when another source is unavailable", async () => {
    const available = provider(
      "INTERACT_PRODUCT_CATALOG",
      async () => ({
        status: "AVAILABLE",
        sourceType: "INTERACT_PRODUCT_CATALOG",
        facts: [makeFact("VERIFIED")],
      })
    );

    const unavailable = provider(
      "PUBLIC_WEB",
      async () => ({
        status: "UNAVAILABLE",
        sourceType: "PUBLIC_WEB",
        reason: "SOURCE_UNAVAILABLE",
      })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [available, unavailable]
    );

    expect(result.evidence.facts).toHaveLength(1);
    expect(result.evidence.evidenceState).toBe("LIMITED");
    expect(result.sourceResults).toHaveLength(2);
    expect(result.evidence.limitations).toContain(
      "PUBLIC_WEB: SOURCE_UNAVAILABLE"
    );
  });

  it("contains a provider exception instead of failing orchestration", async () => {
    const surviving = provider(
      "INTERACT_PRODUCT_CATALOG",
      async () => ({
        status: "AVAILABLE",
        sourceType: "INTERACT_PRODUCT_CATALOG",
        facts: [makeFact("VERIFIED")],
      })
    );

    const throwing = provider(
      "PUBLIC_WEB",
      async () => {
        throw new Error("provider exploded");
      }
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [surviving, throwing]
    );

    expect(result.evidence.facts).toHaveLength(1);
    expect(result.evidence.evidenceState).toBe("LIMITED");

    expect(result.sourceResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "FAILED",
          sourceType: "PUBLIC_WEB",
        }),
      ])
    );
  });

  it("contains a timed-out provider and preserves surviving evidence", async () => {
    const surviving = provider(
      "INTERACT_PRODUCT_CATALOG",
      async () => ({
        status: "AVAILABLE",
        sourceType: "INTERACT_PRODUCT_CATALOG",
        facts: [makeFact("SUPPORTED")],
      })
    );

    const hanging = provider(
      "PUBLIC_WEB",
      async () =>
        new Promise(() => {
          // Deliberately unresolved. The orchestration deadline must win.
        })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [surviving, hanging]
    );

    expect(result.evidence.facts).toHaveLength(1);
    expect(result.evidence.evidenceState).toBe("LIMITED");

    expect(result.sourceResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "FAILED",
          sourceType: "PUBLIC_WEB",
          reason: "SOURCE_TIMEOUT",
        }),
      ])
    );
  });

  it("does not admit facts whose source identity did not match", async () => {
    const mismatched = provider(
      "INTERACT_PRODUCT_CATALOG",
      async () => ({
        status: "AVAILABLE",
        sourceType: "INTERACT_PRODUCT_CATALOG",
        facts: [makeFact("VERIFIED", false)],
      })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [mismatched]
    );

    expect(result.evidence.facts).toHaveLength(0);
    expect(result.evidence.evidenceState).toBe("INSUFFICIENT");
  });

  it("retains UNVERIFIED evidence but does not let it establish sufficiency", async () => {
    const unverified = provider(
      "PUBLIC_WEB",
      async () => ({
        status: "AVAILABLE",
        sourceType: "PUBLIC_WEB",
        facts: [makeFact("UNVERIFIED")],
      })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [unverified]
    );

    expect(result.evidence.facts).toHaveLength(1);
    expect(result.evidence.facts[0].verificationState).toBe(
      "UNVERIFIED"
    );
    expect(result.evidence.evidenceState).toBe("INSUFFICIENT");
  });

  it("retains CONFLICTED evidence but does not let it establish sufficiency", async () => {
    const conflicted = provider(
      "PUBLIC_WEB",
      async () => ({
        status: "AVAILABLE",
        sourceType: "PUBLIC_WEB",
        facts: [makeFact("CONFLICTED")],
      })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [conflicted]
    );

    expect(result.evidence.facts).toHaveLength(1);
    expect(result.evidence.facts[0].verificationState).toBe(
      "CONFLICTED"
    );
    expect(result.evidence.evidenceState).toBe("INSUFFICIENT");
  });

  it("reports SUFFICIENT when settled evidence exists without source limitations", async () => {
    const available = provider(
      "INTERACT_PRODUCT_CATALOG",
      async () => ({
        status: "AVAILABLE",
        sourceType: "INTERACT_PRODUCT_CATALOG",
        facts: [makeFact("VERIFIED")],
      })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [available]
    );

    expect(result.evidence.facts).toHaveLength(1);
    expect(result.evidence.evidenceState).toBe("SUFFICIENT");
    expect(result.evidence.limitations).toEqual([]);
  });
  it("prefers retailer price over conflicting public-web price", async () => {
    const retailer = provider(
      "INTERACT_PRODUCT_CATALOG",
      async () => ({
        status: "AVAILABLE",
        sourceType: "INTERACT_PRODUCT_CATALOG",
        facts: [
          {
            ...makeFact("VERIFIED"),
            key: "price",
            label: "Price",
            value: "99.99",
            unit: "ZAR",
          },
        ],
      })
    );

    const publicWeb = provider(
      "PUBLIC_WEB",
      async () => ({
        status: "AVAILABLE",
        sourceType: "PUBLIC_WEB",
        facts: [
          {
            ...makeFact("SUPPORTED"),
            key: "price",
            label: "Price",
            value: "89.99",
            unit: "ZAR",
            source: {
              sourceType: "PUBLIC_WEB",
              sourceName: "Public Web",
              retrievedAt: "2026-09-25T12:00:00.000Z",
              identityMatched: true,
            },
          },
        ],
      })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [retailer, publicWeb]
    );

    expect(result.evidence.facts).toHaveLength(1);
    expect(result.evidence.facts[0]).toEqual(
      expect.objectContaining({
        key: "price",
        value: "99.99",
      })
    );
    expect(result.evidence.facts[0].source.sourceType).toBe(
      "INTERACT_PRODUCT_CATALOG"
    );
  });

  it("prefers manufacturer documentation for conflicting technical specification", async () => {
    const retailer = provider(
      "INTERACT_PRODUCT_CATALOG",
      async () => ({
        status: "AVAILABLE",
        sourceType: "INTERACT_PRODUCT_CATALOG",
        facts: [
          {
            ...makeFact("VERIFIED"),
            key: "capacity",
            label: "Capacity",
            value: "450",
            unit: "ml",
          },
        ],
      })
    );

    const manufacturer = provider(
      "MANUFACTURER_DOCUMENTATION",
      async () => ({
        status: "AVAILABLE",
        sourceType: "MANUFACTURER_DOCUMENTATION",
        facts: [
          {
            ...makeFact("SUPPORTED"),
            key: "capacity",
            label: "Capacity",
            value: "500",
            unit: "ml",
            source: {
              sourceType: "MANUFACTURER_DOCUMENTATION",
              sourceName: "Manufacturer Documentation",
              retrievedAt: "2026-09-25T12:00:00.000Z",
              identityMatched: true,
            },
          },
        ],
      })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [retailer, manufacturer]
    );

    expect(result.evidence.facts).toHaveLength(1);
    expect(result.evidence.facts[0]).toEqual(
      expect.objectContaining({
        key: "capacity",
        value: "500",
      })
    );
    expect(result.evidence.facts[0].source.sourceType).toBe(
      "MANUFACTURER_DOCUMENTATION"
    );
  });

  it("retains equally authoritative disagreement as CONFLICTED evidence", async () => {
    const retailerPim = provider(
      "RETAILER_PIM",
      async () => ({
        status: "AVAILABLE",
        sourceType: "RETAILER_PIM",
        facts: [
          {
            ...makeFact("SUPPORTED"),
            key: "price",
            label: "Price",
            value: "99.99",
            unit: "ZAR",
            source: {
              sourceType: "RETAILER_PIM",
              sourceName: "Retailer PIM",
              retrievedAt: "2026-09-25T12:00:00.000Z",
              identityMatched: true,
            },
          },
        ],
      })
    );

    const retailerApi = provider(
      "RETAILER_API",
      async () => ({
        status: "AVAILABLE",
        sourceType: "RETAILER_API",
        facts: [
          {
            ...makeFact("SUPPORTED"),
            key: "price",
            label: "Price",
            value: "109.99",
            unit: "ZAR",
            source: {
              sourceType: "RETAILER_API",
              sourceName: "Retailer API",
              retrievedAt: "2026-09-25T12:00:00.000Z",
              identityMatched: true,
            },
          },
        ],
      })
    );

    const result = await collectProductEvidence(
      identity,
      context,
      [retailerPim, retailerApi]
    );

    expect(result.evidence.facts).toHaveLength(2);

    expect(
      result.evidence.facts.every(
        (fact) =>
          fact.verificationState === "CONFLICTED" &&
          fact.hasConflict === true
      )
    ).toBe(true);

    expect(result.evidence.evidenceState).toBe("INSUFFICIENT");

    expect(result.evidence.limitations).toContain(
      "Conflicting evidence remains unresolved for price."
    );
  });

});
