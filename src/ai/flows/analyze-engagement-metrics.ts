
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
    const prompt = ai.definePrompt({
        name: 'analyzeEngagementMetricsPrompt',
        output: { schema: z.object({
            overallPerformance: z.string().describe('A high-level summary of the overall performance based on all provided metrics.'),
            conclusions: z.string().describe('Bulleted list of key conclusions drawn from the metrics.'),
            recommendations: z.string().describe('Bulleted list of actionable recommendations based on the conclusions.'),
        }) },
        prompt: `You are an expert retail analyst. You have been provided with a set of core engagement and conversion metrics for the iNteract-AOE in-store digital platform.

        Your task is to analyze these metrics, write an overall performance summary, provide insightful conclusions, and provide actionable recommendations. It's crucial that you analyze the relationship between the engagement and conversion metrics.

        **Provided Metrics:**

        **Engagement:**
        - Total Scans: ${engagement.totalScans}
        - Unique Scans: ${engagement.uniqueScans}
        - Engagement Rate: ${engagement.scanRate.toFixed(2)}%
        - Average Engagement Duration: ${engagement.engagementDuration} seconds

        **Conversion:**
        - Average Basket Size (AOE Users): R${conversion.avgBasketSizeAoe.toFixed(2)}
        - Average Basket Size (Non-Users): R${conversion.avgBasketSizeNonAoe.toFixed(2)}
        - Basket Uplift Percentage: ${conversion.basketUpliftPercentage.toFixed(2)}%
        - Offer Redemption Rate: ${conversion.offerRedemptionRate.toFixed(2)}%
        - Total Redeemed Value: R${conversion.totalRedeemedValue.toFixed(2)}
        - Transactions Influenced by AOE: ${conversion.aoeTransactions}

        **Instructions:**
        1.  **Summarize Overall Performance:** Start with a paragraph summarizing the overall performance. What is the big picture that the data tells you?
        2.  **Formulate Conclusions:** Based on your analysis, write a concise, bulleted list of the most important conclusions. What does the data say about the platform's performance and its impact on sales?
        3.  **Provide Recommendations:** Based on your conclusions, provide a bulleted list of clear, actionable recommendations. What should the retailer do next to improve both engagement and conversion metrics?

        Format your response as a JSON object with 'overallPerformance', 'conclusions', and 'recommendations' fields. Ensure the text in the 'conclusions' and 'recommendations' fields uses bullet points (e.g., "- Conclusion one.\\n- Conclusion two.").`,
    });

    const { output: analysisOutput } = await prompt();
    if (!analysisOutput) {
        throw new Error('AI analysis failed to generate.');
    }
    
    // --- Step 3: Return the combined result ---
    return {
        engagement,
        conversion,
        ...analysisOutput,
    };
  }
);
