'use server';

/**
 * @fileOverview Retrieves canonical QR presentation templates for the
 * authenticated retailer.
 *
 * QR Templates are reusable presentation defaults only. They do not create,
 * replace, bind, or mutate canonical QR identity.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import {
  QrTemplateSchema,
  GetQrTemplatesInputSchema,
  type QrTemplate,
  type GetQrTemplatesInput,
} from '@/lib/schemas/qr-templates';
import { getAuthorizedRetailerId } from '@/lib/auth-server';

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function getQrTemplates(
  input: GetQrTemplatesInput
): Promise<QrTemplate[]> {
  return getQrTemplatesFlow(input);
}

const getQrTemplatesFlow = ai.defineFlow(
  {
    name: 'getQrTemplatesFlow',
    inputSchema: GetQrTemplatesInputSchema,
    outputSchema: z.array(QrTemplateSchema),
  },
  async ({ idToken, retailerId }) => {
    const authorizedRetailerId = await getAuthorizedRetailerId(
      idToken,
      retailerId
    );

    const snapshot = await admin
      .firestore()
      .collection('qrTemplates')
      .where('retailerId', '==', authorizedRetailerId)
      .get();

    const templates = snapshot.docs.map((document) => {
      const parsed = QrTemplateSchema.parse(document.data());

      if (parsed.templateId !== document.id) {
        throw new Error(
          `QR Template identity mismatch for document ${document.id}.`
        );
      }

      if (parsed.retailerId !== authorizedRetailerId) {
        throw new Error(
          `QR Template tenant mismatch for document ${document.id}.`
        );
      }

      return parsed;
    });

    return templates.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
);
