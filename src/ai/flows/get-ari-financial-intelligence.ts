'use server';

import { ariFinancialNarrativeProvider } from '@/ai/ari-financial-narrative-provider';
import { buildAriFinancialIntelligence } from '@/lib/ari-financial-intelligence';
import { interpretProfitRoiSnapshot } from '@/lib/profit-roi-interpretation';
import { ProfitRoiSnapshotSchema } from '@/lib/schemas/profit-roi';
import type { AriFinancialIntelligence } from '@/lib/schemas/ari-financial-intelligence';

export async function getAriFinancialIntelligence(
  snapshotInput: unknown
): Promise<AriFinancialIntelligence> {
  const snapshot = ProfitRoiSnapshotSchema.parse(snapshotInput);
  const interpretation = interpretProfitRoiSnapshot(snapshot);

  return buildAriFinancialIntelligence(
    interpretation,
    ariFinancialNarrativeProvider
  );
}
