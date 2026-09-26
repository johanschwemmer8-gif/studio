jest.mock("@/ai/genkit", () => ({
  ai: {
    generate: jest.fn(),
  },
}));

import { ai } from "@/ai/genkit";
import {
  googleSearchProductResearchProvider,
} from "@/lib/product-research-providers/google-search";

const generateMock = ai.generate as jest.Mock;

const identity = {
  gtin: "00012345678912",
  productName: "Test Product",
  brandName: "Test Brand",
};

describe("googleSearchProductResearchProvider", () => {
  beforeEach(() => {
    generateMock.mockReset();
  });

  it("converts grounded HTTPS web sources into research candidates", async () => {
    generateMock.mockResolvedValue({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://manufacturer.example/product",
                  title: "Official Product Page",
                },
              },
              {
                web: {
                  uri: "https://manufacturer.example/manual.pdf",
                  title: "Product Manual",
                },
              },
            ],
          },
        },
      ],
    });

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result.status).toBe("AVAILABLE");

    if (result.status === "AVAILABLE") {
      expect(result.candidates).toHaveLength(2);

      expect(result.candidates[0]).toEqual(
        expect.objectContaining({
          sourceType: "PUBLIC_WEB",
          sourceName: "Official Product Page",
          sourceUrl: "https://manufacturer.example/product",
        })
      );

      expect(result.candidates[1]).toEqual(
        expect.objectContaining({
          sourceType: "MANUFACTURER_DOCUMENTATION",
          sourceName: "Product Manual",
          sourceUrl: "https://manufacturer.example/manual.pdf",
        })
      );
    }
  });

  it("deduplicates identical grounded source URLs", async () => {
    generateMock.mockResolvedValue({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://example.com/product",
                  title: "Product",
                },
              },
              {
                web: {
                  uri: "https://example.com/product",
                  title: "Product Duplicate",
                },
              },
            ],
          },
        },
      ],
    });

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result.status).toBe("AVAILABLE");

    if (result.status === "AVAILABLE") {
      expect(result.candidates).toHaveLength(1);
    }
  });

  it("rejects non-HTTPS and malformed grounded URLs", async () => {
    generateMock.mockResolvedValue({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "http://example.com/product",
                  title: "HTTP Product",
                },
              },
              {
                web: {
                  uri: "not-a-url",
                  title: "Malformed",
                },
              },
            ],
          },
        },
      ],
    });

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result).toEqual({
      status: "UNAVAILABLE",
      reason:
        "Google Search grounding returned no usable HTTPS product-source candidates.",
    });
  });

  it("preserves grounding support relationships to original chunk indexes", async () => {
    generateMock.mockResolvedValue({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://manufacturer.example/product",
                  title: "Official Product",
                },
              },
              {
                web: {
                  uri: "http://invalid.example/product",
                  title: "Rejected HTTP Source",
                },
              },
              {
                web: {
                  uri: "https://data.example/product",
                  title: "Product Data",
                },
              },
            ],
            groundingSupports: [
              {
                segment: {
                  text: "Supported generated segment.",
                },
                groundingChunkIndices: [0, 2],
              },
            ],
          },
        },
      ],
    });

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result.status).toBe("AVAILABLE");

    if (result.status === "AVAILABLE") {
      expect(result.candidates).toEqual([
        expect.objectContaining({
          groundingIndex: 0,
          sourceUrl: "https://manufacturer.example/product",
        }),
        expect.objectContaining({
          groundingIndex: 2,
          sourceUrl: "https://data.example/product",
        }),
      ]);

      expect(result.grounding).toEqual({
        supports: [
          {
            text: "Supported generated segment.",
            sourceIndexes: [0, 2],
          },
        ],
      });
    }
  });

  it("removes rejected and out-of-range chunks from grounding supports", async () => {
    generateMock.mockResolvedValue({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://example.com/product",
                  title: "Valid Product",
                },
              },
              {
                web: {
                  uri: "http://example.com/rejected",
                  title: "Rejected Product",
                },
              },
            ],
            groundingSupports: [
              {
                segment: {
                  text: "Mixed support.",
                },
                groundingChunkIndices: [0, 1, 99, -1],
              },
            ],
          },
        },
      ],
    });

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result.status).toBe("AVAILABLE");

    if (result.status === "AVAILABLE") {
      expect(result.grounding?.supports).toEqual([
        {
          text: "Mixed support.",
          sourceIndexes: [0],
        },
      ]);
    }
  });

  it("does not remap a discarded duplicate chunk onto the retained candidate", async () => {
    generateMock.mockResolvedValue({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://example.com/product",
                  title: "Original",
                },
              },
              {
                web: {
                  uri: "https://example.com/product",
                  title: "Duplicate",
                },
              },
            ],
            groundingSupports: [
              {
                segment: {
                  text: "Duplicate-only support.",
                },
                groundingChunkIndices: [1],
              },
            ],
          },
        },
      ],
    });

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result.status).toBe("AVAILABLE");

    if (result.status === "AVAILABLE") {
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].groundingIndex).toBe(0);
      expect(result.grounding).toBeUndefined();
    }
  });

  it("keeps grounded segment text as metadata rather than Product Evidence", async () => {
    generateMock.mockResolvedValue({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://example.com/product",
                  title: "Product Source",
                },
              },
            ],
            groundingSupports: [
              {
                segment: {
                  text: "The product weighs 500 grams.",
                },
                groundingChunkIndices: [0],
              },
            ],
          },
        },
      ],
    });

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result.status).toBe("AVAILABLE");

    if (result.status === "AVAILABLE") {
      expect(result.grounding?.supports[0]?.text).toBe(
        "The product weighs 500 grams."
      );

      expect(result.candidates[0]).not.toHaveProperty("facts");
      expect(result.candidates[0]).not.toHaveProperty("claims");
      expect(result).not.toHaveProperty("facts");
    }
  });

  it("returns UNAVAILABLE when grounding contains no source candidates", async () => {
    generateMock.mockResolvedValue({
      candidates: [
        {
          groundingMetadata: {
            webSearchQueries: [
              "GTIN 00012345678912 Test Product Test Brand",
            ],
          },
        },
      ],
    });

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result.status).toBe("UNAVAILABLE");
  });

  it("contains Google Search grounding failure", async () => {
    generateMock.mockRejectedValue(
      new Error("Grounding unavailable")
    );

    const result =
      await googleSearchProductResearchProvider.research(identity);

    expect(result).toEqual({
      status: "FAILED",
      reason: "Grounding unavailable",
    });
  });

  it("fails closed when already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const result =
      await googleSearchProductResearchProvider.research(
        identity,
        controller.signal
      );

    expect(result).toEqual({
      status: "FAILED",
      reason: "Research request was aborted.",
    });

    expect(generateMock).not.toHaveBeenCalled();
  });

  it("requests Google Search grounding without treating generated prose as evidence", async () => {
    generateMock.mockResolvedValue({
      text: "Generated model prose that must not become Product Evidence.",
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://example.com/product",
                  title: "Product Source",
                },
              },
            ],
          },
        },
      ],
    });

    await googleSearchProductResearchProvider.research(identity);

    expect(generateMock).toHaveBeenCalledTimes(1);

    const request = generateMock.mock.calls[0][0];

    expect(request.model).toBe("googleai/gemini-2.5-flash");
    expect(request.config).toEqual(
      expect.objectContaining({
        googleSearchRetrieval: true,
        temperature: 0,
      })
    );
  });
});
