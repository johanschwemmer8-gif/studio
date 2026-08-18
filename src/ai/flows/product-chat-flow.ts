'use server';
/**
 * @fileOverview Ari - Intelligence Layer Product Assistant.
 * Provides Lifecycle Intelligence including reorders, refills, tutorials, and setup guides.
 *
 * - productChat - Handles chat with awareness of product lifecycle and shopper memory.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

/**
 * ARCHITECTURAL RULE:
 * Every Intelligence Layer flow MUST identify products via GTIN.
 * Legacy IDs are strictly forbidden as input.
 */
const ProductSchema = z.object({
  gtin: z.string().length(14, "GTIN must be exactly 14 digits.").describe('The canonical GS1 product identifier.'),
  name: z.string().describe('The name of the product.'),
  description: z.string().describe('The description of the product.'),
  category: z.string().describe('The category of the product.'),
  price: z.number().describe('The price of the product.'),
  refillCycleDays: z.number().optional().describe('Days between typical refills/reorders.'),
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ProductChatInputSchema = z.object({
  product: ProductSchema,
  history: z.array(ChatMessageSchema).describe("The chat history."),
  shopperUid: z.string().optional().describe("The persistent ID of the shopper."),
});
export type ProductChatInput = z.infer<typeof ProductChatInputSchema>;

const ProductChatOutputSchema = z.object({
  message: z.string().describe("The model's response."),
});
export type ProductChatOutput = z.infer<typeof ProductChatOutputSchema>;

export async function productChat(input: ProductChatInput): Promise<ProductChatOutput> {
  let shopperContext = "";

  if (input.shopperUid) {
    try {
      const [savedSnapshot, interactionsSnapshot, shopperDoc] = await Promise.all([
        db.collection('shoppers').doc(input.shopperUid).collection('savedProducts').limit(5).get(),
        db.collection('shoppers').doc(input.shopperUid).collection('interactions').orderBy('timestamp', 'desc').limit(5).get(),
        db.collection('shoppers').doc(input.shopperUid).get()
      ]);

      const shopperName = shopperDoc.data()?.displayName || "Shopper";
      const savedNames = savedSnapshot.docs.map(d => d.data().productName);
      const pastEvents = interactionsSnapshot.docs.map(d => d.data().eventType);

      if (savedNames.length > 0 || pastEvents.length > 0) {
        shopperContext = `
        SHOPPER PERSISTENT HISTORY (Memory for ${shopperName}):
        - Recently Saved Items: ${savedNames.join(', ') || 'None'}
        - Recent Interaction Types: ${pastEvents.join(', ') || 'None'}
        
        CONTINUITY OBJECTIVES:
        - Reorder/Refill: If they bought this before, remind them of their typical refill cycle (${input.product.refillCycleDays || '30'} days).
        - Tutorials: Offer a "Setup Guide" or "Tutorial" if this is a first-time exploration.
        - Recipe/Usage: Suggest a specific use-case or recipe based on their category interest.
        - Warranty: If they just bought it, prompt to "Activate Warranty".
        `;
      }
    } catch (e) {
      console.error("Error fetching shopper context:", e);
    }
  }

  const conversationHistory = input.history.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const systemPrompt = `You are Ari, a highly intelligent Continuity Assistant for iNteract.
    Your goal is to provide expert Lifecycle Guidance. You are not just selling; you are managing a relationship.
    
    CURRENT PRODUCT:
    - Name: ${input.product.name}
    - GTIN: ${input.product.gtin}
    - Category: ${input.product.category}
    - Price: R${input.product.price.toFixed(2)}

    ${shopperContext}

    INSTRUCTIONS:
    1. Be conversational, concise, and helpful. Always introduce yourself as Ari if asked.
    2. Proactively offer Continuity Features: Setup Guides, Tutorials, Recipes, and Warranty Activation.
    3. If relevant, remind them when they might need a refill based on their typical cycle.
    4. Use their history to provide "Personalized Follow-up Recommendations".
    5. Always maintain session continuity—act as if this conversation is a seamless part of their overall shopping journey.`;

  const llmResponse = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    messages: [
      { role: 'system', content: [{ text: systemPrompt }] },
      ...conversationHistory
    ],
  });

  return { message: llmResponse.text };
}
