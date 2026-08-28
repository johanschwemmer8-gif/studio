'use server';
/**
 * @fileOverview Authoritative Product Service for the iNteract platform.
 * Handles secure retrieval of canonical product records from Firestore.
 * HARDENED: Now enforces strict retailerId scoping for tenant isolation.
 */

import { admin, getDb } from '@/lib/firebase-admin';
import { products as mockProducts, type Product } from '@/lib/data';

/**
 * Retrieves a canonical product document from Firestore by GTIN-14 and RetailerID.
 * Enforces tenant isolation by requiring both identifiers for retrieval.
 */
export async function getCanonicalProduct(gtin: string, retailerId: string): Promise<Product | null> {
  if (!gtin || !retailerId) return null;

  const db = getDb();
  if (!db) {
    console.warn("[ProductService] Firestore Admin unavailable. Falling back to local data.");
    return mockProducts.find(p => p.gtin === gtin && p.retailerId === retailerId) || null;
  }

  try {
    // Perform a tenant-scoped query rather than a direct document lookup to enforce isolation
    const productsRef = db.collection('products');
    const snapshot = await productsRef
      .where('gtin', '==', gtin)
      .where('retailerId', '==', retailerId)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
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
        serialNumber: data.serialNumber,
        retailerId: data.retailerId
      } as Product;
    }

    // Secondary fallback to mock data if Firestore is empty but connected (Demo support)
    return mockProducts.find(p => p.gtin === gtin && p.retailerId === retailerId) || null;

  } catch (error) {
    console.error(`[ProductService] Error retrieving GTIN ${gtin} for Retailer ${retailerId}:`, error);
    return mockProducts.find(p => p.gtin === gtin && p.retailerId === retailerId) || null;
  }
}
