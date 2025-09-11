
'use server';
/**
 * @fileOverview A Genkit flow to generate AI-powered marketing content for a QR code campaign.
 *
 * - generateCampaignAI - A callable function to generate AI content for a specific request.
 * - GenerateCampaignAIInput - The input type for the flow.
 * - GenerateCampaignAIOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const AIOutputsSchema = z.object({
  landingCopy: z.string().describe('Engaging and brief copy for the campaign landing page.'),
  cta: z.string().describe('A compelling call-to-action to encourage user interaction.'),
  scanTriggers: z.array(z.string()).describe('Creative ideas or phrases to motivate customers to scan the QR code.'),
});
export type GenerateCampaignAIOutput = z.infer<typeof AIOutputsSchema>;


const GenerateCampaignAIInputSchema = z.object({
  requestId: z.string(),
});
export type GenerateCampaignAIInput = z.infer<typeof GenerateCampaignAIInputSchema>;


export async function generateCampaignAI(input: GenerateCampaignAIInput): Promise<GenerateCampaignAIOutput> {
  // In a real Firebase environment, you would check for App Check and Auth context here.
  return generateCampaignAIFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateCampaignAIPrompt',
    input: { schema: z.object({
        retailerName: z.string(),
        campaignId: z.string(),
        aiTone: z.string(),
        aiGoal: z.string(),
    })},
    output: { schema: AIOutputsSchema },
    prompt: `You are an expert marketing copywriter for a retail technology company.
    Your task is to generate compelling content for a QR code campaign based on the provided details.

    **Retailer Name:** {{{retailerName}}}
    **Campaign ID:** {{{campaignId}}}
    
    **Tone for the campaign:** {{{aiTone}}}
    **Goal of the campaign:** {{{aiGoal}}}

    **Instructions:**
    1.  **Landing Page Copy:** Write a short, engaging paragraph for the mobile landing page that customers see after scanning. It should align with the specified tone and goal.
    2.  **Call to Action (CTA):** Create a clear and concise call-to-action button text that drives the user towards the campaign goal.
    3.  **Scan Triggers:** Brainstorm a few creative, short phrases that could be printed near the QR code to entice customers to scan it. Examples: "Scan for a Surprise," "Unlock Your Offer," "See it in Your Room."

    Format your response as a JSON object with 'landingCopy', 'cta', and 'scanTriggers' fields.
    `,
});

const generateCampaignAIFlow = ai.defineFlow(
  {
    name: 'generateCampaignAIFlow',
    inputSchema: GenerateCampaignAIInputSchema,
    outputSchema: AIOutputsSchema,
  },
  async ({ requestId }) => {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }

    const requestRef = db.collection('bulkQrRequests').doc(requestId);
    
    try {
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) {
            throw new Error(`Request with ID ${requestId} not found.`);
        }

        const requestData = requestDoc.data()!;
        const { retailerId, campaignId, options } = requestData;
        const { aiTone, aiGoal } = options || {};

        if (!aiTone || !aiGoal) {
            throw new Error('AI Tone and Goal are required to generate content.');
        }

        // Fetch retailer name from the tenants collection for more context
        const tenantDoc = await db.collection('tenants').doc(retailerId).get();
        const retailerName = tenantDoc.exists ? tenantDoc.data()!.name : retailerId;

        const { output } = await prompt({
            retailerName,
            campaignId,
            aiTone,
            aiGoal
        });

        if (!output) {
            throw new Error("AI failed to generate content.");
        }
        
        await requestRef.update({
            aiOutputs: output,
            aiStatus: 'READY',
            aiError: admin.firestore.FieldValue.delete(), // Clear previous error
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return output;

    } catch (error: any) {
        await requestRef.update({
            aiStatus: 'ERROR',
            aiError: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(console.error); // Best effort to update with error
        
        throw error;
    }
  }
);
