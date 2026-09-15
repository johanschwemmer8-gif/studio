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
  return updateCanonicalProduct(input, idToken);
}
