import {
  createExternalResearchEvidenceProvider,
} from "@/lib/product-evidence-providers/external-research";
import {
  collectProductEvidence,
} from "@/lib/product-evidence-orchestrator";
import type {
  ProductResearchProvider,
} from "@/lib/product-research-provider";
import type {
  ProductSourceRetriever,
} from "@/lib/product-source-retriever";

const identity = {
  gtin: "00012345678912",
  productName: "Product A",
  brandName: "Test Brand",
};

describe("external research evidence provider", () => {
  it("admits exact-GTIN evidence through the orchestrator", async () => {
    const researchProvider: ProductResearchProvider = {
      providerName: "Test Research",

      async research() {
        return {
          status: "AVAILABLE",
          candidates: [
            {
              sourceType: "MANUFACTURER_DOCUMENTATION",
              sourceName: "Manufacturer Docs",
              sourceUrl: "https://example.com/product-a",
            },
          ],
        };
      },
    };

    const sourceRetriever: ProductSourceRetriever = {
      async retrieve(sourceUrl) {
        return {
          status: "AVAILABLE",
          requestedUrl: sourceUrl,
          finalUrl: sourceUrl,
          retrievedAt: "2026-09-26T10:00:00.000Z",
          contentType: "application/ld+json",
          content: JSON.stringify({
            "@type": "Product",
            name: "Product A",
            brand: "Test Brand",
            gtin14: "00012345678912",
            additionalProperty: {
              "@type": "PropertyValue",
              name: "Material",
              value: "Steel",
            },
          }),
        };
      },
    };

    const provider =
      createExternalResearchEvidenceProvider({
        sourceType: "MANUFACTURER_DOCUMENTATION",
        researchProvider,
        sourceRetriever,
      });

    const result = await collectProductEvidence(
      identity,
      { retailerId: "retailer-1" },
      [provider]
    );

    expect(result.evidence.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "property_material",
          value: "Steel",
          verificationState: "SUPPORTED",
          source: expect.objectContaining({
            sourceType: "MANUFACTURER_DOCUMENTATION",
          }),
        }),
      ])
    );

    expect(result.evidence.evidenceState).not.toBe(
      "INSUFFICIENT"
    );
  });

  it("keeps valid evidence when another candidate fails", async () => {
    const researchProvider: ProductResearchProvider = {
      providerName: "Test Research",

      async research() {
        return {
          status: "AVAILABLE",
          candidates: [
            {
              sourceType: "MANUFACTURER",
              sourceName: "Broken Source",
              sourceUrl: "https://example.com/broken",
            },
            {
              sourceType: "MANUFACTURER",
              sourceName: "Valid Source",
              sourceUrl: "https://example.com/valid",
            },
          ],
        };
      },
    };

    const sourceRetriever: ProductSourceRetriever = {
      async retrieve(sourceUrl) {
        if (sourceUrl.endsWith("/broken")) {
          return {
            status: "FAILED",
            reason: "Network failure",
          };
        }

        return {
          status: "AVAILABLE",
          requestedUrl: sourceUrl,
          finalUrl: sourceUrl,
          retrievedAt: "2026-09-26T10:00:00.000Z",
          contentType: "application/ld+json",
          content: JSON.stringify({
            "@type": "Product",
            name: "Product A",
            gtin14: "00012345678912",
            additionalProperty: {
              "@type": "PropertyValue",
              name: "Material",
              value: "Steel",
            },
          }),
        };
      },
    };

    const provider =
      createExternalResearchEvidenceProvider({
        sourceType: "MANUFACTURER",
        researchProvider,
        sourceRetriever,
      });

    const result = await provider.collect(
      identity,
      { retailerId: "retailer-1" }
    );

    expect(result.status).toBe("AVAILABLE");

    if (result.status === "AVAILABLE") {
      expect(
        result.facts.some((fact) => fact.value === "Steel")
      ).toBe(true);

      expect(result.limitations).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Broken Source"),
        ])
      );
    }
  });

  it("ignores candidates belonging to another source type", async () => {
    const researchProvider: ProductResearchProvider = {
      providerName: "Test Research",

      async research() {
        return {
          status: "AVAILABLE",
          candidates: [
            {
              sourceType: "PUBLIC_WEB",
              sourceName: "Public Site",
              sourceUrl: "https://example.com/public",
            },
          ],
        };
      },
    };

    let retrievalCalled = false;

    const sourceRetriever: ProductSourceRetriever = {
      async retrieve() {
        retrievalCalled = true;
        return {
          status: "FAILED",
          reason: "Should not be called",
        };
      },
    };

    const provider =
      createExternalResearchEvidenceProvider({
        sourceType: "MANUFACTURER",
        researchProvider,
        sourceRetriever,
      });

    const result = await provider.collect(
      identity,
      { retailerId: "retailer-1" }
    );

    expect(result.status).toBe("UNAVAILABLE");
    expect(retrievalCalled).toBe(false);
  });
});
