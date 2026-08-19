'use server';
/**
 * @fileOverview Infrastructure Engagement Analysis Flow.
 * AUDIT VERSION: 1.5.2 (NaN Protected & Non-Causal)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { verifyAuth } from '@/lib/auth-server';

const AnalyzeEngagementMetricsInputSchema = z.object({
  idToken: z.string().optional(),
  retailerId: z.string().optional(),
});

const EngagementSchema = z.object({
    totalScans: z.number(),
    uniqueScans: z.number(),
    identifiedShoppers: z.number(),
    profileConversionRate: z.number(),
    engagementDuration: z.number(),
    scanRate: z.number(),
    authMethodBreakdown: z.object({
        google: z.number(),
        apple: z.number(),
        phone: z.number(),
        email: z.number(),
    }),
});

const ConversionSchema = z.object({
      avgBasketSizeAoe: z.number(),
      avgBasketSizeNonAoe: z.number(),
      basketSizeIncreaseRand: z.number(),
      basketSizeIncreasePercent: z.number(),
      associatedRevenue: z.number().describe('Total revenue associated with engaged sessions.'),
      calculatedUplift: z.number().describe('Calculated revenue delta based on observed basket uplift.'),
      salesUpliftPercentage: z.number(),
      conversionRate: z.number(),
      scanToPurchaseConversion: z.number(),
      assistedSales: z.number(),
      offerRedemptionRate: z.number(),
      totalRedeemedValue: z.number(),
      aoeTransactions: z.number(),
});

const AnalyzeEngagementMetricsOutputSchema = z.object({
  engagement: EngagementSchema,
  conversion: ConversionSchema,
  overallPerformance: z.string(),
  conclusions: z.string(),
  recommendations: z.string(),
});
export type AnalyzeEngagementMetricsOutput = z.infer<typeof AnalyzeEngagementMetricsOutputSchema>;

export async function analyzeEngagementMetrics(input: z.infer<typeof AnalyzeEngagementMetricsInputSchema>): Promise<AnalyzeEngagementMetricsOutput> {
  return analyzeEngagementMetricsFlow(input);
}

const analyzeEngagementMetricsFlow = ai.defineFlow(
  {
    name: 'analyzeEngagementMetricsFlow',
    inputSchema: AnalyzeEngagementMetricsInputSchema,
    outputSchema: AnalyzeEngagementMetricsOutputSchema,
  },
  async ({ idToken, retailerId }) => {
    // AUTHORIZATION GATE
    const auth = await verifyAuth(idToken);
    
    // Resolve authoritative tenant
    const targetRetailerId = (auth.role === 'admin' && retailerId) ? retailerId : auth.retailerId;
    if (!targetRetailerId && auth.role !== 'admin') {
        throw new Error("Unauthorized: Identity lacks retailer context.");
    }

    // Infrastructure Simulation Data
    const totalScans = 4829;
    const uniqueScans = 3210;
    const identifiedShoppers = 1184;

    // PROTECTION: Avoid NaN on zero-scan sessions
    const safeUniqueScans = Math.max(1, uniqueScans);
    const safeTotalScans = Math.max(1, totalScans);

    const engagement = {
        totalScans,
        uniqueScans,
        identifiedShoppers,
        profileConversionRate: (identifiedShoppers / safeUniqueScans) * 100,
        engagementDuration: 32,
        scanRate: 5.4,
        authMethodBreakdown: {
            phone: 45,
            google: 32,
            apple: 15,
            email: 8,
        }
    };

    const avgBasketSizeNonAoe = 185.50;
    const basketUpliftPercentage = 12.5;
    const avgBasketSizeAoe = avgBasketSizeNonAoe * (1 + basketUpliftPercentage / 100);
    const basketSizeIncreaseRand = avgBasketSizeAoe - avgBasketSizeNonAoe;

    const aoeTransactions = Math.floor(uniqueScans * 0.25);
    const associatedRevenue = aoeTransactions * avgBasketSizeAoe;
    const calculatedUplift = aoeTransactions * basketSizeIncreaseRand;

    const conversion = {
        avgBasketSizeAoe,
        avgBasketSizeNonAoe,
        basketSizeIncreaseRand,
        basketSizeIncreasePercent: basketUpliftPercentage,
        associatedRevenue,
        calculatedUplift,
        salesUpliftPercentage: 14.8,
        conversionRate: 22.4,
        scanToPurchaseConversion: (aoeTransactions / safeTotalScans) * 100,
        assistedSales: Math.floor(aoeTransactions * 0.65),
        offerRedemptionRate: 18.2,
        totalRedeemedValue: 7280.50,
        aoeTransactions
    };
    
    return {
        engagement,
        conversion,
        overallPerformance: `The Persistent Intelligence Layer is demonstrating high velocity adoption with a calculated uplift of R${calculatedUplift.toLocaleString()} (SIM). Identified Profile conversion is strong at ${engagement.profileConversionRate.toFixed(1)}%, and the scan-to-purchase conversion is currently associated with 25% of sessions.`,
        conclusions: `- AI Guidance is associated with a R${basketSizeIncreaseRand.toFixed(2)} increase in average basket size.\n- 65% of associated sales are 'Assisted Sales', where the AI Assistant provided product information.\n- Mobile OTP remains the dominant identity entry point, capturing high-intent shoppers instantly.`,
        recommendations: "- Scale 'Assisted Sales' by integrating real-time stock availability into AI responses.\n- Monitor 'Calculated Uplift' items to further validate high-margin co-occurrence.\n- Refine the scan-to-purchase journey for low-conversion categories identified in the Intent-Gap analysis."
    };
  }
);