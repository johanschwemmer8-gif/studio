import { ai } from "@/ai/genkit";

import type {
  ProductEvidenceIdentity,
} from "@/lib/schemas/product-evidence";

import type {
  ProductResearchCandidate,
  ProductResearchProvider,
  ProductResearchResult,
} from "@/lib/product-research-provider";

type GroundingWeb = {
  uri?: string;
  title?: string;
};

type GroundingChunk = {
  web?: GroundingWeb;
};

type GroundingSupport = {
  segment?: {
    text?: string;
  };
  groundingChunkIndices?: number[];
};

type GroundingMetadata = {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  webSearchQueries?: string[];
};

type CandidateMetadata = {
  groundingMetadata?: GroundingMetadata;
};

function classifySource(
  url: string,
  title?: string
): ProductResearchCandidate["sourceType"] {
  const text = `${url} ${title ?? ""}`.toLocaleLowerCase();

  if (
    text.includes("manual") ||
    text.includes("datasheet") ||
    text.includes("data-sheet") ||
    text.includes("specification") ||
    text.includes("spec-sheet")
  ) {
    return "MANUFACTURER_DOCUMENTATION";
  }

  return "PUBLIC_WEB";
}

function candidateFromGroundingChunk(
  chunk: GroundingChunk
): ProductResearchCandidate | null {
  const uri = chunk.web?.uri?.trim();

  if (!uri) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") {
    return null;
  }

  const title = chunk.web?.title?.trim();

  return {
    sourceType: classifySource(uri, title),
    sourceName:
      title ||
      parsed.hostname,
    sourceUrl: parsed.toString(),
    ...(title ? { title } : {}),
  };
}

function extractGroundingMetadata(
  response: unknown
): GroundingMetadata | undefined {
  if (
    typeof response !== "object" ||
    response === null
  ) {
    return undefined;
  }

  type GroundingCandidate = {
    custom?: CandidateMetadata;
    metadata?: CandidateMetadata;
    groundingMetadata?: GroundingMetadata;
  };

  const value = response as {
    candidates?: GroundingCandidate[];
    custom?: {
      candidates?: GroundingCandidate[];
    };
    raw?: {
      candidates?: GroundingCandidate[];
    };
  };

  const candidate =
    value.custom?.candidates?.[0] ??
    value.raw?.candidates?.[0] ??
    value.candidates?.[0];

  return (
    candidate?.groundingMetadata ??
    candidate?.metadata?.groundingMetadata ??
    candidate?.custom?.groundingMetadata
  );
}

/**
 * Public product discovery using the existing Google AI / Gemini
 * configuration with Google Search grounding.
 *
 * IMPORTANT:
 * - This provider discovers candidate sources only.
 * - Grounded model prose is NOT Product Evidence.
 * - Search titles/snippets are NOT Product Evidence.
 * - Candidates must still pass retrieval, exact product identity
 *   verification, claim extraction, provenance and authority/conflict
 *   resolution before Ari may rely on their claims.
 */
export const googleSearchProductResearchProvider: ProductResearchProvider = {
  providerName: "Google Search Grounding",

  async research(
    identity: ProductEvidenceIdentity,
    signal?: AbortSignal
  ): Promise<ProductResearchResult> {
    if (signal?.aborted) {
      return {
        status: "FAILED",
        reason: "Research request was aborted.",
      };
    }

    const identityTerms = [
      `GTIN ${identity.gtin}`,
      identity.productName,
      identity.brandName,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const response = await ai.generate({
        model: "googleai/gemini-2.5-flash",
        prompt: [
          "Find public web sources for this exact retail product.",
          "Prioritize official manufacturer or brand product pages,",
          "official manuals/specification documents, and credible",
          "product-data sources.",
          "Do not treat similar products as the same product.",
          "",
          `Product identity: ${identityTerms}`,
        ].join("\n"),
        config: {
          googleSearchRetrieval: true,
          temperature: 0,
        },
      });

      if (signal?.aborted) {
        return {
          status: "FAILED",
          reason: "Research request was aborted.",
        };
      }

      const metadata = extractGroundingMetadata(response);
      const chunks = metadata?.groundingChunks ?? [];

      const candidates = chunks
        .map((chunk, groundingIndex) => {
          const candidate = candidateFromGroundingChunk(chunk);

          return candidate
            ? {
                ...candidate,
                groundingIndex,
              }
            : null;
        })
        .filter(
          (candidate): candidate is NonNullable<typeof candidate> =>
            candidate !== null
        );

      const uniqueCandidates = Array.from(
        candidates.reduce(
          (byUrl, candidate) => {
            if (!byUrl.has(candidate.sourceUrl)) {
              byUrl.set(candidate.sourceUrl, candidate);
            }

            return byUrl;
          },
          new Map<string, (typeof candidates)[number]>()
        ).values()
      );

      const admittedGroundingIndexes = new Set(
        uniqueCandidates
          .map((candidate) => candidate.groundingIndex)
          .filter(
            (index): index is number =>
              typeof index === "number"
          )
      );

      const supports = (metadata?.groundingSupports ?? [])
        .map((support) => {
          const text = support.segment?.text?.trim();

          const sourceIndexes = Array.from(
            new Set(
              (support.groundingChunkIndices ?? []).filter(
                (index) =>
                  Number.isInteger(index) &&
                  index >= 0 &&
                  admittedGroundingIndexes.has(index)
              )
            )
          );

          if (sourceIndexes.length === 0) {
            return null;
          }

          return {
            ...(text ? { text } : {}),
            sourceIndexes,
          };
        })
        .filter(
          (
            support
          ): support is {
            text?: string;
            sourceIndexes: number[];
          } => support !== null
        );

      if (uniqueCandidates.length === 0) {
        return {
          status: "UNAVAILABLE",
          reason:
            "Google Search grounding returned no usable HTTPS product-source candidates.",
        };
      }

      return {
        status: "AVAILABLE",
        candidates: uniqueCandidates,
        ...(supports.length > 0
          ? {
              grounding: {
                supports,
              },
            }
          : {}),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown Google Search grounding failure.";

      return {
        status: "FAILED",
        reason: message,
      };
    }
  },
};
