'use server';
/**
 * @fileOverview Continuity Engine Interaction Flow.
 * Acts as the relationship infrastructure for returning shoppers.
 * Constructs personalized lifecycle greetings based on persistent behavioral memory.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from '@/lib/firebase-admin';
import {
  GetScanInteractionInputSchema,
  type GetScanInteractionInput,
  GetScanInteractionOutputSchema,
  type GetScanInteractionOutput,
} from '@/lib/schemas/scan-interaction';


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
    prompt: `You are Ari, the world-class Continuity Assistant for {{retailerName}} Decision Intelligence.
    Your goal is to provide expert Lifecycle Guidance. You are not just selling; you are managing a relationship.
    A shopper has just scanned a product from "{{campaignName}}".

    {{#if shopperName}}
    SHOPPER RECOGNIZED: {{shopperName}}.
    CONTINUITY LOG: They have previously explored these categories: {{#each pastInterests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    Acknowledge them by name and reinforce their persistent relationship with the brand.
    Example: "Welcome back {{shopperName}}. We've updated your guidance based on your interest in {{pastInterests.[0]}}."
    {{else}}
    GUEST SHOPPER: Provide a high-energy welcome to the Decision Intelligence platform. Focus on the value of personalized guidance.
    {{/if}}

    Your personality: {{personality}}.
    Operating Objective: Maintain lifecycle continuity and provide buying guidance.
    {{#if constraints}}Constraints: {{constraints}}.{{/if}}

    Generate 1-3 short, engaging messages. Be brief and conversational. Always identify yourself as Ari if introducing yourself.`,
});


export async function getScanInteraction(input: GetScanInteractionInput): Promise<GetScanInteractionOutput> {
  const fallbackResponse: GetScanInteractionOutput = {
    messages: ["Hello! Ari here.", "Welcome to the iNteract platform. I'm synchronizing your personalized guidance journey now."],
    destinationUrl: "https://interact-aoe.com", 
    retailerLogoUrl: '',
  };

  try {
    // If it's a test QR, we can provide a faster response if we have context
    if (input.qrId?.startsWith('test_')) {
        console.log(`[Ari] Processing test scan: ${input.qrId}`);
    }

    return await getScanInteractionFlow(input);
  } catch (error: any) {
    // Robust error handling to prevent "Server Error" overlays on mobile
    console.warn("Continuity Engine Simulation: Providing fallback interaction due to infrastructure friction.");
    
    // Attempt to extract destination URL from QR ID if possible as a last resort
    return fallbackResponse;
  }
}

const getScanInteractionFlow = ai.defineFlow(
  {
    name: 'getScanInteractionFlow',
    inputSchema: GetScanInteractionInputSchema,
    outputSchema: GetScanInteractionOutputSchema,
  },
  async ({ qrId, shopperUid }) => {
    const db = getDb();
    
    let destinationUrl = "https://interact-aoe.com";
    let qrData: any = {};
    let mediaOptions: any = {};
    let shopperName: string | undefined;
    let pastInterests: string[] = [];
    let retailerName = 'iNteract';
    let retailerLogoUrl = '';

    // If DB is unavailable, return high-fidelity simulation immediately
    if (!db) {
        return {
            messages: ["Hello! I'm Ari.", "I'm currently operating in simulation mode while we synchronize with the store network.", "You can still view the product details below."],
            destinationUrl,
            retailerLogoUrl: '',
        };
    }

    try {
        const qrDoc = await db.collection('qrcodes').doc(qrId).get();
        if (qrDoc.exists) {
            qrData = qrDoc.data()!;
            destinationUrl = qrData.redirectUrl || `/p/${qrData.gtin || '06001234567891'}`;
            
            if (qrData.requestId) {
                const requestDoc = await db.collection('bulkQrRequests').doc(qrData.requestId).get();
                if (requestDoc.exists) {
                    mediaOptions = requestDoc.data()?.options || {};
                }
            }
        }
    } catch (e) {
        console.warn("QR Metadata fetch failed, using defaults.");
    }
    
    if (shopperUid) {
        try {
            const shopperDoc = await db.collection('shoppers').doc(shopperUid).get();
            if (shopperDoc.exists) {
                const sData = shopperDoc.data()!;
                shopperName = sData.displayName;
                
                const interactions = await db.collection('product_interactions')
                    .where('shopperId', '==', shopperUid)
                    .orderBy('timestamp', 'desc')
                    .limit(5)
                    .get();
                
                const categories = new Set<string>();
                for(const doc of interactions.docs) {
                    if(doc.data().metadata?.category) categories.add(doc.data().metadata.category);
                }
                pastInterests = Array.from(categories).slice(0, 3);
            }
        } catch (e) {
            console.warn("Shopper memory sync deferred.");
        }
    }

    const aiProfileId = qrData.aiProfileId || 'default-assistant';

    try {
        const [aiProfileDoc, retailerDoc] = await Promise.all([
            db.collection('ai_profiles').doc(aiProfileId).get(),
            db.collection('tenants').doc(qrData.retailerId || 'simulated-retailer-id').get()
        ]);
        
        const aiProfile = aiProfileDoc.exists ? aiProfileDoc.data()! : {
            personality: 'Expert & Knowledgeable',
            intent: 'Provide persistent buying guidance and lifecycle management.',
        };
        retailerName = retailerDoc.exists ? retailerDoc.data()!.name : 'iNteract';
        retailerLogoUrl = retailerDoc.exists ? retailerDoc.data()!.logoUrl : '';

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
          messages: output?.messages || ["Hello! I'm Ari.", "Welcome to iNteract. Let's explore more details about this product."],
          destinationUrl,
          retailerLogoUrl,
          mediaType: mediaOptions.mediaType,
          mediaUrl: mediaOptions.mediaUrl,
          headline: mediaOptions.headline,
          subhead: mediaOptions.subhead,
        };

    } catch (error) {
        return { 
            messages: ["Hello! Ari here.", "Welcome to the experience layer. I'm ready to guide your purchase."],
            destinationUrl, 
            retailerLogoUrl,
            ...mediaOptions 
        };
    }
  }
);
