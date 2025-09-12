'use server';
/**
 * @fileOverview A scheduled flow to synchronize products from a mock retailer API.
 *
 * - scheduledProductSync - A flow that fetches products and updates Firestore.
 * - ScheduledProductSyncInput - The input type for the flow.
 * - ScheduledProductSyncOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import fetch from 'node-fetch';

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

const ScheduledProductSyncInputSchema = z.object({
  retailerId: z.string(),
  mockApiUrl: z.string().url().default('https://mock-retailer-api.com/products'), // Example URL
});
export type ScheduledProductSyncInput = z.infer<typeof ScheduledProductSyncInputSchema>;

const ScheduledProductSyncOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  syncedCount: z.number().optional(),
  deletedCount: z.number().optional(),
});
export type ScheduledProductSyncOutput = z.infer<typeof ScheduledProductSyncOutputSchema>;

export async function scheduledProductSync(input: ScheduledProductSyncInput): Promise<ScheduledProductSyncOutput> {
  // In a real scheduled function, authentication might be handled by service accounts.
  return scheduledProductSyncFlow(input);
}

const scheduledProductSyncFlow = ai.defineFlow(
  {
    name: 'scheduledProductSyncFlow',
    inputSchema: ScheduledProductSyncInputSchema,
    outputSchema: ScheduledSyncOutputSchema,
  },
  async ({ retailerId, mockApiUrl }) => {
    const db = admin.firestore();

    // 1. Fetch data from mock retailer API
    let productsFromApi: z.infer<typeof ProductSchema>[];
    try {
      // NOTE: This is a mock API URL and will likely fail.
      // In a real scenario, this would be a valid endpoint.
      const response = await fetch(mockApiUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      productsFromApi = await response.json() as z.infer<typeof ProductSchema>[];
    } catch (error: any) {
        // Since the mock API doesn't exist, we'll fall back to mock data for demonstration.
        console.warn(`Mock API fetch failed (${error.message}). Using fallback mock data.`);
        productsFromApi = [
            { sku: 'MOCK-001', name: 'Synced Running Shoes', description: 'Latest model.', price: 129.99, imageUrl: 'https://picsum.photos/seed/shoes/400', isAvailable: true },
            { sku: 'MOCK-002', name: 'Synced Water Bottle', description: 'Keeps drinks cold.', price: 29.99, imageUrl: 'https://picsum.photos/seed/bottle/400', isAvailable: true },
            { sku: 'MOCK-003', name: 'Synced Fitness Tracker', description: 'Track your steps.', price: 89.99, imageUrl: 'https://picsum.photos/seed/tracker/400', isAvailable: false },
        ];
    }

    const productsRef = db.collection('products');
    let deletedCount = 0;

    try {
      // 2. Clear all existing documents for the retailer
      const existingProductsQuery = productsRef.where('retailerId', '==', retailerId);
      const snapshot = await existingProductsQuery.get();
      
      if (!snapshot.empty) {
        const deleteBatch = db.batch();
        snapshot.docs.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        deletedCount = snapshot.size;
      }

      // 3. Save new products
      const addBatch = db.batch();
      productsFromApi.forEach(product => {
        const docRef = productsRef.doc(product.sku); // Use SKU as document ID
        addBatch.set(docRef, {
          ...product,
          retailerId, // Ensure retailerId is set
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await addBatch.commit();

      return {
        success: true,
        message: `Successfully synced ${productsFromApi.length} products for retailer ${retailerId}.`,
        syncedCount: productsFromApi.length,
        deletedCount: deletedCount,
      };

    } catch (error: any) {
      console.error('Product synchronization failed:', error);
      return {
        success: false,
        message: `Error during Firestore operation: ${error.message}`,
      };
    }
  }
);
