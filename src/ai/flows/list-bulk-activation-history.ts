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

      const parsed = BulkActivationHistoryItemSchema.parse({
        requestId: document.id,
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
