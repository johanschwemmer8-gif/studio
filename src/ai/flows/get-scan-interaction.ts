
'use server';
/**
 * @fileOverview Fetches QR code data, constructs a prompt using an AI profile,
 *               and returns AI-generated engagement messages for the scan interaction screen.
 *
 * - getScanInteraction - Fetches data for the scan interaction screen.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import {
  GetScanInteractionInputSchema,
  type GetScanInteractionInput,
  GetScanInteractionOutputSchema,
  type GetScanInteractionOutput,
} from '@/lib/schemas/scan-interaction';


if (!admin.apps.length) {
  admin.initializeApp();
}

const InteractionPromptInputSchema = z.object({
    retailerName: z.string(),
    campaignName: z.string(),
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

    // Base response with final redirect URL and empty media/messages
    // MODIFIED: Always redirect to the internal product page for product ID 1.
    const fallbackResponse = {
        messages: [],
        destinationUrl: '/product/1',
        retailerLogoUrl: '',
        mediaType: undefined,
        mediaUrl: undefined,
        headline: undefined,
        subhead: undefined,
    };
    
    // Fetch campaign-level settings if requestId exists
    let mediaOptions: any = {};
    if (qrData.requestId) {
        const requestDoc = await db.collection('bulkQrRequests').doc(qrData.requestId).get();
        if (requestDoc.exists) {
            mediaOptions = requestDoc.data()?.options || {};
        }
    }
    
    // If no AI profile is attached, return immediately with media if available.
    if (!qrData.aiProfileId) {
      return { ...fallbackResponse, ...mediaOptions };
    }

    try {
        const [aiProfileDoc, retailerDoc] = await Promise.all([
            db.collection('ai_profiles').doc(qrData.aiProfileId).get(),
            db.collection('tenants').doc(qrData.retailerId).get()
        ]);
        
        if (!aiProfileDoc.exists) {
          console.warn(`AI Profile with ID ${qrData.aiProfileId} not found. Skipping interaction.`);
          return { ...fallbackResponse, ...mediaOptions };
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
          return { ...fallbackResponse, retailerLogoUrl, ...mediaOptions };
        }

        await db.collection('qr_interactions').add({
            qrId,
            scanId: 'simulated-scan-id',
            retailerId: qrData.retailerId,
            aiProfileId: qrData.aiProfileId,
            interactionShownAt: admin.firestore.FieldValue.serverTimestamp(),
            messages: output.messages,
            continuedClicked: false,
        });

        return {
          messages: output.messages,
          destinationUrl: '/product/1', // MODIFIED: Always redirect to the internal product page
          retailerLogoUrl,
          mediaType: mediaOptions.mediaType,
          mediaUrl: mediaOptions.mediaUrl,
          headline: mediaOptions.headline,
          subhead: mediaOptions.subhead,
        };

    } catch (error) {
        console.error(`Error during scan interaction for qrId ${qrId}:`, error);
        return { ...fallbackResponse, ...mediaOptions };
    }
  }
);
