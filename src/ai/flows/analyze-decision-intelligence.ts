'use server';
/**
 * @fileOverview Decision Intelligence Engine Flow.
 * Processes raw behavioural events to generate deep retail insights like hesitation and intent gaps.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IntentGapSchema = z.object({
    productId: z.string(),
    productName: z.string(),
    engagementScore: z.number().describe('High scan/chat activity (0-100)'),
    conversionRate: z.number().describe('Actual save/purchase rate (%)'),
    gapIndicator: z.enum(['Price Sensitivity', 'Missing Information', 'Poor Reviews', 'Low Availability']),
});

const DecisionIntelligenceOutputSchema = z.object({
    intentGaps: z.array(IntentGapSchema),
    hesitationMetrics: z.object({
        avgDwellBeforeDecision: z.number().describe('Seconds spent before saving or abandoning'),
        hesitationIndex: z.number().describe('Percentage of repeat scans on same products without save'),
        topHesitationCategories: z.array(z.string()),
    }),
    aiInteractionInsights: z.object({
        topShopperQuestions: z.array(z.object({
            topic: z.string(),
            frequency: z.number(),
            sentiment: z.number(),
        })),
        aiResolutionRate: z.number().describe('Percentage of chats that ended in a product save'),
    }),
    categoryEngagement: z.array(z.object({
        category: z.string(),
        uniqueScanners: z.number(),
        repeatEngagementRate: z.number(),
    })),
});

export type DecisionIntelligenceOutput = z.infer<typeof DecisionIntelligenceOutputSchema>;

export async function analyzeDecisionIntelligence(): Promise<DecisionIntelligenceOutput> {
    return analyzeDecisionIntelligenceFlow();
}

const analyzeDecisionIntelligenceFlow = ai.defineFlow(
    {
        name: 'analyzeDecisionIntelligenceFlow',
        outputSchema: DecisionIntelligenceOutputSchema,
    },
    async () => {
        // In production, this would query Firestore for the last 30 days of InteractionEvents.
        // For this prototype, we return sophisticated mock data derived from the Decision Engine logic.

        return {
            intentGaps: [
                { productId: '1', productName: 'Eco-Friendly Water Bottle', engagementScore: 88, conversionRate: 12, gapIndicator: 'Price Sensitivity' as const },
                { productId: '2', productName: 'Wireless Charging Pad', engagementScore: 94, conversionRate: 8, gapIndicator: 'Missing Information' as const },
                { productId: '3', productName: 'Smart Notebook', engagementScore: 45, conversionRate: 32, gapIndicator: 'Low Availability' as const },
            ],
            hesitationMetrics: {
                avgDwellBeforeDecision: 42,
                hesitationIndex: 18.5,
                topHesitationCategories: ['Electronics', 'Premium Footwear', 'Cosmetics'],
            },
            aiInteractionInsights: {
                topShopperQuestions: [
                    { topic: 'Battery Life', frequency: 154, sentiment: 0.6 },
                    { topic: 'Warranty Details', frequency: 112, sentiment: 0.8 },
                    { topic: 'Comparison with Competitor X', frequency: 89, sentiment: 0.4 },
                    { topic: 'Is it in stock at Store Y?', frequency: 76, sentiment: 0.7 },
                ],
                aiResolutionRate: 64.2,
            },
            categoryEngagement: [
                { category: 'Lifestyle', uniqueScanners: 1240, repeatEngagementRate: 24.5 },
                { category: 'Electronics', uniqueScanners: 980, repeatEngagementRate: 31.2 },
                { category: 'Accessories', uniqueScanners: 750, repeatEngagementRate: 18.9 },
            ]
        };
    }
);
