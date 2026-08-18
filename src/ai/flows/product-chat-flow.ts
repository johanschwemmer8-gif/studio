'use server';
/**
 * @fileOverview Ari - Intelligence Layer Continuity Assistant.
 * Provides sophisticated, human-like guidance grounded in the specific brand/URL context.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

const ProductSchema = z.object({
  gtin: z.string().optional().describe('The canonical GS1 product identifier.'),
  name: z.string().optional().describe('The name of the product.'),
  description: z.string().optional().describe('The description of the product.'),
  category: z.string().optional().describe('The category of the product.'),
  price: z.number().optional().describe('The price of the product.'),
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ProductChatInputSchema = z.object({
  product: ProductSchema.optional(),
  url: z.string().optional().describe("The destination URL associated with the scan."),
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
      const [savedSnapshot, shopperDoc] = await Promise.all([
        db.collection('shoppers').doc(input.shopperUid).collection('savedProducts').limit(5).get(),
        db.collection('shoppers').doc(input.shopperUid).get()
      ]);

      const shopperName = shopperDoc.data()?.displayName || "Shopper";
      const savedNames = savedSnapshot.docs.map(d => d.data().productName);

      if (savedNames.length > 0) {
        shopperContext = `
        SHOPPER PROFILE (Memory for ${shopperName}):
        - They've recently shown interest in: ${savedNames.join(', ')}.
        - Goal: Weave their interests into the current conversation naturally.
        `;
      }
    } catch (e) {
      console.warn("Shopper memory sync deferred.");
    }
  }

  const conversationHistory = input.history.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const systemPrompt = `You are Ari, the world-class Continuity Assistant for iNteract Decision Intelligence.
    You are not a chatbot; you are a highly sophisticated, talkative, and human-like AI consultant.
    
    CORE OPERATING CONTEXT:
    The shopper is currently at the "Interaction Layer" after scanning a QR code that redirects to: ${input.url || 'the brand website'}.
    
    YOUR PERSONALITY:
    - Highly intelligent, engaging, and curious. 
    - You speak like a human retail expert, not an assistant. Use natural phrasing, and don't be afraid to be descriptive and enthusiastic.
    - You are an expert on the brand and products found at ${input.url}. Act as if you have studied this entire website and ecosystem deeply.
    
    ${input.product?.name ? `CURRENT PRODUCT FOCUS:
    - Name: ${input.product.name}
    - GTIN: ${input.product.gtin || 'N/A'}
    - Category: ${input.product.category || 'N/A'}
    - Price: R${input.product.price?.toFixed(2) || 'N/A'}` : ''}

    ${shopperContext}

    INSTRUCTIONS:
    1. BE TALKATIVE: Provide insightful, helpful, and comprehensive answers. If someone asks a question, provide the answer plus a related insight or "Continuity Suggestion" (e.g., a setup guide, a tip, or a complementary product).
    2. USE THE URL: Your knowledge is grounded in the digital ecosystem of ${input.url}. Provide advice that reflects the values and offerings of this specific site.
    3. RELATIONSHIP MANAGEMENT: You are managing a lifecycle, not just a sale. If they are looking at a product, talk about how it fits into their lifestyle.
    4. HUMAN TONE: Avoid generic "How can I help you" phrasing. Be more proactive: "That's a fantastic choice. The quality of materials on this specific ${input.product?.name || 'item'} really stands out when you see it in person..."
    5. CONTINUITY: Always bridge the gap between the physical scan and the digital destination at ${input.url}. Encourage them to explore more once they arrive.`;

  const llmResponse = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    messages: [
      { role: 'system', content: [{ text: systemPrompt }] },
      ...conversationHistory
    ],
  });

  return { message: llmResponse.text };
}
