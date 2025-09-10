
'use server';
/**
 * @fileOverview Analyzes behavioral and loyalty metrics to provide findings, conclusions, and recommendations.
 *
 * - analyzeBehavioralInsights - A function that analyzes behavioral insights.
 * - AnalyzeBehavioralInsightsInput - The input type for the analyzeBehavioralInsights function.
 * - AnalyzeBehavioralInsightsOutput - The return type for the analyzeBehavioralInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeBehavioralInsightsInputSchema = z.object({
  repeatScansPerShopper: z.number().describe('The average number of repeat scans per unique shopper.'),
  redemptionFrequency: z.number().describe('The average number of days between offer redemptions for a user.'),
  topRedeemedOffers: z.array(z.string()).describe('A list of the most popular redeemed offers.'),
  customerSegmentation: z.object({
    highValue: z.number().describe('The percentage of customers classified as high value.'),
    loyal: z.number().describe('The percentage of customers classified as loyal.'),
    atRisk: z.number().describe('The percentage of customers classified as at risk.'),
  }),
});
export type AnalyzeBehavioralInsightsInput = z.infer<typeof AnalyzeBehavioralInsightsInputSchema>;

const AnalyzeBehavioralInsightsOutputSchema = z.object({
  findings: z.string().describe('A bulleted list of key findings from the provided metrics.'),
  conclusions: z.string().describe('A bulleted list of insightful conclusions drawn from the findings.'),
  recommendations: z.string().describe('A bulleted list of actionable recommendations based on the conclusions to improve loyalty and engagement.'),
});
export type AnalyzeBehavioralInsightsOutput = z.infer<typeof AnalyzeBehavioralInsightsOutputSchema>;

export async function analyzeBehavioralInsights(input: AnalyzeBehavioralInsightsInput): Promise<AnalyzeBehavioralInsightsOutput> {
  return analyzeBehavioralInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBehavioralInsightsPrompt',
  input: { schema: AnalyzeBehavioralInsightsInputSchema },
  output: { schema: AnalyzeBehavioralInsightsOutputSchema },
  prompt: `You are an expert customer loyalty and retail analyst. You have been provided with behavioral insights from the iNteract-AOE platform.

Your task is to analyze these metrics and provide key findings, insightful conclusions, and actionable recommendations to improve customer loyalty and drive repeat business.

**Provided Metrics:**

- Repeat Scans per Shopper: {{{repeatScansPerShopper}}}
- Redemption Frequency: {{{redemptionFrequency}}} days
- Top Redeemed Offers:
{{#each topRedeemedOffers}}
  - {{{this}}}
{{/each}}
- Customer Segmentation:
  - High Value: {{{customerSegmentation.highValue}}}%
  - Loyal: {{{customerSegmentation.loyal}}}%
  - At Risk: {{{customerSegmentation.atRisk}}}%

**Instructions:**
1.  **Formulate Findings:** Start with a bulleted list of direct observations from the data. What does each metric suggest about customer habits?
2.  **Draw Conclusions:** Based on the findings, write a concise, bulleted list of the most important conclusions. How do these metrics interrelate? What do they imply about the effectiveness of the loyalty program?
3.  **Provide Recommendations:** Based on your conclusions, provide a bulleted list of clear, actionable recommendations. What specific strategies should be implemented to nurture loyalty, re-engage 'at-risk' customers, and leverage the 'high-value' segment?

Format your response as a JSON object with 'findings', 'conclusions', and 'recommendations' fields. Ensure the text in these fields uses bullet points (e.g., "- Finding one.\\n- Finding two.").`,
});

const analyzeBehavioralInsightsFlow = ai.defineFlow(
  {
    name: 'analyzeBehavioralInsightsFlow',
    inputSchema: AnalyzeBehavioralInsightsInputSchema,
    outputSchema: AnalyzeBehavioralInsightsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
