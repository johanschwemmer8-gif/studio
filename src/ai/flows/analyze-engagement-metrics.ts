
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

const AnalyzeEngagementMetricsInputSchema = z.object({
  engagement: z.object({
    totalScans: z.number().describe('All QR code scans across all stores.'),
    uniqueScans: z.number().describe('Individual customers who have scanned.'),
    engagementDuration: z.number().describe('Average time spent on product page in seconds.'),
    scanRate: z.number().describe('Engagement rate based on total scans vs. unique visitors.'),
  }),
  conversion: z.object({
      avgBasketSizeAoe: z.number().describe('Average basket size for users who engaged with the platform.'),
      avgBasketSizeNonAoe: z.number().describe('Average basket size for users who did not engage.'),
      basketUpliftPercentage: z.number().describe('The percentage uplift in basket size for engaged users.'),
      offerRedemptionRate: z.number().describe('Percentage of personalized offers redeemed.'),
      totalRedeemedValue: z.number().describe('Total monetary value of redeemed offers.'),
      aoeTransactions: z.number().describe('Total transactions where a customer engaged with the platform before purchase.'),
  }),
});
export type AnalyzeEngagementMetricsInput = z.infer<typeof AnalyzeEngagementMetricsInputSchema>;

const AnalyzeEngagementMetricsOutputSchema = z.object({
  overallPerformance: z.string().describe('A high-level summary of the overall performance based on all provided metrics.'),
  feedback: z.string().describe('Bulleted list of key feedback drawn from the metrics.'),
  recommendations: z.string().describe('Bulleted list of actionable recommendations based on the feedback.'),
});
export type AnalyzeEngagementMetricsOutput = z.infer<typeof AnalyzeEngagementMetricsOutputSchema>;

export async function analyzeEngagementMetrics(input: AnalyzeEngagementMetricsInput): Promise<AnalyzeEngagementMetricsOutput> {
  return analyzeEngagementMetricsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeEngagementMetricsPrompt',
  input: { schema: AnalyzeEngagementMetricsInputSchema },
  output: { schema: AnalyzeEngagementMetricsOutputSchema },
  prompt: `You are an expert retail analyst. You have been provided with a set of core engagement and conversion metrics for the iNteract-AOE in-store digital platform.

Your task is to analyze these metrics, write an overall performance summary, provide insightful feedback, and provide actionable recommendations. It's crucial that you analyze the relationship between the engagement and conversion metrics.

**Provided Metrics:**

**Engagement:**
- Total Scans: {{{engagement.totalScans}}}
- Unique Scans: {{{engagement.uniqueScans}}}
- Engagement Rate: {{{engagement.scanRate}}}%
- Average Engagement Duration: {{{engagement.engagementDuration}}} seconds

**Conversion:**
- Average Basket Size (AOE Users): R{{{conversion.avgBasketSizeAoe}}}
- Average Basket Size (Non-Users): R{{{conversion.avgBasketSizeNonAoe}}}
- Basket Uplift Percentage: {{{conversion.basketUpliftPercentage}}}%
- Offer Redemption Rate: {{{conversion.offerRedemptionRate}}}%
- Total Redeemed Value: R{{{conversion.totalRedeemedValue}}}
- Transactions Influenced by AOE: {{{conversion.aoeTransactions}}}

**Instructions:**
1.  **Summarize Overall Performance:** Start with a paragraph summarizing the overall performance. What is the big picture that the data tells you?
2.  **Formulate Feedback:** Based on your analysis, write a concise, bulleted list of the most important feedback. What does the data say about the platform's performance and its impact on sales?
3.  **Provide Recommendations:** Based on your feedback, provide a bulleted list of clear, actionable recommendations. What should the retailer do next to improve both engagement and conversion metrics?

Format your response as a JSON object with 'overallPerformance', 'feedback', and 'recommendations' fields. Ensure the text in the 'feedback' and 'recommendations' fields uses bullet points (e.g., "- Feedback one.\\n- Feedback two.").`,
});

const analyzeEngagementMetricsFlow = ai.defineFlow(
  {
    name: 'analyzeEngagementMetricsFlow',
    inputSchema: AnalyzeEngagementMetricsInputSchema,
    outputSchema: AnalyzeEngagementMetricsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
