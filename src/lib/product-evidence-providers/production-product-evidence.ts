import {
  InteractProductCatalogEvidenceProvider,
} from "@/lib/product-evidence-providers/interact-product-catalog";
import {
  createExternalResearchEvidenceProvider,
  type ExternalResearchEvidenceSourceType,
} from "@/lib/product-evidence-providers/external-research";

import type {
  ProductEvidenceProvider,
} from "@/lib/product-evidence-orchestrator";
import type {
  ProductResearchProvider,
  ProductResearchResult,
} from "@/lib/product-research-provider";
import type {
  ProductEvidenceIdentity,
} from "@/lib/schemas/product-evidence";
import type {
  ProductSourceRetriever,
} from "@/lib/product-source-retriever";

const EXTERNAL_SOURCE_TYPES: ExternalResearchEvidenceSourceType[] = [
  "MANUFACTURER",
  "BRAND",
  "MANUFACTURER_DOCUMENTATION",
  "PUBLIC_PRODUCT_DATA",
  "PUBLIC_WEB",
];

export type ProductionProductEvidenceProviderOptions = {
  researchProvider?: ProductResearchProvider;
  sourceRetriever?: ProductSourceRetriever;
};

function createRequestScopedResearchProvider(
  provider: ProductResearchProvider
): ProductResearchProvider {
  let researchPromise: Promise<ProductResearchResult> | null = null;
  let researchIdentityKey: string | null = null;

  return {
    providerName: provider.providerName,

    research(
      identity: ProductEvidenceIdentity,
      signal?: AbortSignal
    ): Promise<ProductResearchResult> {
      const identityKey = identity.gtin;

      if (
        researchPromise !== null &&
        researchIdentityKey === identityKey
      ) {
        return researchPromise;
      }

      researchIdentityKey = identityKey;
      researchPromise = provider.research(identity, signal);

      return researchPromise;
    },
  };
}

/**
 * Builds the production evidence-provider set for ONE product-evidence
 * collection operation.
 *
 * The returned providers are request-scoped. All external source classes
 * share one discovery promise, so source provenance remains truthful without
 * repeating the same Google/Gemini discovery operation for every source type.
 */
export function createProductionProductEvidenceProviders(
  options: ProductionProductEvidenceProviderOptions = {}
): ProductEvidenceProvider[] {
  const defaultResearchProvider: ProductResearchProvider = {
    providerName: "Google Search Grounding",

    async research(identity, signal) {
      const { googleSearchProductResearchProvider } =
        await import(
          "@/lib/product-research-providers/google-search"
        );

      return googleSearchProductResearchProvider.research(
        identity,
        signal
      );
    },
  };

  const researchProvider = createRequestScopedResearchProvider(
    options.researchProvider ??
      defaultResearchProvider
  );

  const externalProviders = EXTERNAL_SOURCE_TYPES.map(
    (sourceType) =>
      createExternalResearchEvidenceProvider({
        sourceType,
        researchProvider,
        ...(options.sourceRetriever
          ? { sourceRetriever: options.sourceRetriever }
          : {}),
      })
  );

  return [
    new InteractProductCatalogEvidenceProvider(),
    ...externalProviders,
  ];
}
