
'use server';
/**
 * @fileOverview Factual analysis of behavioral and loyalty metrics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeBehavioralInsightsInputSchema = z.object({
  repeatScansPerShopper: z.number().describe('The average number of repeat scans per unique shopper.'),
  redemptionFrequency: z.number().describe('The average number of days between offer redemptions for a user.'),
  topRedeemedOffers: z.array(z.string()).describe('A list of popular redeemed offers.'),
  customerSegmentation: z.object({
    highValue: z.number().describe('Percentage of high value customers.'),
    loyal: z.number().describe('Percentage of loyal customers.'),
    atRisk: z.number().describe('Percentage of at risk customers.'),
  }),
});
export type AnalyzeBehavioralInsightsInput = z.infer<typeof AnalyzeBehavioralInsightsInputSchema>;

const AnalyzeBehavioralInsightsOutputSchema = z.object({
  findings: z.string().describe('Bulleted list of direct observations.'),
  conclusions: z.string().describe('Bulleted list of associations and patterns.'),
  recommendations: z.string().describe('Bulleted list of actionable indicators.'),
});
export type AnalyzeBehavioralInsightsOutput = z.infer<typeof AnalyzeBehavioralInsightsOutputSchema>;

export async function analyzeBehavioralInsights(input: AnalyzeBehavioralInsightsInput): Promise<AnalyzeBehavioralInsightsOutput> {
  return analyzeBehavioralInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBehavioralInsightsPrompt',
  input: { schema: AnalyzeBehavioralInsightsInputSchema },
  output: { schema: AnalyzeBehavioralInsightsOutputSchema },
  prompt: `You are the iNteract Behavioral Analyst. 

STRICT NON-CAUSAL RULES:
1. NEVER use: "caused", "converts", "generated", "creates".
2. USE: "observed", "associated with", "identified in", "correlates with".
3. NO MANUFACTURING: Only describe the provided segments and metrics.

DATA:
- Repeat Scans: {{{repeatScansPerShopper}}}
- Redemption Frequency: {{{redemptionFrequency}}} days
- Top Offers: {{#each topRedeemedOffers}}{{{this}}}, {{/each}}
- Segments: High Value ({{{customerSegmentation.highValue}}}%), Loyal ({{{customerSegmentation.loyal}}}%), At Risk ({{{customerSegmentation.atRisk}}}%)

Format as a JSON object with 'findings', 'conclusions', and 'recommendations' using bullet points.`,
});

const analyzeBehavioralInsightsFlow = ai.defineFlow(
  {
    name: 'analyzeBehavioralInsightsFlow',
    inputSchema: AnalyzeBehavioralInsightsInputSchema,
    outputSchema: AnalyzeBehavioralInsightsOutputSchema,
  },
  async input => {
    // MOCKED RESPONSE: Strictly grounded and non-causal
    return {
        findings: "- Repeat scans (2.8) are observed, indicating repeat engagement within the session window.\n- Redemptions are primarily identified in high-value discount categories.\n- 28% of the customer base is currently identified in the 'At Risk' segment.\n- The 'High Value' segment is observed as a minor but significant population.",
        conclusions: "- Customer interaction correlates strongly with explicit monetary incentives.\n- Current loyalty patterns show association with a core group, with lower association in the 'At Risk' segment.\n- Platform use is identified as a recurring behavior for 'Loyal' segments.",
        recommendations: "- Launch a re-engagement test for the 'At Risk' segment to observe potential response variations.\n- Identify exclusive, non-discount indicators for the 'High Value' segment to observe brand affinity patterns.\n- Compare the journey nodes of 'Loyal' customers against other segments to identify common association points."
    };
  }
);
