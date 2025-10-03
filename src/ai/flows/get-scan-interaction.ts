
'use server';
/**
 * @fileOverview Fetches QR code data, constructs a prompt using an AI profile,
 *               and returns AI-generated engagement messages for the scan interaction screen.
 *
 * - getScanInteraction - Fetches data for the scan interaction screen.
 * - GetScanInteractionInput - The input type for the function.
 * - GetScanInteractionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const GetScanInteractionInputSchema = z.object({
  qrId: z.string(),
});
export type GetScanInteractionInput = z.infer<typeof GetScanInteractionInputSchema>;

export const GetScanInteractionOutputSchema = z.object({
  messages: z.array(z.string()).describe('An array of short, engaging messages from the AI assistant.'),
  destinationUrl: z.string().url().describe('The final URL the user should be redirected to.'),
  retailerLogoUrl: z.string().url().optional().describe('The URL of the retailer\'s logo.'),
});
export type GetScanInteractionOutput = z.infer<typeof GetScanInteractionOutputSchema>;


const InteractionPromptInputSchema = z.object({
    retailerName: z.string(),
    campaignName: z.string(),
    // In a real app, you would fetch and include more product/campaign context
    // productName: z.string().optional(),
    personality: z.string(),
    intent: z.string(),
    constraints: z.string().optional(),
});

const InteractionPromptOutputSchema = z.object({
    messages: z.array(z.string()).max(3, "Maximum of 3 messages").describe('An array of 1-3 short, engaging messages to show the customer.'),
});

const prompt = ai.definePrompt({
    name: 'getScanInteractionPrompt',
    input: { schema: InteractionPromptInputSchema },
    output: { schema: InteractionPromptOutputSchema },
    prompt: `You are a world-class AI shopping assistant for {{retailerName}}.
    A customer has just scanned a QR code from the "{{campaignName}}" campaign.

    Your personality should be: {{personality}}.
    Your goal is to: {{intent}}.
    {{#if constraints}}You must follow these constraints: {{constraints}}.{{/if}}

    Generate 1-3 short, engaging, and friendly messages to greet the customer and get them excited about the product or offer.
    Keep the messages very brief and conversational, suitable for a quick mobile interaction.
    `,
});


export async function getScanInteraction(input: GetScanInteractionInput): Promise<GetScanInteractionOutput> {
  return getScanInteractionFlow(input);
}

const getScanInteractionFlow = ai.defineFlow(
  {
    name: 'getScanInteractionFlow',
    inputSchema: GetScanInteractionInputSchema,
    outputSchema: GetScanInteractionOutputSchema,
  },
  async ({ qrId }) => {
    const db = admin.firestore();

    const qrDoc = await db.collection('qrcodes').doc(qrId).get();
    if (!qrDoc.exists) {
      throw new Error(`QR code with ID ${qrId} not found.`);
    }
    const qrData = qrDoc.data()!;

    // If there's no AI profile, or some other issue, we must have a graceful fallback.
    // The primary goal is to get the user to the product page.
    const fallbackResponse = {
        messages: [],
        destinationUrl: qrData.redirectUrl,
        retailerLogoUrl: '',
    };

    if (!qrData.aiProfileId) {
      return fallbackResponse;
    }

    try {
        const [aiProfileDoc, retailerDoc] = await Promise.all([
            db.collection('ai_profiles').doc(qrData.aiProfileId).get(),
            db.collection('tenants').doc(qrData.retailerId).get() // Assuming tenant info is in 'tenants' collection
        ]);
        
        if (!aiProfileDoc.exists) {
          console.warn(`AI Profile with ID ${qrData.aiProfileId} not found. Skipping interaction.`);
          return fallbackResponse;
        }

        const aiProfile = aiProfileDoc.data()!;
        const retailerName = retailerDoc.exists ? retailerDoc.data()!.name : 'our store';
        const retailerLogoUrl = retailerDoc.exists ? retailerDoc.data()!.logoUrl : undefined;

        const { output } = await prompt({
            retailerName,
            campaignName: qrData.campaignId,
            personality: aiProfile.personality,
            intent: Array.isArray(aiProfile.intent) ? aiProfile.intent.join(', ') : aiProfile.intent,
            constraints: aiProfile.constraints,
        });

        if (!output?.messages || output.messages.length === 0) {
          console.warn('AI generated no messages. Skipping interaction.');
          return { ...fallbackResponse, retailerLogoUrl };
        }

        // Log the interaction to Firestore for analytics
        await db.collection('qr_interactions').add({
            qrId,
            scanId: 'simulated-scan-id', // In a real app, you'd pass a unique scan ID
            retailerId: qrData.retailerId,
            aiProfileId: qrData.aiProfileId,
            interactionShownAt: admin.firestore.FieldValue.serverTimestamp(),
            messages: output.messages,
            continuedClicked: false,
        });

        return {
          messages: output.messages,
          destinationUrl: qrData.redirectUrl,
          retailerLogoUrl,
        };

    } catch (error) {
        console.error(`Error during scan interaction for qrId ${qrId}:`, error);
        // If anything in the AI interaction fails, we still want to redirect the user.
        return fallbackResponse;
    }
  }
);
