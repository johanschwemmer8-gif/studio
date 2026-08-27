'use server';
/**
 * @fileOverview A GS1-compliant Genkit flow to submit a bulk QR code generation request.
 * Supports GS1 Digital Link standards including GTIN, Batch, and Serial Number.
 * HARDENED: Now enforces trusted tenant identity via Firebase custom claims.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { SubmitBulkQrRequestInputSchema, type SubmitBulkQrRequestInput } from '@/lib/schemas/bulk-qr-request';

const SubmitBulkQrRequestOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
});
export type SubmitBulkQrRequestOutput = z.infer<typeof SubmitBulkQrRequestOutputSchema>;

export async function submitBulkQrRequest(input: SubmitBulkQrRequestInput): Promise<SubmitBulkQrRequestOutput> {
  return submitBulkQrRequestFlow(input);
}

const submitBulkQrRequestFlow = ai.defineFlow(
  {
    name: 'submitBulkQrRequestFlow',
    inputSchema: SubmitBulkQrRequestInputSchema,
    outputSchema: SubmitBulkQrRequestOutputSchema,
  },
  async (data) => {
    // AUTHORIZATION GATE
    const authorizedRetailerId = await getAuthorizedRetailerId(data.idToken, data.retailerId);
    
    if (!db) {
        throw new Error('Infrastructure Layer Unavailable.');
    }

    const requestRef = db.collection('bulkQrRequests').doc();
    
    try {
        await requestRef.set({
            retailerId: authorizedRetailerId,
            brandId: data.brandId,
            campaignId: data.campaignId,
            productName: data.productName || 'Unnamed Product',
            totalRequested: data.count,
            status: 'DRAFT', // Set to DRAFT to allow UI-driven processing/chunking
            createdAt: new Date(),
            updatedAt: new Date(),
            options: data.options || {},
            itemsDone: 0,
            isGs1Compliant: true,
            dataStatus: 'VERIFIED'
        });

        console.log(`[QR Management] Verified Draft Created: ${requestRef.id} for Tenant ${authorizedRetailerId}`);
        
        return { 
            success: true, 
            requestId: requestRef.id 
        };

    } catch (error: any) {
        console.error(`[QR Management] Persistence Failure:`, error.message);
        throw new Error("Failed to queue batch generation.");
    }
  }
);
