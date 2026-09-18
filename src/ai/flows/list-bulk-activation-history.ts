'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import {
  verifyAuth,
  getAuthorizedRetailerId,
} from '@/lib/auth-server';

const ListBulkActivationHistoryInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
});

const BulkActivationHistoryItemSchema = z.object({
  requestId: z.string().min(1),
  campaignNames: z.array(z.string().min(1)),
  status: z.enum([
    'DRAFT',
    'SUBMITTING',
    'QUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
  ]),
  totalRequested: z.number().int().nonnegative(),
  itemsDone: z.number().int().nonnegative(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BulkActivationHistoryItem = z.infer<
  typeof BulkActivationHistoryItemSchema
>;

const ListBulkActivationHistoryOutputSchema = z.array(
  BulkActivationHistoryItemSchema
);

function timestampToIso(value: unknown): string | undefined {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return undefined;
}

export async function listBulkActivationHistory(input: {
  idToken: string;
  retailerId: string;
}): Promise<BulkActivationHistoryItem[]> {
  return listBulkActivationHistoryFlow(input);
}

const listBulkActivationHistoryFlow = ai.defineFlow(
  {
    name: 'listBulkActivationHistoryFlow',
    inputSchema: ListBulkActivationHistoryInputSchema,
    outputSchema: ListBulkActivationHistoryOutputSchema,
  },
  async (data) => {
    await verifyAuth(data.idToken);

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    if (!db) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const snapshot = await db
      .collection('bulkQrRequests')
      .where('retailerId', '==', authorizedRetailerId)
      .get();

    const history: BulkActivationHistoryItem[] = [];

    for (const document of snapshot.docs) {
      const raw = document.data();

      if (raw.retailerId !== authorizedRetailerId) {
        throw new Error('BULK_REQUEST_RETAILER_MISMATCH');
      }

      const itemSnapshot = await document.ref.collection('items').get();

      const campaignIds = new Set<string>();

      for (const itemDocument of itemSnapshot.docs) {
        const campaignId = itemDocument.data()?.activation?.campaignId;

        if (typeof campaignId === 'string' && campaignId.trim().length > 0) {
          campaignIds.add(campaignId);
        }
      }

      const campaignNames: string[] = [];

      for (const campaignId of campaignIds) {
        const campaignDocument = await db
          .collection('campaigns')
          .doc(campaignId)
          .get();

        if (!campaignDocument.exists) {
          continue;
        }

        const campaignData = campaignDocument.data();

        if (campaignData?.retailerId !== authorizedRetailerId) {
          throw new Error('CAMPAIGN_RETAILER_MISMATCH');
        }

        if (
          typeof campaignData?.name === 'string' &&
          campaignData.name.trim().length > 0
        ) {
          campaignNames.push(campaignData.name.trim());
        }
      }

      campaignNames.sort((a, b) => a.localeCompare(b));

      const parsed = BulkActivationHistoryItemSchema.parse({
        requestId: document.id,
        campaignNames,
        status: raw.status,
        totalRequested: raw.totalRequested,
        itemsDone: raw.itemsDone,
        createdAt: timestampToIso(raw.createdAt),
        updatedAt: timestampToIso(raw.updatedAt),
      });

      history.push(parsed);
    }

    return history.sort((a, b) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    );
  }
);
