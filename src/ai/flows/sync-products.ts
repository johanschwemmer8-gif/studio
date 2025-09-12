
'use server';
/**
 * @fileOverview A mock product synchronization service.
 *
 * - syncProducts - A flow that accepts a product list and saves it to Firestore.
 * - SyncProductsInput - The input type for the flow.
 * - SyncProductsOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const ProductSchema = z.object({
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageUrl: z.string().url(),
  isAvailable: z.boolean(),
});

const SyncProductsInputSchema = z.object({
  retailerId: z.string(),
  products: z.array(ProductSchema),
});
export type SyncProductsInput = z.infer<typeof SyncProductsInputSchema>;

const SyncProductsOutputSchema = z.object({
  success: z.boolean(),
  syncedCount: z.number(),
});
export type SyncProductsOutput = z.infer<typeof SyncProductsOutputSchema>;


export async function syncProducts(input: SyncProductsInput): Promise<SyncProductsOutput> {
  // In a real environment, you'd add auth/permission checks here.
  return syncProductsFlow(input);
}


const syncProductsFlow = ai.defineFlow(
  {
    name: 'syncProductsFlow',
    inputSchema: SyncProductsInputSchema,
    outputSchema: SyncProductsOutputSchema,
  },
  async ({ retailerId, products }) => {
    const db = admin.firestore();
    const batch = db.batch();
    let syncedCount = 0;

    // A real implementation should check for the retailer's existence and user permissions.
    
    for (const product of products) {
      // Use the SKU as the document ID for easy lookups and to prevent duplicates.
      const productRef = db.collection('products').doc(product.sku);
      
      batch.set(productRef, {
        ...product,
        retailerId: retailerId, // Ensure the retailerId is part of the document data
      });
      syncedCount++;
    }

    try {
      await batch.commit();
      return { success: true, syncedCount };
    } catch (error: any) {
      console.error("Failed to sync products to Firestore:", error);
      throw new Error(`Firestore batch commit failed: ${error.message}`);
    }
  }
);
