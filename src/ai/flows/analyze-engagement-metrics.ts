'use server';
/**
 * @fileOverview Analyzes core engagement and conversion metrics to provide conclusions and recommendations.
 *
 * - analyzeEngagementMetrics - A function that analyzes engagement and conversion metrics.
 * - AnalyzeEngagementMetricsInput - The input type for the analyzeEngagementMetrics function.
 * - AnalyzeEngagementMetricsOutput - The return type for the analyzeEngagementMetrics function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// The input is now optional, as the flow can fetch its own data.
const AnalyzeEngagementMetricsInputSchema = z.object({
  retailerId: z.string().optional(),
  // You could add date range filters, etc. here
}).optional();

// Define the structure of the data the flow will fetch and process.
const EngagementSchema = z.object({
    totalScans: z.number().describe('All QR code scans across all stores.'),
    uniqueScans: z.number().describe('Individual customers who have scanned.'),
    identifiedShoppers: z.number().describe('Shoppers who converted from guest to identified profile.'),
    profileConversionRate: z.number().describe('Percentage of unique scanners who created a profile.'),
    engagementDuration: z.number().describe('Average time spent on product page in seconds.'),
    scanRate: z.number().describe('Engagement rate based on total scans vs. unique visitors.'),
});

const ConversionSchema = z.object({
      avgBasketSizeAoe: z.number().describe('Average basket size for users who engaged with the platform.'),
      avgBasketSizeNonAoe: z.number().describe('Average basket size for users who did not engage.'),
      basketUpliftPercentage: z.number().describe('The percentage uplift in basket size for engaged users.'),
      offerRedemptionRate: z.number().describe('Percentage of personalized offers redeemed.'),
      totalRedeemedValue: z.number().describe('Total monetary value of redeemed offers.'),
      aoeTransactions: z.number().describe('Total transactions where a customer engaged with the platform before purchase.'),
});

// The output now includes the fetched data along with the AI analysis.
const AnalyzeEngagementMetricsOutputSchema = z.object({
  engagement: EngagementSchema,
  conversion: ConversionSchema,
  overallPerformance: z.string().describe('A high-level summary of the overall performance based on all provided metrics.'),
  conclusions: z.string().describe('Bulleted list of key conclusions drawn from the metrics.'),
  recommendations: z.string().describe('Bulleted list of actionable recommendations based on the conclusions.'),
});
export type AnalyzeEngagementMetricsOutput = z.infer<typeof AnalyzeEngagementMetricsOutputSchema>;

export async function analyzeEngagementMetrics(input?: z.infer<typeof AnalyzeEngagementMetricsInputSchema>): Promise<AnalyzeEngagementMetricsOutput> {
  return analyzeEngagementMetricsFlow(input);
}


const analyzeEngagementMetricsFlow = ai.defineFlow(
  {
    name: 'analyzeEngagementMetricsFlow',
    inputSchema: AnalyzeEngagementMetricsInputSchema,
    outputSchema: AnalyzeEngagementMetricsOutputSchema,
  },
  async (filters) => {
    
    // --- Step 1: Fetch and calculate metrics ---
    // For this demonstration, we use fixed, realistic data to ensure consistency for screenshots.
    
    const uniqueScans = 3210;
    const identifiedShoppers = 1184; // 36.8% conversion

    const engagement = {
        totalScans: 4829,
        uniqueScans,
        identifiedShoppers,
        profileConversionRate: (identifiedShoppers / uniqueScans) * 100,
        engagementDuration: 32,
        scanRate: 5.4,
    };

    const avgBasketSizeNonAoe = 185.50;
    const basketUpliftPercentage = 12.5;
    const avgBasketSizeAoe = avgBasketSizeNonAoe * (1 + basketUpliftPercentage / 100);
    const offerRedemptionRate = 18.2;
    const totalRedeemedValue = 3210 * (18.2 / 100) * 12.50; // Avg R12.50 per redemption
    const aoeTransactions = Math.floor(3210 * 0.25); // 25% conversion from unique scans

    const conversion = {
        avgBasketSizeAoe,
        avgBasketSizeNonAoe,
        basketUpliftPercentage,
        offerRedemptionRate,
        totalRedeemedValue,
        aoeTransactions
    };
    
    // --- Step 2: Generate AI analysis from the calculated metrics ---
    // MOCK AI ANALYSIS TO AVOID RATE LIMITING ERRORS DURING DEVELOPMENT/SCREENSHOTS
    const analysisOutput = {
        overallPerformance: "The platform is demonstrating a strong positive impact on customer behavior. A significant 36.8% of guest scanners are converting to identified 'Smart Profiles', creating a persistent retail memory. The 12.5% uplift in basket size for engaged users proves the financial value of AI-driven buying guidance.",
        conclusions: "- The Identity Layer is successfully capturing first-party data (email/phone) from over a third of scanners.\n- AI Guidance is directly correlated with higher transaction values.\n- Average engagement duration of 32 seconds indicates high quality of interaction.",
        recommendations: "- Target the 'Profile-Ready' segment with specific email follow-ups for products they saved but didn't buy.\n- Increase the prominence of the 'Save to Profile' button to push conversion past 40%.\n- A/B test personalized offers exclusively for Identified Shoppers to increase redemption frequency."
    };
    
    // --- Step 3: Return the combined result ---
    return {
        engagement,
        conversion,
        ...analysisOutput,
    };
  }
);
