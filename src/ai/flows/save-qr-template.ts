
'use server';
/**
 * @fileOverview Saves a new QR code template to Firestore.
 *
 * - saveQrTemplate - A callable function to create a new QR template.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import { SaveQrTemplateInputSchema, SaveQrTemplateOutputSchema, type SaveQrTemplateInput, type SaveQrTemplateOutput } from '@/lib/schemas/qr-templates';

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
    const db = admin.firestore();
    
    // Authorization Check (conceptual)
    const callerRetailerId = 'simulated-retailer-id';
    if (data.retailerId !== callerRetailerId) {
        throw new Error('User is not authorized to create templates for this retailer.');
    }

    const templateRef = db.collection('qrTemplates').doc();
    
    await templateRef.set({
        ...data,
        templateId: templateRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { success: true, templateId: templateRef.id };
  }
);
