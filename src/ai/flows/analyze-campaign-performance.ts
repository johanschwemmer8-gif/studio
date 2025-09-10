
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
    const { output } = await prompt(input);
    return output!;
  }
);
