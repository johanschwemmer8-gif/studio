
'use client';
/**
 * @fileOverview Continuity Engine Interaction Flow.
 * Recognizes returning shoppers and constructs personalized greetings based on session memory.
 *
 * - getScanInteraction - Fetches data and personalized greetings for the scan screen.
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
    shopperName: z.string().optional(),
    pastInterests: z.array(z.string()).optional(),
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

    {{#if shopperName}}
    This is a returning customer named {{shopperName}}. 
    {{#if pastInterests}}
    They have previously explored these categories: {{join pastInterests ", "}}.
    {{/if}}
    Acknowledge them by name and briefly reference their continuity with the brand. 
    Example: "Welcome back {{shopperName}}. Good to see you again! Last time you were looking at {{pastInterests.[0]}} products."
    {{else}}
    This is a guest shopper. Provide a standard, high-energy welcome.
    {{/if}}

    Your personality should be: {{personality}}.
    Your goal is to: {{intent}}.
    {{#if constraints}}You must follow these constraints: {{constraints}}.{{/if}}

    Generate 1-3 short, engaging, and friendly messages to greet the customer.
    Keep the messages very brief and conversational.
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
  async ({ qrId, shopperUid }) => {
    const db = admin.firestore();

    const qrDoc = await db.collection('qrcodes').doc(qrId).get();
    if (!qrDoc.exists) {
      throw new Error(`QR code with ID ${qrId} not found.`);
    }
    const qrData = qrDoc.data()!;

    const fallbackResponse = {
        messages: [],
        destinationUrl: '/product/1',
        retailerLogoUrl: '',
        mediaType: undefined,
        mediaUrl: undefined,
        headline: undefined,
        subhead: undefined,
    };
    
    let mediaOptions: any = {};
    if (qrData.requestId) {
        const requestDoc = await db.collection('bulkQrRequests').doc(qrData.requestId).get();
        if (requestDoc.exists) {
            mediaOptions = requestDoc.data()?.options || {};
        }
    }
    
    // --- Continuity Engine: Fetch Shopper Memory ---
    let shopperName: string | undefined;
    let pastInterests: string[] = [];
    
    if (shopperUid) {
        const shopperDoc = await db.collection('shoppers').doc(shopperUid).get();
        if (shopperDoc.exists) {
            const sData = shopperDoc.data()!;
            shopperName = sData.displayName;
            
            // Get last 3 unique categories from history
            const interactions = await db.collection('shoppers').doc(shopperUid).collection('interactions').orderBy('timestamp', 'desc').limit(10).get();
            const categories = new Set<string>();
            for(const doc of interactions.docs) {
                // In real app, look up product category here. 
                // Using metadata for mock simplicity.
                if(doc.data().metadata?.category) categories.add(doc.data().metadata.category);
            }
            pastInterests = Array.from(categories).slice(0, 3);
        }
    }

    // Default Profile if none linked to QR
    const aiProfileId = qrData.aiProfileId || 'default-assistant';

    try {
        const [aiProfileDoc, retailerDoc] = await Promise.all([
            db.collection('ai_profiles').doc(aiProfileId).get(),
            db.collection('tenants').doc(qrData.retailerId).get()
        ]);
        
        const aiProfile = aiProfileDoc.exists ? aiProfileDoc.data()! : {
            personality: 'Friendly & Professional',
            intent: 'Provide product information and Buying Guidance.',
        };
        const retailerName = retailerDoc.exists ? retailerDoc.data()!.name : 'our store';
        const retailerLogoUrl = retailerDoc.exists ? retailerDoc.data()!.logoUrl : undefined;

        const { output } = await prompt({
            retailerName,
            campaignName: qrData.campaignId || 'Product Discovery',
            personality: aiProfile.personality,
            intent: Array.isArray(aiProfile.intent) ? aiProfile.intent.join(', ') : aiProfile.intent,
            constraints: aiProfile.constraints,
            shopperName,
            pastInterests,
        });

        if (!output?.messages || output.messages.length === 0) {
          return { ...fallbackResponse, retailerLogoUrl, ...mediaOptions };
        }

        return {
          messages: output.messages,
          destinationUrl: '/product/1',
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
