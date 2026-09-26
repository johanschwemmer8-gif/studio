import {
  retrieveProductResearchSourceEvidence,
} from "@/lib/product-research-source-evidence";
import type {
  ProductSourceRetriever,
} from "@/lib/product-source-retriever";

const candidate = {
  sourceType: "MANUFACTURER_DOCUMENTATION" as const,
  sourceName: "Manufacturer",
  sourceUrl: "https://example.com/product",
};

const identity = {
  gtin: "00012345678912",
  productName: "Product A",
  brandName: "Test Brand",
};

const html = (value: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(value)}</script>`;

function availableRetriever(
  content: string
): ProductSourceRetriever {
  return {
    async retrieve() {
      return {
        status: "AVAILABLE" as const,
        requestedUrl: candidate.sourceUrl,
        finalUrl: "https://example.com/final-product",
        retrievedAt: "2026-09-26T10:00:00.000Z",
        contentType: "text/html",
        content,
      };
    },
  };
}

describe("retrieveProductResearchSourceEvidence", () => {
  it("admits facts from an exact-GTIN Product observation", async () => {
    const result = await retrieveProductResearchSourceEvidence(
      identity,
      candidate,
      {
        retriever: availableRetriever(
          html({
            "@type": "Product",
            name: "Product A",
            brand: "Test Brand",
            gtin14: "00012345678912",
            additionalProperty: {
              "@type": "PropertyValue",
              name: "Material",
              value: "Steel",
            },
          })
        ),
      }
    );

    expect(result.status).toBe("ADMITTED");

    if (result.status === "ADMITTED") {
      expect(result.facts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "property_material",
            value: "Steel",
            verificationState: "SUPPORTED",
          }),
        ])
      );

      expect(
        result.facts.every(
          (fact) =>
            fact.source.sourceUrl ===
            "https://example.com/final-product"
        )
      ).toBe(true);
    }
  });

  it("does not admit claims from a non-matching Product node", async () => {
    const result = await retrieveProductResearchSourceEvidence(
      identity,
      candidate,
      {
        retriever: availableRetriever(
          html({
            "@graph": [
              {
                "@type": "Product",
                name: "Product A",
                gtin14: "00012345678912",
                additionalProperty: {
                  "@type": "PropertyValue",
                  name: "Material",
                  value: "Steel",
                },
              },
              {
                "@type": "Product",
                name: "Product B",
                gtin14: "05449000000996",
                additionalProperty: {
                  "@type": "PropertyValue",
                  name: "Material",
                  value: "Leather",
                },
              },
            ],
          })
        ),
      }
    );

    expect(result.status).toBe("ADMITTED");

    if (result.status === "ADMITTED") {
      expect(
        result.facts.some((fact) => fact.value === "Steel")
      ).toBe(true);

      expect(
        result.facts.some((fact) => fact.value === "Leather")
      ).toBe(false);
    }
  });

  it("contains retrieval failure as data", async () => {
    const retriever: ProductSourceRetriever = {
      async retrieve() {
        return {
          status: "FAILED",
          reason: "Network failure",
        };
      },
    };

    const result = await retrieveProductResearchSourceEvidence(
      identity,
      candidate,
      { retriever }
    );

    expect(result).toEqual({
      status: "RETRIEVAL_FAILED",
      reason: "Network failure",
    });
  });

  it("rejects retrieved Product data without an exact GTIN match", async () => {
    const result = await retrieveProductResearchSourceEvidence(
      identity,
      candidate,
      {
        retriever: availableRetriever(
          html({
            "@type": "Product",
            name: "Different Product",
            brand: "Different Brand",
            gtin14: "05449000000996",
            additionalProperty: {
              "@type": "PropertyValue",
              name: "Material",
              value: "Leather",
            },
          })
        ),
      }
    );

    expect(result.status).toBe("NO_EXACT_PRODUCT_MATCH");
  });
});
