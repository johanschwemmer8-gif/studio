import type {
  ProductEvidenceIdentity,
  ProductEvidenceSourceType,
} from "@/lib/schemas/product-evidence";

/**
 * One candidate source discovered during external product research.
 *
 * Discovery does NOT make the source authoritative and does NOT establish
 * any product fact. Candidate sources must pass identity verification and
 * evidence extraction before their claims may enter normalized evidence.
 */
export type ProductResearchGroundingSupport = {
  /**
   * Grounded generated segment only. This is support metadata and must not
   * itself be promoted directly into authoritative Product Evidence.
   */
  text?: string;

  /**
   * Indexes of ProductResearchCandidate records supporting this segment.
   */
  sourceIndexes: number[];
};

export type ProductResearchCandidate = {
  sourceType:
    | "MANUFACTURER"
    | "BRAND"
    | "MANUFACTURER_DOCUMENTATION"
    | "PUBLIC_PRODUCT_DATA"
    | "PUBLIC_WEB";

  sourceName: string;
  sourceUrl: string;

  /**
   * Search/discovery metadata only. It must never be promoted directly into
   * authoritative product evidence.
   */
  title?: string;
  snippet?: string;

  /**
   * Original grounding-chunk position returned by the research provider.
   * This preserves the source relationship used by grounding supports.
   */
  groundingIndex?: number;
};

export type ProductResearchGrounding = {
  supports: ProductResearchGroundingSupport[];
};

/**
 * Result of one research/discovery operation.
 *
 * Search failure is data, not an exception that should escape into Ari.
 */
export type ProductResearchResult =
  | {
      status: "AVAILABLE";
      candidates: ProductResearchCandidate[];
      grounding?: ProductResearchGrounding;
    }
  | {
      status: "UNAVAILABLE";
      reason: string;
    }
  | {
      status: "FAILED";
      reason: string;
    };

/**
 * Provider-neutral external product research boundary.
 *
 * Implementations may later use search APIs, grounded-search providers,
 * retailer integrations, or other eligible discovery mechanisms.
 *
 * Compare, Suitability, Explore Product and Ari must depend on this
 * contract rather than on a specific search vendor.
 */
export interface ProductResearchProvider {
  readonly providerName: string;

  research(
    identity: ProductEvidenceIdentity,
    signal?: AbortSignal
  ): Promise<ProductResearchResult>;
}

/**
 * Maps an eligible research candidate class onto the corresponding
 * normalized Product Evidence source type.
 *
 * This function deliberately performs no authority ranking.
 */
export function researchCandidateSourceType(
  candidate: ProductResearchCandidate
): ProductEvidenceSourceType {
  return candidate.sourceType;
}
