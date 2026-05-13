
'use client';
/**
 * @fileOverview Continuity Engine Interaction Flow.
 * Acts as the relationship infrastructure for returning shoppers.
 * Constructs personalized lifecycle greetings based on persistent behavioral memory.
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
    messages: z.array(z.string()).max(3, "Maximum of 3 messages").describe('Personalized continuity messages.'),
});

const prompt = ai.definePrompt({
    name: 'getScanInteractionPrompt',
    input: { schema: InteractionPromptInputSchema },
    output: { schema: InteractionPromptOutputSchema },
    prompt: `You are the world-class Continuity Assistant for {{retailerName}} Decision Intelligence.
    A shopper has just scanned a product from "{{campaignName}}".

    {{#if shopperName}}
    SHOPPER RECOGNIZED: {{shopperName}}.
    CONTINUITY LOG: They have previously explored these categories: {{join pastInterests ", "}}.
    Acknowledge them by name and reinforce their persistent relationship with the brand.
    Example: "Welcome back {{shopperName}}. We've updated your guidance based on your interest in {{pastInterests.[0]}}."
    {{else}}
    GUEST SHOPPER: Provide a high-energy welcome to the Decision Intelligence platform. Focus on the value of personalized guidance.
    {{/if}}

    Your personality: {{personality}}.
    Operating Objective: Maintain lifecycle continuity and provide buying guidance.
    {{#if constraints}}Constraints: {{constraints}}.{{/if}}

    Generate 1-3 short, engaging messages. Be brief and conversational.`,
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
      throw new Error(`Infrastructure mismatch: QR ${qrId} not found.`);
    }
    const qrData = qrDoc.data()!;

    const fallbackResponse = {
        messages: [],
        destinationUrl: `/product/${qrData.productId || '1'}`,
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
            
            const interactions = await db.collection('product_interactions')
                .where('shopperId', '==', shopperUid)
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();
            
            const categories = new Set<string>();
            for(const doc of interactions.docs) {
                if(doc.data().metadata?.category) categories.add(doc.data().metadata.category);
            }
            pastInterests = Array.from(categories).slice(0, 3);
        }
    }

    const aiProfileId = qrData.aiProfileId || 'default-assistant';

    try {
        const [aiProfileDoc, retailerDoc] = await Promise.all([
            db.collection('ai_profiles').doc(aiProfileId).get(),
            db.collection('tenants').doc(qrData.retailerId).get()
        ]);
        
        const aiProfile = aiProfileDoc.exists ? aiProfileDoc.data()! : {
            personality: 'Expert & Helpful',
            intent: 'Provide persistent buying guidance and lifecycle management.',
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

        return {
          messages: output?.messages || [],
          destinationUrl: `/product/${qrData.productId || '1'}`,
          retailerLogoUrl,
          mediaType: mediaOptions.mediaType,
          mediaUrl: mediaOptions.mediaUrl,
          headline: mediaOptions.headline,
          subhead: mediaOptions.subhead,
        };

    } catch (error) {
        console.error(`Continuity Engine Error (qrId ${qrId}):`, error);
        return { ...fallbackResponse, ...mediaOptions };
    }
  }
);
