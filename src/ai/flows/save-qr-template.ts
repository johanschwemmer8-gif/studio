'use server';

/**
 * @fileOverview Creates or updates a canonical retailer-scoped
 * QR Presentation Template.
 *
 * QR Presentation Templates control physical QR artifact presentation only.
 * They do not create, replace, bind, or mutate canonical QR identity,
 * Campaign, Activation, Deployment, product/GTIN, or tracking URL.
 */

import { ai } from '@/ai/genkit';
import { admin } from '@/lib/firebase-admin';
import {
  SaveQrTemplateInputSchema,
  SaveQrTemplateOutputSchema,
  type SaveQrTemplateInput,
  type SaveQrTemplateOutput,
} from '@/lib/schemas/qr-templates';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function saveQrTemplate(
  input: SaveQrTemplateInput
): Promise<SaveQrTemplateOutput> {
  return saveQrTemplateFlow(input);
}

const saveQrTemplateFlow = ai.defineFlow(
  {
    name: 'saveQrTemplateFlow',
    inputSchema: SaveQrTemplateInputSchema,
    outputSchema: SaveQrTemplateOutputSchema,
  },
  async (data) => {
    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    const db = admin.firestore();

    const canonicalTemplateData = {
      name: data.name,
      description: data.description,
      defaults: data.defaults,
      retailerId: authorizedRetailerId,
    };

    /**
     * UPDATE
     *
     * The caller may request an update only by supplying an existing
     * templateId. Ownership is verified from the stored Firestore document;
     * caller-supplied retailerId can never transfer template ownership.
     */
    if (data.templateId) {
      const templateRef = db.collection('qrTemplates').doc(data.templateId);
      const existingSnapshot = await templateRef.get();

      if (!existingSnapshot.exists) {
        throw new Error('QR Template not found.');
      }

      const existingData = existingSnapshot.data();

      if (
        !existingData ||
        existingData.templateId !== data.templateId
      ) {
        throw new Error('QR Template identity mismatch.');
      }

      if (existingData.retailerId !== authorizedRetailerId) {
        throw new Error('QR Template tenant mismatch.');
      }

      await templateRef.update({
        ...canonicalTemplateData,
        templateId: data.templateId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        templateId: data.templateId,
      };
    }

    /**
     * CREATE
     *
     * Firestore generates the canonical template identity.
     */
    const templateRef = db.collection('qrTemplates').doc();

    await templateRef.set({
      ...canonicalTemplateData,
      templateId: templateRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      templateId: templateRef.id,
    };
  }
);
