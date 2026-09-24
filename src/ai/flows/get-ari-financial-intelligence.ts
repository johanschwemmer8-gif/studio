'use server';

import { ariFinancialNarrativeProvider } from '@/ai/ari-financial-narrative-provider';
import { buildAriFinancialIntelligence } from '@/lib/ari-financial-intelligence';
import { getProfitRoiEvidence } from '@/lib/profit-roi-evidence-server';
import { interpretProfitRoiSnapshot } from '@/lib/profit-roi-interpretation';
import type { AriFinancialIntelligence } from '@/lib/schemas/ari-financial-intelligence';
import type { OverviewPeriodGranularity } from '@/lib/schemas/overview-intelligence';

/**
 * Authoritative Ari Financial Intelligence boundary.
 *
 * The browser may request a reporting granularity, but it is never trusted
 * to supply the financial snapshot that Ari interprets.
 *
 * Authentication, tenant authorization, organizational scope, reporting
 * calendar resolution and financial evidence are re-established server-side
 * by getProfitRoiEvidence().
 */
export async function getAriFinancialIntelligence(
  idToken: string | undefined,
  granularity: OverviewPeriodGranularity = 'MONTHLY'
): Promise<AriFinancialIntelligence> {
  const snapshot = await getProfitRoiEvidence(idToken, granularity);
  const interpretation = interpretProfitRoiSnapshot(snapshot);

  return buildAriFinancialIntelligence(
    interpretation,
    ariFinancialNarrativeProvider
  );
}
