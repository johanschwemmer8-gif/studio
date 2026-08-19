
'use server';
/**
 * @fileOverview Retrieves QR code templates for a given retailer.
 * Enforces tenant isolation via getAuthorizedRetailerId.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import type { QrTemplate, GetQrTemplatesInput } from '@/lib/schemas/qr-templates';
import { QrTemplateSchema, GetQrTemplatesInputSchema } from '@/lib/schemas/qr-templates';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function getQrTemplates(input: GetQrTemplatesInput): Promise<QrTemplate[]> {
  return getQrTemplatesFlow(input);
}


const getQrTemplatesFlow = ai.defineFlow(
  {
    name: 'getQrTemplatesFlow',
    inputSchema: GetQrTemplatesInputSchema,
    outputSchema: z.array(QrTemplateSchema),
  },
  async ({ idToken, retailerId }) => {
    // AUTHORIZATION GATE
    const authorizedRetailerId = await getAuthorizedRetailerId(idToken, retailerId);
    
    // In a real app, you would query Firestore
    // For now, return mock data scoped to the authorized tenant
    const mockGlobalTemplates: QrTemplate[] = [
        {
            templateId: 'global-dark',
            name: 'Standard Dark',
            description: 'A standard black on white QR code.',
            defaults: { colorHex: '#000000', bgColorHex: '#FFFFFF', errorCorrection: 'M', aiTone: 'Professional', aiGoal: 'Drive sales' },
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
            templateId: 'retailer-custom',
            name: 'Brand Custom Style',
            description: 'Specific style for the current tenant.',
            defaults: { colorHex: '#FF8C00', bgColorHex: '#FFFFFF', errorCorrection: 'Q', aiTone: 'Excited', aiGoal: 'Engagement' },
            retailerId: authorizedRetailerId,
        }
    ];

    return [...mockGlobalTemplates, ...mockRetailerTemplates];
  }
);
