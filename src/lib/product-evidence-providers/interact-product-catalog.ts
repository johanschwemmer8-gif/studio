import { getCanonicalProduct } from "@/services/product-service";

import type {
  ProductEvidenceFact,
  ProductEvidenceIdentity,
} from "@/lib/schemas/product-evidence";

import type {
  ProductEvidenceContext,
  ProductEvidenceProvider,
  ProductEvidenceSourceResult,
} from "@/lib/product-evidence-orchestrator";

/**
 * First-party iNteract Product Catalog evidence provider.
 *
 * The Product Catalog is an authoritative retailer-owned source where a
 * canonical product record exists. It establishes useful first-party facts,
 * but it is not the only knowledge source available to Ari.
 */
export class InteractProductCatalogEvidenceProvider
  implements ProductEvidenceProvider
{
  readonly sourceType = "INTERACT_PRODUCT_CATALOG" as const;

  async collect(
    identity: ProductEvidenceIdentity,
    context: ProductEvidenceContext
  ): Promise<ProductEvidenceSourceResult> {
    const product = await getCanonicalProduct(identity.gtin);

    if (!product) {
      return {
        status: "UNAVAILABLE",
        sourceType: this.sourceType,
        reason: "PRODUCT_NOT_FOUND",
      };
    }

    /**
     * GTIN lookup alone is not sufficient tenancy authority.
     * The current shopper-session retailer remains authoritative.
     */
    if (product.retailerId !== context.retailerId) {
      return {
        status: "UNAVAILABLE",
        sourceType: this.sourceType,
        reason: "RETAILER_MISMATCH",
      };
    }

    const retrievedAt = new Date().toISOString();

    const source = {
      sourceType: this.sourceType,
      sourceName: "iNteract Product Catalog",
      retrievedAt,
      identityMatched: product.gtin === identity.gtin,
    } as const;

    if (!source.identityMatched) {
      return {
        status: "UNAVAILABLE",
        sourceType: this.sourceType,
        reason: "PRODUCT_IDENTITY_MISMATCH",
      };
    }

    const facts: ProductEvidenceFact[] = [];

    const addFact = (
      key: string,
      label: string,
      value: string
    ) => {
      const normalized = value.trim();

      if (!normalized) {
        return;
      }

      facts.push({
        key,
        label,
        value: normalized,
        source,
        verificationState: "VERIFIED",
        hasConflict: false,
      });
    };

    addFact("name", "Product", product.name);
    addFact("brand", "Brand", product.brand);
    addFact("description", "Description", product.description);
    addFact("category", "Category", product.category);

    /**
     * A numeric zero from the shopper projection is not treated as a factual
     * selling price because getCanonicalProduct currently uses 0 when the
     * stored price is absent/non-numeric.
     */
    if (Number.isFinite(product.price) && product.price > 0) {
      addFact(
        "price",
        "Price",
        product.price.toFixed(2)
      );
    }

    return {
      status: "AVAILABLE",
      sourceType: this.sourceType,
      facts,
      ...(facts.length === 0
        ? {
            limitations: [
              "The iNteract Product Catalog identified the product but contains no usable comparison facts.",
            ],
          }
        : {}),
    };
  }
}
