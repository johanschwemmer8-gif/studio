
'use server';
/**
 * @fileOverview Factual analysis of campaign performance metrics.
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
  findings: z.string().describe('A bulleted list of direct observations from the provided metrics.'),
  conclusions: z.string().describe('A bulleted list of insightful associations drawn from the findings.'),
  recommendations: z.string().describe('A bulleted list of clear indicators for performance optimization.'),
});
export type AnalyzeCampaignPerformanceOutput = z.infer<typeof AnalyzeCampaignPerformanceOutputSchema>;

export async function analyzeCampaignPerformance(input: AnalyzeCampaignPerformanceInput): Promise<AnalyzeCampaignPerformanceOutput> {
  return analyzeCampaignPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCampaignPerformancePrompt',
  input: { schema: AnalyzeCampaignPerformanceInputSchema },
  output: { schema: AnalyzeCampaignPerformanceOutputSchema },
  prompt: `You are the iNteract Intelligence Analyst. You have been provided with performance metrics for a digital campaign.

Your task is to provide a factual analysis of these metrics.

STRICT NON-CAUSAL RULES:
1. NEVER use: "caused", "generated", "converted", "drove", "increased", "resulted in".
2. USE: "observed", "associated with", "presents as", "is identified in", "preceded".
3. NO MANUFACTURING: Only describe the numbers provided.

METRICS:
- Promo Card CTR: {{{promoCardCtr}}}%
- AI Assistant Usage: {{{aiAssistantUsageRate}}}%
- Recommendations vs Chatbot Split: {{{moduleEngagementSplit.recommendations}}}% / {{{moduleEngagementSplit.chatbot}}}%
- Time to Interaction: {{{timeToFirstInteraction}}}s

Format the output as a JSON object with 'findings', 'conclusions', and 'recommendations' using bullet points.`,
});

const analyzeCampaignPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeCampaignPerformanceFlow',
    inputSchema: AnalyzeCampaignPerformanceInputSchema,
    outputSchema: AnalyzeCampaignPerformanceOutputSchema,
  },
  async input => {
    // MOCKED RESPONSE: Using strictly non-causal association-led terminology
    return {
        findings: "- Promo Card CTR is observed at 8.2%, indicating visible engagement.\n- AI Assistant usage is recorded in 25.6% of sessions.\n- Recommendations module is associated with 70% of total engagement.\n- Time to first interaction is identified at an average of 18 seconds.",
        conclusions: "- The chatbot represents a common entry node, though direct association with value requires further trace.\n- The 18-second delay is identified as a point of potential session leakage.\n- Shopper patterns show higher frequency of interaction with structured recommendations than open-ended chat.",
        recommendations: "- Evaluate simplifying the initial chatbot interaction to shorten time to first engagement.\n- Feature the 'Recommendations' module more prominently during the initial exposure phase.\n- A/B test promo card visuals to observe variations in the 8.2% CTR baseline."
    };
  }
);
