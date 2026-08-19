
'use server';
/**
 * @fileOverview Saves a new QR code template to Firestore.
 * Enforces tenant isolation via getAuthorizedRetailerId.
 */

import { ai } from '@/ai/genkit';
import { admin } from '@/lib/firebase-admin';
import { SaveQrTemplateInputSchema, SaveQrTemplateOutputSchema, type SaveQrTemplateInput, type SaveQrTemplateOutput } from '@/lib/schemas/qr-templates';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function saveQrTemplate(input: SaveQrTemplateInput): Promise<SaveQrTemplateOutput> {
  return saveQrTemplateFlow(input);
}


const saveQrTemplateFlow = ai.defineFlow(
  {
    name: 'saveQrTemplateFlow',
    inputSchema: SaveQrTemplateInputSchema,
    outputSchema: SaveQrTemplateOutputSchema,
  },
  async (data) => {
    // AUTHORIZATION GATE
    const authorizedRetailerId = await getAuthorizedRetailerId(data.idToken, data.retailerId);
    
    const db = admin.firestore();
    const templateRef = db.collection('qrTemplates').doc();
    
    await templateRef.set({
        ...data,
        retailerId: authorizedRetailerId, // Use verified ID
        templateId: templateRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { success: true, templateId: templateRef.id };
  }
);
