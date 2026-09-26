import type {
  ProductEvidenceProvider,
  ProductEvidenceSourceResult,
} from "@/lib/product-evidence-orchestrator";
import type {
  ProductResearchCandidate,
  ProductResearchProvider,
} from "@/lib/product-research-provider";
import type {
  ProductSourceRetriever,
} from "@/lib/product-source-retriever";
import type {
  ProductEvidenceIdentity,
} from "@/lib/schemas/product-evidence";
import {
  retrieveProductResearchSourceEvidence,
} from "@/lib/product-research-source-evidence";

export type ExternalResearchEvidenceSourceType =
  ProductResearchCandidate["sourceType"];

export type ExternalResearchEvidenceProviderOptions = {
  sourceType: ExternalResearchEvidenceSourceType;
  researchProvider: ProductResearchProvider;
  sourceRetriever?: ProductSourceRetriever;
};

export function createExternalResearchEvidenceProvider(
  options: ExternalResearchEvidenceProviderOptions
): ProductEvidenceProvider {
  return {
    sourceType: options.sourceType,

    async collect(
      identity: ProductEvidenceIdentity
    ): Promise<ProductEvidenceSourceResult> {
      let research;

      try {
        research = await options.researchProvider.research(identity);
      } catch (error) {
        return {
          status: "FAILED",
          sourceType: options.sourceType,
          reason:
            error instanceof Error
              ? error.message
              : "External product research failed.",
        };
      }

      if (research.status !== "AVAILABLE") {
        return {
          status: research.status,
          sourceType: options.sourceType,
          reason: research.reason,
        };
      }

      const candidates = research.candidates.filter(
        (candidate) =>
          candidate.sourceType === options.sourceType
      );

      if (candidates.length === 0) {
        return {
          status: "UNAVAILABLE",
          sourceType: options.sourceType,
          reason:
            "Research returned no candidates for this evidence source type.",
        };
      }

      const facts = [];
      const limitations: string[] = [];
      let failedCandidateCount = 0;

      for (const candidate of candidates) {
        try {
          const result =
            await retrieveProductResearchSourceEvidence(
              identity,
              candidate,
              {
                ...(options.sourceRetriever
                  ? { retriever: options.sourceRetriever }
                  : {}),
              }
            );

          if (result.status === "ADMITTED") {
            facts.push(...result.facts);
            continue;
          }

          if (result.status === "RETRIEVAL_FAILED") {
            failedCandidateCount += 1;
          }

          limitations.push(
            `${candidate.sourceName}: ${result.reason}`
          );
        } catch (error) {
          failedCandidateCount += 1;
          limitations.push(
            `${candidate.sourceName}: ${
              error instanceof Error
                ? error.message
                : "Candidate evidence retrieval failed."
            }`
          );
        }
      }

      if (facts.length > 0) {
        return {
          status: "AVAILABLE",
          sourceType: options.sourceType,
          facts,
          ...(limitations.length > 0
            ? { limitations }
            : {}),
        };
      }

      if (failedCandidateCount === candidates.length) {
        return {
          status: "FAILED",
          sourceType: options.sourceType,
          reason:
            limitations.join(" | ") ||
            "All candidate evidence retrievals failed.",
        };
      }

      return {
        status: "UNAVAILABLE",
        sourceType: options.sourceType,
        reason:
          limitations.join(" | ") ||
          "No candidate produced admissible product evidence.",
      };
    },
  };
}
