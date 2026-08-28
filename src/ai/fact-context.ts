'use server';
/**
 * @fileOverview Fact Context utility for Ari Grounding.
 * Transforms raw Firestore data into a structured "Fact Context" for AI consumption.
 * HARDENED: Enforces retailerId for tenant-isolated retrieval.
 */

import { getCanonicalProduct } from '@/services/product-service';
import type { Product } from '@/lib/data';

export type ProvenanceMetadata = {
  source: string;
  sourceId: string;
  retrievedAt: string;
  type: 'CANONICAL_FIRESTORE' | 'SIMULATED_CONTEXT';
};

export type FactContext = {
  verifiedFacts: Partial<Product>;
  provenance: ProvenanceMetadata;
  exists: boolean;
};

/**
 * Constructs a structured Fact Context for a specific GTIN and Retailer.
 * Ensures that Ari only sees facts that are actually present in the authoritative source
 * and belong to the correct tenant.
 */
export async function buildFactContext(gtin: string, retailerId: string): Promise<FactContext> {
  const product = await getCanonicalProduct(gtin, retailerId);
  const now = new Date().toISOString();

  if (!product) {
    return {
      verifiedFacts: {},
      provenance: {
        source: 'iNteract Identity Layer',
        sourceId: gtin,
        retrievedAt: now,
        type: 'CANONICAL_FIRESTORE'
      },
      exists: false
    };
  }

  // Extract only verified fields to prevent Ari from seeing (and using) undefined values
  const verifiedFacts: Partial<Product> = {
    gtin: product.gtin,
    name: product.name,
    brand: product.brand,
    description: product.description,
    category: product.category,
    price: product.price,
    batchNumber: product.batchNumber,
    serialNumber: product.serialNumber,
    retailerId: product.retailerId
  };

  return {
    verifiedFacts,
    provenance: {
      source: 'iNteract Canonical Products',
      sourceId: product.gtin,
      retrievedAt: now,
      type: 'CANONICAL_FIRESTORE'
    },
    exists: true
  };
}
