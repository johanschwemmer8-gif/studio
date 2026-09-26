import type { ProductEvidenceFact } from "@/lib/schemas/product-evidence";
import type {
  ProductResearchCandidate,
} from "@/lib/product-research-provider";
import type {
  ProductEvidenceIdentity,
} from "@/lib/schemas/product-evidence";
import {
  bridgeProductResearchToEvidence,
} from "@/lib/product-research-evidence-bridge";
import {
  extractProductStructuredData,
} from "@/lib/product-structured-data-extractor";
import {
  createProductSourceRetriever,
  type ProductSourceRetriever,
} from "@/lib/product-source-retriever";

export type ProductResearchSourceEvidenceResult =
  | {
      status: "ADMITTED";
      facts: ProductEvidenceFact[];
    }
  | {
      status:
        | "RETRIEVAL_UNAVAILABLE"
        | "RETRIEVAL_FAILED"
        | "NO_STRUCTURED_PRODUCT_DATA"
        | "NO_EXACT_PRODUCT_MATCH";
      reason: string;
    };

export type ProductResearchSourceEvidenceOptions = {
  retriever?: ProductSourceRetriever;
};

export async function retrieveProductResearchSourceEvidence(
  identity: ProductEvidenceIdentity,
  candidate: ProductResearchCandidate,
  options: ProductResearchSourceEvidenceOptions = {},
  signal?: AbortSignal
): Promise<ProductResearchSourceEvidenceResult> {
  const retriever =
    options.retriever ?? createProductSourceRetriever();

  const retrieval = await retriever.retrieve(
    candidate.sourceUrl,
    signal
  );

  if (retrieval.status !== "AVAILABLE") {
    return {
      status:
        retrieval.status === "UNAVAILABLE"
          ? "RETRIEVAL_UNAVAILABLE"
          : "RETRIEVAL_FAILED",
      reason: retrieval.reason,
    };
  }

  const observations = extractProductStructuredData(
    retrieval.content,
    retrieval.contentType
  );

  if (observations.length === 0) {
    return {
      status: "NO_STRUCTURED_PRODUCT_DATA",
      reason:
        "Retrieved source contained no usable structured Product data.",
    };
  }

  const admittedFacts: ProductEvidenceFact[] = [];

  for (const observation of observations) {
    const result = bridgeProductResearchToEvidence(
      identity,
      {
        candidate: {
          ...candidate,
          sourceUrl: retrieval.finalUrl,
        },
        ...observation,
        retrievedAt: retrieval.retrievedAt,
      }
    );

    if (result.status === "ADMITTED") {
      admittedFacts.push(...result.facts);
    }
  }

  if (admittedFacts.length === 0) {
    return {
      status: "NO_EXACT_PRODUCT_MATCH",
      reason:
        "No structured Product observation passed exact identity verification with usable claims.",
    };
  }

  return {
    status: "ADMITTED",
    facts: admittedFacts,
  };
}
