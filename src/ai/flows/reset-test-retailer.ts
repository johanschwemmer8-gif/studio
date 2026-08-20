
'use server';
/**
 * @fileOverview Privileged server flow to reset the iNteract Test Retailer environment.
 * AUDIT VERSION: 1.1.0 (Chunked & Recursive Cleanup)
 * SECURITY: Gated to Platform Admins. Hard-coded to interact-test-tenant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';

const TEST_RETAILER_ID = 'interact-test-tenant';
const FIRESTORE_BATCH_LIMIT = 500;

const ResetTestRetailerInputSchema = z.object({
  idToken: z.string().describe("Administrator's Firebase ID token."),
});

const ResetTestRetailerOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  counts: z.record(z.number()).optional(),
});

export async function resetTestRetailer(idToken: string) {
    return resetTestRetailerFlow({ idToken });
}

const resetTestRetailerFlow = ai.defineFlow(
  {
    name: 'resetTestRetailerFlow',
    inputSchema: ResetTestRetailerInputSchema,
    outputSchema: ResetTestRetailerOutputSchema,
  },
  async ({ idToken }) => {
    // 1. Authorize Caller
    const caller = await verifyAuth(idToken);
    if (caller.role !== 'admin') {
        throw new Error("Unauthorized: Only platform administrators can reset the test environment.");
    }

    const db = getDb();
    if (!db) throw new Error("Infrastructure Layer Unavailable.");

    const counts: Record<string, number> = {
        products: 0,
        qrJobs: 0,
        qrCodes: 0,
        sessions: 0,
        events: 0,
        transactions: 0,
        conversations: 0,
        configs: 0,
        templates: 0,
        integrations: 0,
        displays: 0
    };

    /**
     * Chunked Deletion Helper
     * Handles large volumes (>500) and ensures atomic safety.
     */
    const deleteScopedRecords = async (collectionName: string, countKey: string, isSubcollection = false) => {
        let hasMore = true;
        while (hasMore) {
            const query = isSubcollection 
                ? db.collectionGroup(collectionName).where('retailerId', '==', TEST_RETAILER_ID)
                : db.collection(collectionName).where('retailerId', '==', TEST_RETAILER_ID);
            
            const snapshot = await query.limit(FIRESTORE_BATCH_LIMIT).get();
            
            if (snapshot.empty) {
                hasMore = false;
                break;
            }

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                counts[countKey]++;
            });
            await batch.commit();
            
            if (snapshot.size < FIRESTORE_BATCH_LIMIT) {
                hasMore = false;
            }
        }
    };

    try {
        // 2. Execute Recursive Reset Sequence
        // Operational Data
        await deleteScopedRecords('products', 'products');
        await deleteScopedRecords('bulkQrRequests', 'qrJobs');
        await deleteScopedRecords('items', 'qrCodes', true); // Recursive cleanup of job items
        await deleteScopedRecords('qrcodes', 'qrCodes');
        await deleteScopedRecords('sessions', 'sessions');
        await deleteScopedRecords('events', 'events');
        await deleteScopedRecords('transactions', 'transactions');
        await deleteScopedRecords('ai_conversations', 'conversations');
        
        // Configuration & Metadata
        await deleteScopedRecords('qrTemplates', 'templates');
        await deleteScopedRecords('displays', 'displays');

        // Special handling for keyed documents
        const specialDocs = [
            { coll: 'configurations', id: `${TEST_RETAILER_ID}_org`, key: 'configs' },
            { coll: 'configurations', id: `${TEST_RETAILER_ID}_brand`, key: 'configs' },
            { coll: 'retailerIntegrations', id: TEST_RETAILER_ID, key: 'integrations' }
        ];

        const keyBatch = db.batch();
        for (const item of specialDocs) {
            const ref = db.collection(item.coll).doc(item.id);
            const snap = await ref.get();
            if (snap.exists) {
                keyBatch.delete(ref);
                counts[item.key]++;
            }
        }
        await keyBatch.commit();

        // 3. Audit Log
        await db.collection('auditLogs').add({
            action: 'TEST_RETAILER_RESET',
            targetRetailerId: TEST_RETAILER_ID,
            performedByUid: caller.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            result: 'success',
            deletedCounts: counts,
            methodology: 'v1.1.0-chunked'
        });

        return {
            success: true,
            message: `Test environment reset complete. ${Object.values(counts).reduce((a, b) => a + b, 0)} records removed.`,
            counts
        };

    } catch (error: any) {
        console.error(`[Admin] Reset Failure:`, error.message);
        return {
            success: false,
            message: `Reset failed: ${error.message}`
        };
    }
  }
);
