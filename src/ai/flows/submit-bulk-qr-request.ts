'use server';

/**
 * @fileOverview Submit a QR Activation request.
 *
 * ARCHITECTURE:
 * - One retailer-defined activation = one activation context.
 * - The QR represents the activation / Point of Decision.
 * - The QR is NOT the product identity.
 * - GTIN remains the authoritative product identifier.
 * - Target and Product Context are separate.
 *
 * This flow is the authoritative server-side entry point for creating
 * QR Activation requests.
 *
 * Lifecycle:
 *
 *   SUBMIT
 *      ↓
 *   bulkQrRequests/{requestId}
 *      ↓
 *   items/{qrCodeId} = PENDING
 *      ↓
 *   QUEUED
 *      ↓
 *   process-bulk-qr-queue
 *      ↓
 *   PROCESSING
 *      ↓
 *   qrcodes/{qrCodeId}
 *      ↓
 *   COMPLETED
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import {
  SubmitBulkQrRequestInputSchema,
  type SubmitBulkQrRequestInput,
} from '@/lib/schemas/bulk-qr-request';

/**
 * Re-export the input type so existing consumers such as
 * src/ai/flows/index.ts can continue importing it from this flow.
 */
export type { SubmitBulkQrRequestInput } from '@/lib/schemas/bulk-qr-request';

const SubmitBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
});

export type SubmitBulkQrRequestOutput = z.infer<
  typeof SubmitBulkQrRequestOutputSchema
>;

export async function submitBulkQrRequest(
  input: SubmitBulkQrRequestInput
): Promise<SubmitBulkQrRequestOutput> {
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
    // 1. AUTHORISATION
    // -------------------------------------------------------------------------

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    if (!db) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    // -------------------------------------------------------------------------
    // 2. VALIDATE ACTIVATION TARGET
    // -------------------------------------------------------------------------
    //
    // The shared schema keeps target optional temporarily during migration.
    //
    // A production activation submitted through this flow must nevertheless
    // contain a meaningful target.
    //
    // A retailer may target:
    //   Category
    //   Category + Sub-category
    //   Category + Sub-category + Product Type
    //   Brand
    //   Specific Product
    //   Specific Product + GTIN
    //
    // Not every level is mandatory.

    const target = data.target;

    if (!target) {
      throw new Error(
        'Activation target is required. Select at least a category, product type, brand, or specific product.'
      );
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
      throw new Error(
        'Activation target cannot be empty. Select what the retailer wants to promote.'
      );
    }

    // -------------------------------------------------------------------------
    // 3. TARGET GTIN COMPATIBILITY
    // -------------------------------------------------------------------------
    //
    // New activation model:
    //   target.targetProductGtin
    //
    // Legacy consumers may still read:
    //   options.gtin
    //
    // We preserve options.gtin temporarily but make the activation target
    // authoritative whenever target.targetProductGtin is supplied.

    const targetProductGtin =
      target.targetProductGtin?.trim() ||
      data.options?.gtin?.trim() ||
      undefined;

    // -------------------------------------------------------------------------
    // 4. CREATE ACTIVATION REQUEST
    // -------------------------------------------------------------------------

    const requestRef = db.collection('bulkQrRequests').doc();

    const now = new Date();

    try {
      await requestRef.set({
        // Tenant / campaign relationship
        retailerId: authorizedRetailerId,
        brandId: data.brandId,
        campaignId: data.campaignId,

        // ---------------------------------------------------------------------
        // Activation target
        // ---------------------------------------------------------------------
        target: {
          category: target.category || null,
          subCategory: target.subCategory || null,
          productType: target.productType || null,
          brandId: target.brandId || null,
          brandName: target.brandName || null,
          targetProductName: target.targetProductName || null,
          targetProductGtin: targetProductGtin || null,
        },

        // ---------------------------------------------------------------------
        // Product decision/comparison context
        // ---------------------------------------------------------------------
        productGtins: data.productGtins || [],

        // ---------------------------------------------------------------------
        // Physical Point-of-Decision context
        // ---------------------------------------------------------------------
        storeId: data.storeId || null,
        storeName: data.storeName || null,
        location: data.location || null,

        // ---------------------------------------------------------------------
        // Shopper objective
        // ---------------------------------------------------------------------
        shopperObjective: data.shopperObjective || null,

        // ---------------------------------------------------------------------
        // Legacy compatibility
        // ---------------------------------------------------------------------
        productName:
          data.productName ||
          target.targetProductName ||
          'Unnamed Activation',

        // ---------------------------------------------------------------------
        // QR generation / experience options
        // ---------------------------------------------------------------------
        options: data.options || {},

        // ---------------------------------------------------------------------
        // Processing state
        // ---------------------------------------------------------------------
        totalRequested: data.count,
        itemsDone: 0,
        status: 'QUEUED',

        // ---------------------------------------------------------------------
        // Data / standards state
        // ---------------------------------------------------------------------
        isGs1Compliant: true,
        dataStatus: 'VERIFIED',

        createdAt: now,
        updatedAt: now,
      });

      // -----------------------------------------------------------------------
      // 5. CREATE QR ITEMS SERVER-SIDE
      // -----------------------------------------------------------------------
      //
      // The browser must NOT create QR identities.
      //
      // Each item receives a server-side Firestore document ID that becomes
      // the QR identity used by the existing resolution/tracking pipeline.
      //
      // IMPORTANT:
      // `count` represents the number of QR identities requested by the
      // activation request. It does NOT mean one QR per product.
      //
      // The current bulk mechanism is retained so existing processing can be
      // migrated without introducing a new collection or changing scan routes.

      const batch = db.batch();
      const itemsCollection = requestRef.collection('items');

      for (let index = 0; index < data.count; index += 1) {
        const itemRef = itemsCollection.doc();
        const qrCodeId = itemRef.id;

        const trackingUrl = `https://interactaoe.co.za/resolve/${qrCodeId}`;

        batch.set(itemRef, {
          qrCodeId,

          // Activation/request relationship
          requestId: requestRef.id,
          retailerId: authorizedRetailerId,
          campaignId: data.campaignId,

          // Physical context
          storeId: data.storeId || null,
          storeName: data.storeName || null,
          location: data.location || null,

          // Target identity
          targetProductGtin: targetProductGtin || null,

          // Product decision context
          productGtins: data.productGtins || [],

          // Existing tracking pipeline
          trackingUrl,
          finalRedirectUrl:
            data.options?.landingPageUrl ||
            (targetProductGtin ? `/p/${targetProductGtin}` : ''),

          // Processing state
          status: 'PENDING',
          retryCount: 0,

          createdAt: now,
          updatedAt: now,
        });
      }

      await batch.commit();

      console.log(
        `[QR Management] Activation queued: ${requestRef.id} for Tenant ${authorizedRetailerId}`
      );

      return {
        success: true,
        requestId: requestRef.id,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown persistence error';

      console.error(
        `[QR Management] Activation persistence failure:`,
        message
      );

      throw new Error('Failed to create QR activation.');
    }
  }
);
