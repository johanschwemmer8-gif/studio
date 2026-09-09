'use server';
/**
 * @fileOverview Create a QR Campaign.
 *
 * A Campaign is the grouping/reporting container for Activations.
 * It does not produce a QR itself.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { CreateCampaignInputSchema } from '@/lib/schemas/campaign';

const CreateCampaignOutputSchema = z.object({
  success: z.boolean(),
  campaignId: z.string(),
});

export type CreateCampaignOutput = z.infer<typeof CreateCampaignOutputSchema>;

export async function createCampaign(
  input: z.infer<typeof CreateCampaignInputSchema>
): Promise<CreateCampaignOutput> {
  return createCampaignFlow(input);
}

const createCampaignFlow = ai.defineFlow(
  {
    name: 'createCampaignFlow',
    inputSchema: CreateCampaignInputSchema,
    outputSchema: CreateCampaignOutputSchema,
  },
  async (data) => {
    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    if (!db) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    // -------------------------------------------------------------------
    // VALIDATE CAMPAIGN MODE / TARGET RELATIONSHIP
    // -------------------------------------------------------------------

    if (data.campaignMode === 'single-target') {
      const t = data.target;
      const hasTargetValue = Boolean(
        t?.department?.trim() ||
          t?.category?.trim() ||
          t?.subCategory?.trim() ||
          t?.brandId?.trim() ||
          t?.brandName?.trim() ||
          t?.targetProductName?.trim() ||
          t?.targetProductGtin?.trim()
      );

      if (!hasTargetValue) {
        throw new Error(
          'A single-target campaign requires at least one target field (department, category, sub-category, brand, or product).'
        );
      }
    }

    const campaignRef = db.collection('campaigns').doc();
    const now = new Date();

    try {
      await campaignRef.set({
        campaignId: campaignRef.id,
        retailerId: authorizedRetailerId,
        campaignName: data.campaignName,
        campaignType: data.campaignType,
        campaignMode: data.campaignMode,
        target:
          data.campaignMode === 'single-target'
            ? {
                department: data.target?.department || null,
                category: data.target?.category || null,
                subCategory: data.target?.subCategory || null,
                brandId: data.target?.brandId || null,
                brandName: data.target?.brandName || null,
                targetProductName: data.target?.targetProductName || null,
                targetProductGtin: data.target?.targetProductGtin || null,
              }
            : null,
        status: 'draft',
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        createdBy: authorizedRetailerId,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, campaignId: campaignRef.id };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown persistence error';
      console.error('[QR Campaign] Creation failure:', message);
      throw new Error('Failed to create campaign.');
    }
  }
);