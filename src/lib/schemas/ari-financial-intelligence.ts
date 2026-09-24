import { z } from 'zod';

import { ProfitRoiInterpretationSchema } from '@/lib/schemas/profit-roi-interpretation';

export const AriFinancialOperatingModeSchema = z.enum([
  'ENHANCED',
  'DETERMINISTIC',
]);

export const AriFinancialNarrativeSchema = z.object({
  summary: z.string().min(1),
  observations: z.array(z.string().min(1)),
  actions: z.array(z.string().min(1)),
});

export const AriFinancialIntelligenceSchema = z.object({
  mode: AriFinancialOperatingModeSchema,
  interpretation: ProfitRoiInterpretationSchema,
  narrative: AriFinancialNarrativeSchema,
});

export type AriFinancialOperatingMode = z.infer<
  typeof AriFinancialOperatingModeSchema
>;

export type AriFinancialNarrative = z.infer<
  typeof AriFinancialNarrativeSchema
>;

export type AriFinancialIntelligence = z.infer<
  typeof AriFinancialIntelligenceSchema
>;
