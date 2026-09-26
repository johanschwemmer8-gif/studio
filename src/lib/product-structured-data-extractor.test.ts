import { extractProductStructuredData } from "@/lib/product-structured-data-extractor";
import { bridgeProductResearchToEvidence } from "@/lib/product-research-evidence-bridge";

const html = (json: unknown) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(json)}</script></head></html>`;

describe("extractProductStructuredData", () => {
  it("extracts Product identity and explicit structured claims", () => {
    const result = extractProductStructuredData(
      html({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Test Product",
        brand: { "@type": "Brand", name: "Test Brand" },
        gtin14: "00012345678912",
        sku: "SKU-123",
        mpn: "MPN-456",
        size: "500 ml",
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Material",
            value: "Stainless steel",
          },
        ],
        offers: {
          "@type": "Offer",
          price: "199.99",
          priceCurrency: "ZAR",
        },
      }),
      "text/html"
    )[0];

    expect(result.identityEvidence).toEqual({
      observedGtins: ["00012345678912"],
      observedProductName: "Test Product",
      observedBrandName: "Test Brand",
    });

    expect(result.claims).toEqual(
      expect.arrayContaining([
        { key: "brand", label: "Brand", value: "Test Brand" },
        { key: "sku", label: "SKU", value: "SKU-123" },
        { key: "mpn", label: "MPN", value: "MPN-456" },
        { key: "size", label: "Size", value: "500 ml" },
        {
          key: "property_material",
          label: "Material",
          value: "Stainless steel",
        },
      ])
    );

    expect(result.claims.some((claim) => claim.key === "price")).toBe(false);
  });

  it("supports Product objects inside @graph", () => {
    const result = extractProductStructuredData(
      html({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", name: "Example" },
          {
            "@type": "Product",
            name: "Graph Product",
            gtin: "00012345678912",
          },
        ],
      }),
      "text/html"
    )[0];

    expect(result.identityEvidence.observedGtins).toEqual([
      "00012345678912",
    ]);
    expect(result.identityEvidence.observedProductName).toBe(
      "Graph Product"
    );
  });

  it("supports direct JSON-LD content", () => {
    const result = extractProductStructuredData(
      JSON.stringify({
        "@type": "Product",
        name: "JSON Product",
        gtin14: "00012345678912",
      }),
      "application/ld+json"
    )[0];

    expect(result.identityEvidence.observedGtins).toEqual([
      "00012345678912",
    ]);
  });

  it("fails closed on malformed structured data", () => {
    const result = extractProductStructuredData(
      '<script type="application/ld+json">{broken</script>',
      "text/html"
    );

    expect(result).toEqual([]);
  });

  it("keeps multiple Product nodes isolated", () => {
    const results = extractProductStructuredData(
      html({
        "@context": "https://schema.org",
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
      }),
      "text/html"
    );

    expect(results).toHaveLength(2);

    expect(results[0].identityEvidence.observedGtins).toEqual([
      "00012345678912",
    ]);
    expect(results[0].claims).toEqual(
      expect.arrayContaining([
        {
          key: "property_material",
          label: "Material",
          value: "Steel",
        },
      ])
    );
    expect(
      results[0].claims.some((claim) => claim.value === "Leather")
    ).toBe(false);

    expect(results[1].identityEvidence.observedGtins).toEqual([
      "05449000000996",
    ]);
    expect(results[1].claims).toEqual(
      expect.arrayContaining([
        {
          key: "property_material",
          label: "Material",
          value: "Leather",
        },
      ])
    );
    expect(
      results[1].claims.some((claim) => claim.value === "Steel")
    ).toBe(false);
  });

  it("feeds the existing exact-GTIN evidence gate without bypassing it", () => {
    const extracted = extractProductStructuredData(
      html({
        "@type": "Product",
        name: "Test Product",
        brand: "Test Brand",
        gtin14: "00012345678912",
        additionalProperty: {
          "@type": "PropertyValue",
          name: "Voltage",
          value: "230",
          unitText: "V",
        },
      }),
      "text/html"
    )[0];

    const admitted = bridgeProductResearchToEvidence(
      {
        gtin: "00012345678912",
        productName: "Test Product",
        brandName: "Test Brand",
      },
      {
        candidate: {
          sourceType: "MANUFACTURER_DOCUMENTATION",
          sourceName: "Manufacturer",
          sourceUrl: "https://example.com/product",
        },
        ...extracted,
        retrievedAt: "2026-09-26T10:00:00.000Z",
      }
    );

    expect(admitted.status).toBe("ADMITTED");

    const rejected = bridgeProductResearchToEvidence(
      {
        gtin: "5449000000996",
        productName: "Another Product",
        brandName: "Another Brand",
      },
      {
        candidate: {
          sourceType: "MANUFACTURER_DOCUMENTATION",
          sourceName: "Manufacturer",
          sourceUrl: "https://example.com/product",
        },
        ...extracted,
        retrievedAt: "2026-09-26T10:00:00.000Z",
      }
    );

    expect(rejected.status).toBe("REJECTED");
    if (rejected.status === "REJECTED") {
      expect(rejected.identityVerification.status).toBe("MISMATCH");
      expect(rejected.reason).toBe("IDENTITY_NOT_EXACT");
    }
  });
});
