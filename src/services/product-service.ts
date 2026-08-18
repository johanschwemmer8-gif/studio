'use server';
/**
 * @fileOverview Authoritative Product Service for the iNteract platform.
 * Handles secure retrieval of canonical product records from Firestore.
 */

import { admin, getDb } from '@/lib/firebase-admin';
import { products as mockProducts, type Product } from '@/lib/data';

/**
 * Retrieves a canonical product document from Firestore by GTIN-14.
 * Includes a fallback to local mock data for environment resilience.
 */
export async function getCanonicalProduct(gtin: string): Promise<Product | null> {
  if (!gtin) return null;

  const db = getDb();
  if (!db) {
    console.warn("[ProductService] Firestore Admin unavailable. Falling back to local data.");
    return mockProducts.find(p => p.gtin === gtin) || null;
  }

  try {
    const productDoc = await db.collection('products').doc(gtin).get();
    
    if (productDoc.exists) {
      const data = productDoc.data() as any;
      return {
        gtin: data.gtin || gtin,
        name: data.name,
        brand: data.brand,
        description: data.description,
        category: data.category,
        price: data.price,
        image: {
            src: data.imageUrl || data.image?.src || '',
            width: 600,
            height: 600
        },
        'data-ai-hint': data.category || 'product',
        batchNumber: data.batchNumber,
        serialNumber: data.serialNumber
      } as Product;
    }

    // Secondary fallback to mock data if Firestore is empty but connected
    return mockProducts.find(p => p.gtin === gtin) || null;

  } catch (error) {
    console.error(`[ProductService] Error retrieving GTIN ${gtin}:`, error);
    // Tertiary fallback for high-availability
    return mockProducts.find(p => p.gtin === gtin) || null;
  }
}
