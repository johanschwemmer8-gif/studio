'use server';
/**
 * @fileOverview Authoritative Product Sync Service.
 * Hardened: Enforces authoritative tenant identity via getAuthorizedRetailerId.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

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
  idToken: z.string().optional().describe('Firebase ID token for authoritative identity resolution.'),
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
  return syncProductsFlow(input);
}

const syncProductsFlow = ai.defineFlow(
  {
    name: 'syncProductsFlow',
    inputSchema: SyncProductsInputSchema,
    outputSchema: SyncProductsOutputSchema,
  },
  async ({ idToken, retailerId, products }) => {
    // AUTHORIZATION GATE: Enforce authoritative retailer identity
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    
    const db = admin.firestore();
    const BATCH_SIZE = 500;
    let syncedCount = 0;

    try {
        for (let i = 0; i < products.length; i += BATCH_SIZE) {
            const chunk = products.slice(i, i + BATCH_SIZE);
            const batch = db.batch();
            
            chunk.forEach(product => {
                const productRef = db.collection('products').doc(product.sku);
                batch.set(productRef, {
                    ...product,
                    retailerId: authorizedRetailerId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                syncedCount++;
            });

            await batch.commit();
        }

        return { success: true, syncedCount };
    } catch (error: any) {
      console.error("Failed to sync products to Firestore:", error);
      throw new Error(`Firestore chunked sync failed: ${error.message}`);
    }
  }
);
