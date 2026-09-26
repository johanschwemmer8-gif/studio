import {
  createProductionProductEvidenceProviders,
} from "@/lib/product-evidence-providers/production-product-evidence";
import type {
  ProductResearchProvider,
} from "@/lib/product-research-provider";
import type {
  ProductSourceRetriever,
} from "@/lib/product-source-retriever";

describe("production product evidence provider composition", () => {
  it("shares one research operation across all external source-type providers", async () => {
    let researchCalls = 0;

    const researchProvider: ProductResearchProvider = {
      providerName: "Test Research",

      async research() {
        researchCalls += 1;

        return {
          status: "AVAILABLE",
          candidates: [
            {
              sourceType: "MANUFACTURER",
              sourceName: "Manufacturer",
              sourceUrl: "https://example.com/manufacturer",
            },
            {
              sourceType: "PUBLIC_WEB",
              sourceName: "Public Web",
              sourceUrl: "https://example.com/public",
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

    const providers =
      createProductionProductEvidenceProviders({
        researchProvider,
        sourceRetriever,
      });

    const externalProviders = providers.filter(
      (provider) =>
        provider.sourceType !== "INTERACT_PRODUCT_CATALOG"
    );

    for (const provider of externalProviders) {
      await provider.collect(
        {
          gtin: "00012345678912",
          productName: "Product A",
        },
        {
          retailerId: "retailer-1",
        }
      );
    }

    expect(externalProviders).toHaveLength(5);
    expect(researchCalls).toBe(1);
  });

  it("does not share discovery across different product identities", async () => {
    let researchCalls = 0;

    const researchProvider: ProductResearchProvider = {
      providerName: "Test Research",

      async research() {
        researchCalls += 1;

        return {
          status: "UNAVAILABLE",
          reason: "No candidates",
        };
      },
    };

    const providers =
      createProductionProductEvidenceProviders({
        researchProvider,
      });

    const externalProvider = providers.find(
      (provider) =>
        provider.sourceType === "PUBLIC_WEB"
    );

    expect(externalProvider).toBeDefined();

    await externalProvider!.collect(
      {
        gtin: "00012345678912",
        productName: "Product A",
      },
      {
        retailerId: "retailer-1",
      }
    );

    await externalProvider!.collect(
      {
        gtin: "00012345678913",
        productName: "Product B",
      },
      {
        retailerId: "retailer-1",
      }
    );

    expect(researchCalls).toBe(2);
  });
});
