
'use server';
/**
 * @fileOverview Retrieves QR code templates for a given retailer.
 *
 * - getQrTemplates - Fetches templates available to a retailer.
 * - GetQrTemplatesInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import type { QrTemplate } from '@/lib/schemas/qr-templates';
import { QrTemplateSchema, GetQrTemplatesInputSchema } from '@/lib/schemas/qr-templates';

if (!admin.apps.length) {
  admin.initializeApp();
}

export type GetQrTemplatesInput = z.infer<typeof GetQrTemplatesInputSchema>;

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
        {
            templateId: 'global-blue',
            name: 'Ocean Blue',
            description: 'A cool, blue-themed professional design.',
            defaults: { colorHex: '#0A4D68', bgColorHex: '#E0F4FF', errorCorrection: 'Q', aiTone: 'Calm and Trustworthy', aiGoal: 'Build brand trust' },
            retailerId: 'GLOBAL',
        },
        {
            templateId: 'global-eco',
            name: 'Eco-Friendly Green',
            description: 'A natural, earthy design for sustainable products.',
            defaults: { colorHex: '#2C5E1A', bgColorHex: '#F0FDF4', errorCorrection: 'M', aiTone: 'Natural and eco-conscious', aiGoal: 'Highlight sustainability' },
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
        },
        {
            templateId: 'retailer-premium',
            name: 'Premium & Dark',
            description: 'A sophisticated dark theme for luxury items.',
            defaults: { colorHex: '#E0C097', bgColorHex: '#1C1C1C', errorCorrection: 'H', aiTone: 'Elegant and exclusive', aiGoal: 'Promote luxury products' },
            retailerId: 'simulated-retailer-id',
        }
    ];

    // Simulate querying templates for the specific retailer plus global ones
    // In a real app, you would fetch from Firestore:
    // const db = admin.firestore();
    // const globalSnapshot = await db.collection('qrTemplates').where('retailerId', '==', 'GLOBAL').get();
    // const retailerSnapshot = await db.collection('qrTemplates').where('retailerId', '==', retailerId).get();
    // const globalTemplates = globalSnapshot.docs.map(doc => doc.data() as QrTemplate);
    // const retailerTemplates = retailerSnapshot.docs.map(doc => doc.data() as QrTemplate);

    return [...mockGlobalTemplates, ...mockRetailerTemplates];
  }
);
