
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
import { admin } from '@/lib/firebase-admin';

// The input is now optional, as the flow can fetch its own data.
const AnalyzeEngagementMetricsInputSchema = z.object({
  retailerId: z.string().optional(),
  // You could add date range filters, etc. here
}).optional();

// Define the structure of the data the flow will fetch and process.
const EngagementSchema = z.object({
    totalScans: z.number().describe('All QR code scans across all stores.'),
    uniqueScans: z.number().describe('Individual customers who have scanned.'),
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
    
    const engagement = {
        totalScans: 4829,
        uniqueScans: 3210,
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
        overallPerformance: "The iNteract-AOE platform is demonstrating a strong positive impact on customer behavior and sales. A significant 12.5% uplift in basket size for engaged users, coupled with a healthy engagement rate, indicates that the in-store digital experience is effectively driving higher transaction values. While the offer redemption rate is solid, there is an opportunity to further convert the high volume of unique scans into more direct sales.",
        conclusions: "- The platform successfully increases customer spend, proving its ROI.\n- Engagement is high, but there's a gap between scanning a product and redeeming an offer.\n- The average engagement duration of 32 seconds suggests customers are genuinely interested in the content provided.",
        recommendations: "- To boost the conversion rate, consider implementing more aggressive or personalized real-time offers triggered after a user spends more than 45 seconds on a page.\n- Launch a targeted mini-campaign to educate users on the benefits of creating a profile to receive personalized offers, thereby improving redemption rates.\n- A/B test different calls-to-action on the product pages to guide users more effectively towards a purchase or offer redemption."
    };
    
    // --- Step 3: Return the combined result ---
    return {
        engagement,
        conversion,
        ...analysisOutput,
    };
  }
);
