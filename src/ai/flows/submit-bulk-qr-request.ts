'use server';

/**
 * @fileOverview Authoritative QR Activation Engine (Gate 2 Hardened)
 * 
 * SYSTEM GATE: Gate 2 Architectural Invariants & Server Actions.
 * 
 * 1. ENFORCED CARDINALITY: 1 Request = 1 QR Identity.
 * 2. TRANSACTIONAL INTEGRITY: Creation is an atomic operation.
 * 3. IDEMPOTENCY: Implements checks to prevent duplicate production records.
 * 4. GOVERNANCE: Restricts creation to authorized management roles.
 */

import { ai } from '@/ai/genkit';
import { db, admin } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import {
  SubmitBulkQrRequestInputSchema,
  type SubmitBulkQrRequestInput,
} from '@/lib/schemas/bulk-qr-request';

export type { SubmitBulkQrRequestInput } from '@/lib/schemas/bulk-qr-request';

const SubmitBulkQrRequestOutputSchema = ai.defineSchema('SubmitBulkQrRequestOutput', {
  success: z.boolean(),
  requestId: z.string(),
  isDuplicate: z.boolean().optional(),
});

export async function submitBulkQrRequest(
  input: SubmitBulkQrRequestInput
) {
  return submitBulkQrRequestFlow(input);
}

const submitBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'submitBulkQrRequestFlow',
    inputSchema: SubmitBulkQrRequestInputSchema,
    outputSchema: SubmitBulkQrRequestOutputSchema,
  },
  async (data) => {
    // -------------------------------------------------------------------------
    // 1. AUTHORIZATION & GOVERNANCE GATE
    // -------------------------------------------------------------------------
    const auth = await verifyAuth(data.idToken);
    if ('error' in auth) throw new Error(auth.error);

    // Strictly prohibit store-level users from creating commercial activations
    if (auth.role === 'storeUser' || auth.role === 'analyst') {
      throw new Error("ACCESS_DENIED: Your role is not authorized to create commercial activations.");
    }

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    if (!db) {
      throw new Error('Infrastructure Layer (Firestore) Unavailable.');
    }

    // -------------------------------------------------------------------------
    // 2. IDEMPOTENCY CHECK
    // -------------------------------------------------------------------------
    if (data.idempotencyKey) {
      const existing = await db.collection('bulkQrRequests')
        .where('retailerId', '==', authorizedRetailerId)
        .where('idempotencyKey', '==', data.idempotencyKey)
        .limit(1)
        .get();

      if (!existing.empty) {
        console.log(`[Gate 2] Duplicate activation blocked: ${data.idempotencyKey}`);
        return {
          success: true,
          requestId: existing.docs[0].id,
          isDuplicate: true,
        };
      }
    }

    // -------------------------------------------------------------------------
    // 3. TARGET & POD VALIDATION
    // -------------------------------------------------------------------------
    const target = data.target;
    const hasTargetValue = Boolean(
      target.category?.trim() ||
      target.subCategory?.trim() ||
      target.brandName?.trim() ||
      target.targetProductGtin?.trim()
    );

    if (!hasTargetValue) {
      throw new Error('Gate 2 Violation: Activation target (Retailer Intent) cannot be empty.');
    }

    if (!data.storeName?.trim() || !data.location?.trim()) {
      throw new Error('Gate 2 Violation: Physical Point-of-Decision (Store and Location) is required.');
    }

    // -------------------------------------------------------------------------
    // 4. ATOMIC CREATION (1:1 CARDINALITY)
    // -------------------------------------------------------------------------
    const requestRef = db.collection('bulkQrRequests').doc();
    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();

    const targetProductGtin = target.targetProductGtin?.trim() || undefined;

    // A. Authoritative Activation Record
    batch.set(requestRef, {
      retailerId: authorizedRetailerId,
      brandId: data.brandId,
      campaignId: data.campaignId,
      idempotencyKey: data.idempotencyKey || null,

      // Retailer Intent
      target: {
        category: target.category || null,
        subCategory: target.subCategory || null,
        productType: target.productType || null,
        brandId: target.brandId || null,
        brandName: target.brandName || null,
        targetProductName: target.targetProductName || null,
        targetProductGtin: targetProductGtin || null,
      },

      // Product Context (Separated from Target)
      productContext: {
        productGtins: data.productGtins || [],
      },
      productGtins: data.productGtins || [], // Legacy compatibility

      // Physical Point-of-Decision (POD)
      storeId: data.storeId || null,
      storeName: data.storeName,
      location: data.location,

      shopperObjective: data.shopperObjective || null,
      productName: data.productName || target.targetProductName || 'Unnamed Activation',

      options: data.options || {},
      totalRequested: 1,
      itemsDone: 0,
      status: 'QUEUED',

      isGs1Compliant: true,
      dataStatus: 'VERIFIED',

      createdAt: now,
      updatedAt: now,
      createdBy: auth.uid,
    });

    // B. Digital Identity Stub (linked 1:1)
    const itemsCollection = requestRef.collection('items');
    const itemRef = itemsCollection.doc();
    const qrCodeId = itemRef.id;
    const trackingUrl = `https://interactaoe.co.za/resolve/${qrCodeId}`;

    batch.set(itemRef, {
      qrCodeId,
      requestId: requestRef.id,
      retailerId: authorizedRetailerId,
      campaignId: data.campaignId,
      storeId: data.storeId || null,
      storeName: data.storeName,
      location: data.location,
      targetProductGtin: targetProductGtin || null,
      productGtins: data.productGtins || [],
      trackingUrl,
      finalRedirectUrl: data.options?.landingPageUrl || (targetProductGtin ? `/p/${targetProductGtin}` : ''),
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();

    console.log(`[Gate 2] Activation Identity Sealed: ${qrCodeId}`);

    return {
      success: true,
      requestId: requestRef.id,
    };
  }
);
