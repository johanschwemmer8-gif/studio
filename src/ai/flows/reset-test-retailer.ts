
'use server';
/**
 * @fileOverview Privileged server flow to reset the iNteract Test Retailer environment.
 * AUDIT VERSION: 1.0.0
 * SECURITY: Gated to Platform Admins. Hard-coded to interact-test-tenant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';

const TEST_RETAILER_ID = 'interact-test-tenant';

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
        configs: 0
    };

    try {
        // 2. Define scoped deletion helper
        const deleteByTenant = async (collectionName: string, countKey: string) => {
            const snapshot = await db.collection(collectionName)
                .where('retailerId', '==', TEST_RETAILER_ID)
                .get();
            
            if (snapshot.empty) return;

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                counts[countKey]++;
            });
            await batch.commit();
        };

        // 3. Execute Reset Sequence
        await deleteByTenant('products', 'products');
        await deleteByTenant('bulkQrRequests', 'qrJobs');
        await deleteByTenant('qrcodes', 'qrCodes');
        await deleteByTenant('sessions', 'sessions');
        await deleteByTenant('events', 'events');
        await deleteByTenant('transactions', 'transactions');
        await deleteByTenant('ai_conversations', 'conversations');

        // Special handling for configurations (keyed by ID)
        const configIds = [`${TEST_RETAILER_ID}_org`, `${TEST_RETAILER_ID}_brand`];
        const configBatch = db.batch();
        for (const cid of configIds) {
            const docRef = db.collection('configurations').doc(cid);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                configBatch.delete(docRef);
                counts.configs++;
            }
        }
        await configBatch.commit();

        // 4. Audit Log
        await db.collection('auditLogs').add({
            action: 'TEST_RETAILER_RESET',
            targetRetailerId: TEST_RETAILER_ID,
            performedByUid: caller.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            result: 'success',
            deletedCounts: counts
        });

        return {
            success: true,
            message: `Test environment reset complete for ${TEST_RETAILER_ID}.`,
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
