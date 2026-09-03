'use server';

import {
  createCanonicalProduct,
  type CanonicalProductInput,
} from '@/services/product-service';

export async function addCanonicalProduct(
  input: CanonicalProductInput,
  idToken: string
) {
  return createCanonicalProduct(input, idToken);
}
