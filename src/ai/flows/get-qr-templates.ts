
'use server';
/**
 * @fileOverview Retrieves QR code templates for a given retailer.
 *
 * - getQrTemplates - Fetches templates available to a retailer.
 * - GetQrTemplatesInput - The input type for the function.
 * - QrTemplate - The shape of a single template object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

export const GetQrTemplatesInputSchema = z.object({
  retailerId: z.string(),
});
export type GetQrTemplatesInput = z.infer<typeof GetQrTemplatesInputSchema>;

export const QrTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaults: z.any(),
  retailerId: z.string(),
});
export type QrTemplate = z.infer<typeof QrTemplateSchema>;


export async function getQrTemplates(input: GetQrTemplatesInput): Promise<QrTemplate[]> {
  return getQrTemplatesFlow(input);
}


const getQrTemplatesFlow = ai.defineFlow(
  {
    name: 'getQrTemplatesFlow',
    inputSchema: GetQrTemplatesInputSchema,
    outputSchema: z.array(QrTemplateSchema),
  },
  async ({ retailerId }) => {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }
    
    // Authorization Check (conceptual)
    const callerRetailerId = 'simulated-retailer-id';
    if (retailerId !== callerRetailerId) {
        throw new Error('User is not authorized to view templates for this retailer.');
    }
    
    // In a real app, you would query Firestore
    // For now, return mock data
    const mockGlobalTemplates: QrTemplate[] = [
        {
            templateId: 'global-dark',
            name: 'Standard Dark',
            description: 'A standard black on white QR code.',
            defaults: { colorHex: '#000000', bgColorHex: '#FFFFFF', errorCorrection: 'M', aiTone: 'Professional', aiGoal: 'Drive sales' },
            retailerId: 'GLOBAL',
        },
        {
            templateId: 'global-light',
            name: 'Standard Light (Inverted)',
            description: 'A standard white on black QR code.',
            defaults: { colorHex: '#FFFFFF', bgColorHex: '#000000', errorCorrection: 'M', aiTone: 'Playful', aiGoal: 'Increase engagement' },
            retailerId: 'GLOBAL',
        },
    ];

    const mockRetailerTemplates: QrTemplate[] = [
        {
            templateId: 'retailer-summer-sale',
            name: 'Summer Sale 2024',
            description: 'Bright orange style for the summer promotion.',
            defaults: { colorHex: '#FF8C00', bgColorHex: '#FFFFFF', errorCorrection: 'Q', aiTone: 'Excited and urgent', aiGoal: 'Clear old stock' },
            retailerId: 'simulated-retailer-id',
        }
    ];

    // Simulate querying templates for the specific retailer plus global ones
    return [...mockGlobalTemplates, ...mockRetailerTemplates];
  }
);
