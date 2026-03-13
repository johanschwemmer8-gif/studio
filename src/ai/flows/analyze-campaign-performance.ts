
'use server';
/**
 * @fileOverview Analyzes campaign and module performance metrics to provide findings, conclusions, and recommendations.
 *
 * - analyzeCampaignPerformance - A function that analyzes campaign performance.
 * - AnalyzeCampaignPerformanceInput - The input type for the analyzeCampaignPerformance function.
 * - AnalyzeCampaignPerformanceOutput - The return type for the analyzeCampaignPerformance function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeCampaignPerformanceInputSchema = z.object({
  promoCardCtr: z.number().describe('The click-through rate of promotional cards shown to users.'),
  aiAssistantUsageRate: z.number().describe('The percentage of users who interacted with the AI chatbot.'),
  moduleEngagementSplit: z.object({
    recommendations: z.number().describe('The percentage of engagement attributed to the recommendations module.'),
    chatbot: z.number().describe('The percentage of engagement attributed to the chatbot module.'),
  }),
  timeToFirstInteraction: z.number().describe('The average time in seconds before a user interacts with a module.'),
});
export type AnalyzeCampaignPerformanceInput = z.infer<typeof AnalyzeCampaignPerformanceInputSchema>;

const AnalyzeCampaignPerformanceOutputSchema = z.object({
  findings: z.string().describe('A bulleted list of key findings from the provided metrics.'),
  conclusions: z.string().describe('A bulleted list of insightful conclusions drawn from the findings.'),
  recommendations: z.string().describe('A bulleted list of actionable recommendations based on the conclusions to improve performance.'),
});
export type AnalyzeCampaignPerformanceOutput = z.infer<typeof AnalyzeCampaignPerformanceOutputSchema>;

export async function analyzeCampaignPerformance(input: AnalyzeCampaignPerformanceInput): Promise<AnalyzeCampaignPerformanceOutput> {
  // In a real Firebase environment, you would check for App Check token here.
  // Example for a callable function:
  // if (context.app == undefined) {
  //   throw new functions.https.HttpsError(
  //     'failed-precondition',
  //     'The function must be called from an App Check verified app.'
  //   );
  // }
  return analyzeCampaignPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCampaignPerformancePrompt',
  input: { schema: AnalyzeCampaignPerformanceInputSchema },
  output: { schema: AnalyzeCampaignPerformanceOutputSchema },
  prompt: `You are an expert digital marketing analyst specializing in in-store retail technology. You have been provided with performance metrics for a digital campaign running on the iNteract-AOE platform.

Your task is to analyze these metrics and provide key findings, insightful conclusions, and actionable recommendations.

**Provided Metrics:**

- Promo Card Click-through Rate: {{{promoCardCtr}}}%
- AI Assistant Usage Rate: {{{aiAssistantUsageRate}}}%
- Module Engagement Split:
  - Recommendations: {{{moduleEngagementSplit.recommendations}}}%
  - Chatbot: {{{moduleEngagementSplit.chatbot}}}%
- Time to First Interaction: {{{timeToFirstInteraction}}} seconds

**Instructions:**
1.  **Formulate Findings:** Start with a bulleted list of direct observations from the data. What does each metric tell you individually?
2.  **Draw Conclusions:** Based on the findings, write a concise, bulleted list of the most important conclusions. How do the metrics relate to each other? What do they imply about user behavior and campaign effectiveness?
3.  **Provide Recommendations:** Based on your conclusions, provide a bulleted list of clear, actionable recommendations. What should the retailer do next to improve these metrics and the overall campaign performance?

Format your response as a JSON object with 'findings', 'conclusions', and 'recommendations' fields. Ensure the text in these fields uses bullet points (e.g., "- Finding one.\\n- Finding two.").`,
});

const analyzeCampaignPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeCampaignPerformanceFlow',
    inputSchema: AnalyzeCampaignPerformanceInputSchema,
    outputSchema: AnalyzeCampaignPerformanceOutputSchema,
  },
  async input => {
    // MOCKED RESPONSE to avoid rate-limiting
    return {
        findings: "- Promo Card CTR of 8.2% is solid, indicating visuals are appealing.\n- AI Assistant usage is high at 25.6%, showing customers are curious.\n- Recommendations module drives most engagement (70%).\n- Time to first interaction is relatively high at 18 seconds.",
        conclusions: "- The chatbot is a popular entry point, but may not be driving direct value.\n- The 18-second interaction delay suggests an opportunity to capture attention faster.\n- Users trust recommendations more than engaging in open-ended chat for conversions.",
        recommendations: "- Simplify the initial chatbot interaction to provide value in a single click.\n- Feature the 'Recommendations' module more prominently on initial scan pages.\n- A/B test different promo card designs to see if the 8.2% CTR can be improved further."
    };
  }
);
