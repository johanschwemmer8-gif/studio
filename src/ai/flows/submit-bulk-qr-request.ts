'use server';

/**
 * @fileOverview Authoritative QR Activation Submission Flow.
 * 
 * SYSTEM GATE: Gate 0 Architectural Invariants.
 * 
 * 1. ENFORCED CARDINALITY: Removes loops. 1 Request = 1 QR.
 * 2. IDEMPOTENCY: Implements checks to prevent duplicate production records.
 * 3. IDENTITY BOUNDARY: Ensures Activation IDs are distinct from Product IDs.
 * 4. CONTEXT SEPARATION: Preserves productGtins[] as metadata, not generation triggers.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
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
    // 1. AUTHORISATION GATE
    // -------------------------------------------------------------------------
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
    // Rigorous check to prevent duplicate production records from network retries.
    if (data.idempotencyKey) {
      const existing = await db.collection('bulkQrRequests')
        .where('retailerId', '==', authorizedRetailerId)
        .where('idempotencyKey', '==', data.idempotencyKey)
        .limit(1)
        .get();

      if (!existing.empty) {
        console.log(`[Architecture Guard] Duplicate activation blocked for key: ${data.idempotencyKey}`);
        return {
          success: true,
          requestId: existing.docs[0].id,
          isDuplicate: true,
        };
      }
    }

    // -------------------------------------------------------------------------
    // 3. TARGET VALIDATION
    // -------------------------------------------------------------------------
    const target = data.target;
    if (!target) {
      throw new Error('Architectural violation: Activation target is required.');
    }

    const hasTargetValue = Boolean(
      target.category?.trim() ||
        target.subCategory?.trim() ||
        target.productType?.trim() ||
        target.brandId?.trim() ||
        target.brandName?.trim() ||
        target.targetProductName?.trim() ||
        target.targetProductGtin?.trim()
    );

    if (!hasTargetValue) {
      throw new Error('Activation target cannot be empty.');
    }

    // -------------------------------------------------------------------------
    // 4. CREATE AUTHORITATIVE ACTIVATION (1:1 CARDINALITY)
    // -------------------------------------------------------------------------
    const requestRef = db.collection('bulkQrRequests').doc();
    const now = new Date();

    const targetProductGtin =
      target.targetProductGtin?.trim() ||
      data.options?.gtin?.trim() ||
      undefined;

    try {
      await requestRef.set({
        retailerId: authorizedRetailerId,
        brandId: data.brandId,
        campaignId: data.campaignId,
        idempotencyKey: data.idempotencyKey || null,

        // Activation Target (Operational Intent)
        target: {
          category: target.category || null,
          subCategory: target.subCategory || null,
          productType: target.productType || null,
          brandId: target.brandId || null,
          brandName: target.brandName || null,
          targetProductName: target.targetProductName || null,
          targetProductGtin: targetProductGtin || null,
        },

        // Product Context (Supporting Data - Array field, NOT a multiplier)
        productGtins: data.productGtins || [],

        // Physical Point-of-Decision (POD)
        storeId: data.storeId || null,
        storeName: data.storeName || null,
        location: data.location || null,

        shopperObjective: data.shopperObjective || null,

        productName:
          data.productName ||
          target.targetProductName ||
          'Unnamed Activation',

        options: data.options || {},

        // ONE ACTIVATION = ONE QR
        totalRequested: 1,
        itemsDone: 0,
        status: 'QUEUED',

        isGs1Compliant: true,
        dataStatus: 'VERIFIED',

        createdAt: now,
        updatedAt: now,
      });

      // -----------------------------------------------------------------------
      // 5. STUB DIGITAL IDENTITY
      // -----------------------------------------------------------------------
      const batch = db.batch();
      const itemsCollection = requestRef.collection('items');
      const itemRef = itemsCollection.doc();
      const qrCodeId = itemRef.id;

      // The QR Identity is anchored to the Activation.
      const trackingUrl = `https://interactaoe.co.za/resolve/${qrCodeId}`;

      batch.set(itemRef, {
        qrCodeId,
        requestId: requestRef.id,
        retailerId: authorizedRetailerId,
        campaignId: data.campaignId,

        storeId: data.storeId || null,
        storeName: data.storeName || null,
        location: data.location || null,

        targetProductGtin: targetProductGtin || null,
        productGtins: data.productGtins || [],

        trackingUrl,
        finalRedirectUrl:
          data.options?.landingPageUrl ||
          (targetProductGtin ? `/p/${targetProductGtin}` : ''),

        status: 'PENDING',
        retryCount: 0,

        createdAt: now,
        updatedAt: now,
      });

      await batch.commit();

      console.log(`[Architecture Guard] Activation Identity established: ${qrCodeId} (Request: ${requestRef.id})`);

      return {
        success: true,
        requestId: requestRef.id,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown persistence error';
      console.error(`[Architecture Guard] Activation FAILED:`, message);
      throw new Error('Failed to create authoritative QR activation.');
    }
  }
);
