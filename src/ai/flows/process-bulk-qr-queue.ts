'use server';

/**
 * @fileOverview Authoritative QR Identity Generation Pipeline.
 * 
 * SYSTEM GATE: Gate 0 Architectural Invariants.
 * 
 * ARCHITECTURE CONTRACT:
 * 1. ONE ACTIVATION = ONE QR: This processor creates exactly one master qrcodes record per request item.
 * 2. PRIMARY OBJECT: The qrcodes record is the digital twin of the Point-of-Decision Activation.
 * 3. IDENTIFIER INTEGRITY: Prices and dynamic facts are NOT encoded in the QR. Only the tracking URL is encoded.
 * 4. TRACEABILITY: Master records retain a direct link (requestId) back to the operational intent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const ProcessBulkQrQueueOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  processedRequestId: z.string().optional(),
  itemsProcessed: z.number().optional(),
  itemsRetried: z.number().optional(),
});

export type ProcessBulkQrQueueOutput = z.infer<typeof ProcessBulkQrQueueOutputSchema>;

const getBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }
  return 'https://interactaoe.co.za';
};

const generateQrForItem = (
  item: FirebaseFirestore.DocumentData,
  requestData: FirebaseFirestore.DocumentData
) => {
  const qrCodeId = item.qrCodeId;

  if (!qrCodeId) {
    throw new Error('QR code ID is missing from activation item.');
  }

  const qrOptions = requestData.options || {};
  const qrColor = qrOptions.colorHex ? String(qrOptions.colorHex).replace('#', '') : '000000';
  const qrBgColor = qrOptions.bgColorHex ? String(qrOptions.bgColorHex).replace('#', '') : 'ffffff';
  const qrError = qrOptions.logoPath ? 'H' : qrOptions.errorCorrection || 'M';

  const trackingUrl = item.trackingUrl || `${getBaseUrl()}/resolve/${qrCodeId}`;
  const encodedQrData = encodeURIComponent(trackingUrl);

  let generatedQrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?` +
    `size=512x512` +
    `&data=${encodedQrData}` +
    `&color=${qrColor}` +
    `&bgcolor=${qrBgColor}` +
    `&ecc=${qrError}`;

  if (qrOptions.logoPath) {
    generatedQrUrl += `&logo=${encodeURIComponent(qrOptions.logoPath)}`;
  }

  const storagePath = `qr/${requestData.retailerId}/${requestData.campaignId}/${qrCodeId}.png`;

  return {
    status: 'DONE',
    storagePath,
    signedUrl: generatedQrUrl,
    trackingUrl,
    checksum: '',
    error: admin.firestore.FieldValue.delete(),
  };
};

const processBulkQrQueueFlow = ai.defineFlow(
  {
    name: 'processBulkQrQueueFlow',
    outputSchema: ProcessBulkQrQueueOutputSchema,
  },
  async () => {
    const db = admin.firestore();
    let itemsProcessedCount = 0;
    let itemsRetriedCount = 0;
    let processedRequestId: string | undefined;

    const requestsRef = db.collection('bulkQrRequests');
    const queuedRequestQuery = requestsRef.where('status', '==', 'QUEUED').orderBy('createdAt').limit(1);
    const queuedSnapshot = await queuedRequestQuery.get();

    if (!queuedSnapshot.empty) {
      const requestDoc = queuedSnapshot.docs[0];
      processedRequestId = requestDoc.id;

      try {
        await db.runTransaction(async (transaction) => {
          const currentDoc = await transaction.get(requestDoc.ref);
          if (!currentDoc.exists || currentDoc.data()?.status !== 'QUEUED') {
            throw new Error('Activation request state mismatch.');
          }
          transaction.update(requestDoc.ref, {
            status: 'PROCESSING',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        const lockedRequestDoc = await requestDoc.ref.get();
        const requestData = lockedRequestDoc.data() || {};
        const itemsRef = requestDoc.ref.collection('items');
        const pendingItemsQuery = itemsRef.where('status', '==', 'PENDING').limit(100);
        const pendingItemsSnapshot = await pendingItemsQuery.get();

        if (!pendingItemsSnapshot.empty) {
          itemsProcessedCount = pendingItemsSnapshot.size;
          const batch = db.batch();

          for (const itemDoc of pendingItemsSnapshot.docs) {
            const itemData = itemDoc.data();
            const updateData = generateQrForItem(itemData, requestData);

            batch.update(itemDoc.ref, {
              ...updateData,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Authoritative Master QR Record (The Digital Twin of the Activation)
            const qrMasterRef = db.collection('qrcodes').doc(itemData.qrCodeId);

            batch.set(qrMasterRef, {
                retailerId: requestData.retailerId,
                campaignId: requestData.campaignId,
                requestId: lockedRequestDoc.id,
                qrCodeId: itemData.qrCodeId,

                // Primary promotional intent
                target: requestData.target || null,
                targetProductGtin: itemData.targetProductGtin || requestData.target?.targetProductGtin || null,

                // Decision context (GTIN array, NOT a multiplier)
                productGtins: itemData.productGtins || requestData.productGtins || [],

                // Physical Point-of-Decision (POD)
                storeId: itemData.storeId || requestData.storeId || null,
                storeName: itemData.storeName || requestData.storeName || null,
                location: itemData.location || requestData.location || null,

                shopperObjective: requestData.shopperObjective || null,
                productName: requestData.productName || requestData.target?.targetProductName || null,

                redirectUrl: itemData.finalRedirectUrl || '',
                trackingUrl: updateData.trackingUrl,
                signedUrl: updateData.signedUrl,

                scanCount: 0,
                status: 'ACTIVE',
                options: requestData.options || {},
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          await batch.commit();
        }

        const allItemsSnapshot = await itemsRef.get();
        const allItemsDone = !allItemsSnapshot.empty && allItemsSnapshot.docs.every(doc => doc.data().status === 'DONE');

        await requestDoc.ref.update({
          status: allItemsDone ? 'COMPLETED' : 'QUEUED',
          itemsDone: allItemsSnapshot.docs.filter(doc => doc.data().status === 'DONE').length,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Processing error';
        if (processedRequestId) {
          await requestsRef.doc(processedRequestId).update({
            status: 'FAILED',
            error: message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        console.error(`[Architecture Guard] Processing FAILED for ${processedRequestId}:`, message);
      }
    }

    return {
      success: true,
      message: itemsProcessedCount > 0 ? `Processed ${itemsProcessedCount} activation item(s).` : 'No items to process.',
      processedRequestId,
      itemsProcessed: itemsProcessedCount,
    };
  }
);

export async function processBulkQrQueue(): Promise<ProcessBulkQrQueueOutput> {
  return processBulkQrQueueFlow();
}
