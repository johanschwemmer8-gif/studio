
'use server';
/**
 * @fileOverview Saves a new QR code template to Firestore.
 *
 * - saveQrTemplate - A callable function to create a new QR template.
 * - SaveQrTemplateInput - The input type for the function.
 * - SaveQrTemplateOutput - The return type for the function.
 * - QrTemplateSchema - The Zod schema for a QR template object.
 * - QrTemplate - The TypeScript type for a QR template object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export const QrTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaults: z.any(),
  retailerId: z.string(),
});
export type QrTemplate = z.infer<typeof QrTemplateSchema>;

export const SaveQrTemplateInputSchema = z.object({
  retailerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaults: z.any(),
});
export type SaveQrTemplateInput = z.infer<typeof SaveQrTemplateInputSchema>;

export const SaveQrTemplateOutputSchema = z.object({
  success: z.boolean(),
  templateId: z.string(),
});
export type SaveQrTemplateOutput = z.infer<typeof SaveQrTemplateOutputSchema>;


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
    if (!db) {
        throw new Error('Firestore is not initialized.');
    }
    
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
