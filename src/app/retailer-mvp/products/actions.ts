'use server';

import {
  createCanonicalProduct,
  updateCanonicalProduct,
  type CanonicalProductInput,
  type CanonicalProductUpdateInput,
} from '@/services/product-service';

export async function addCanonicalProduct(
  input: CanonicalProductInput,
  idToken: string
) {
  return createCanonicalProduct(input, idToken);
}
export async function updateCatalogProduct(
  input: CanonicalProductUpdateInput,
  idToken: string
) {
  const result = await updateCanonicalProduct(input, idToken);

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to update product.",
    };
  }

  return {
    success: true,
  };
}
