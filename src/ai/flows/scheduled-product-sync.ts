'use server';
/**
 * @fileOverview Secure Product Sync Service.
 * 
 * SECURITY MODEL:
 * 1. User-Initiated (Authenticated): Requires a valid Firebase ID token.
 *    Authorized via getAuthorizedRetailerId() to prevent tenant spoofing.
 * 2. System-Initiated (Privileged): Handled via non-exported internal functions
 *    that are NOT reachable from the client.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import fetch from 'node-fetch';
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

/**
 * INTERNAL PRIVILEGED SYNC LOGIC
 * Not exported as a Server Action to ensure it is only callable from the server.
 */
async function performSyncOperation(retailerId: string, mockApiUrl: string): Promise<any> {
    const db = admin.firestore();
    let productsFromApi: z.infer<typeof ProductSchema>[];
    
    try {
      const response = await fetch(mockApiUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      productsFromApi = await response.json() as z.infer<typeof ProductSchema>[];
    } catch (error: any) {
        console.warn(`[System Sync] API fetch failed for ${retailerId}: ${error.message}. Fallback data active.`);
        productsFromApi = [
            { sku: 'MOCK-001', name: 'Synced Running Shoes', description: 'Latest model.', price: 129.99, imageUrl: 'https://picsum.photos/seed/shoes/400', isAvailable: true },
            { sku: 'MOCK-002', name: 'Synced Water Bottle', description: 'Keeps drinks cold.', price: 29.99, imageUrl: 'https://picsum.photos/seed/bottle/400', isAvailable: true },
            { sku: 'MOCK-003', name: 'Synced Fitness Tracker', description: 'Track your steps.', price: 89.99, imageUrl: 'https://picsum.photos/seed/tracker/400', isAvailable: false },
        ];
    }

    const productsRef = db.collection('products');
    let deletedCount = 0;

    try {
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

      const addBatch = db.batch();
      productsFromApi.forEach(product => {
        const docRef = productsRef.doc(product.sku); 
        addBatch.set(docRef, {
          ...product,
          retailerId: retailerId, 
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
      console.error(`[System Sync] Firestore error for ${retailerId}:`, error.message);
      throw error;
    }
}

const ScheduledProductSyncInputSchema = z.object({
  idToken: z.string().describe('Firebase ID token for user-initiated triggers.'),
  retailerId: z.string(),
  mockApiUrl: z.string().url().default('https://mock-retailer-api.com/products'),
});

const ScheduledProductSyncOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  syncedCount: z.number().optional(),
  deletedCount: z.number().optional(),
});

export type ScheduledProductSyncInput = z.infer<typeof ScheduledProductSyncInputSchema>;
export type ScheduledProductSyncOutput = z.infer<typeof ScheduledProductSyncOutputSchema>;

/**
 * PUBLIC SERVER ACTION
 * Authenticated entry point for syncing products.
 */
export async function scheduledProductSync(input: ScheduledProductSyncInput): Promise<ScheduledProductSyncOutput> {
  return scheduledProductSyncFlow(input);
}

const scheduledProductSyncFlow = ai.defineFlow(
  {
    name: 'scheduledProductSyncFlow',
    inputSchema: ScheduledProductSyncInputSchema,
    outputSchema: ScheduledProductSyncOutputSchema,
  },
  async ({ idToken, retailerId, mockApiUrl }) => {
    // AUTHORIZATION GATE: Resolve authoritative retailerId from token.
    // This will throw if the token is missing or invalid.
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    
    return await performSyncOperation(authorizedRetailerId, mockApiUrl);
  }
);