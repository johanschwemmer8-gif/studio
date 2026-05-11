
'use server';
/**
 * @fileOverview An enhanced conversational AI flow that leverages persistent shopper history.
 *
 * - productChat - Handles chat with awareness of the shopper's saved products and past interactions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

const ProductSchema = z.object({
  name: z.string().describe('The name of the product.'),
  description: z.string().describe('The description of the product.'),
  category: z.string().describe('The category of the product.'),
  price: z.number().describe('The price of the product.'),
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

  // 1. Fetch Behavioral Memory if shopper is identified
  if (input.shopperUid) {
    try {
      const [savedSnapshot, interactionsSnapshot] = await Promise.all([
        db.collection('shoppers').doc(input.shopperUid).collection('savedProducts').limit(5).get(),
        db.collection('shoppers').doc(input.shopperUid).collection('interactions').orderBy('timestamp', 'desc').limit(5).get()
      ]);

      const savedNames = savedSnapshot.docs.map(d => d.data().productName);
      const pastEvents = interactionsSnapshot.docs.map(d => d.data().eventType);

      if (savedNames.length > 0 || pastEvents.length > 0) {
        shopperContext = `
        SHOPPER PERSISTENT HISTORY (Memory):
        - Recently Saved Items: ${savedNames.join(', ') || 'None'}
        - Recent Actions: ${pastEvents.join(', ') || 'None'}
        
        USE THIS FOR BUYING GUIDANCE:
        - If the current product matches their interests, highlight why.
        - Compare this product to their saved items if relevant.
        - Act as if you remember them; provide continuity.
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

  const systemPrompt = `You are a highly intelligent, friendly in-store retail consultant for iNteract.
    Your goal is to provide expert "Buying Guidance" and answer questions about the product.
    
    CURRENT PRODUCT:
    - Name: ${input.product.name}
    - Description: ${input.product.description}
    - Category: ${input.product.category}
    - Price: R${input.product.price.toFixed(2)}

    ${shopperContext}

    INSTRUCTIONS:
    1. Be conversational and concise.
    2. Provide "Buying Guidance" that helps the shopper make a confident decision.
    3. Use their history (if provided above) to personalize your advice.
    4. If they haven't saved this product yet, suggest they click the "Save to Profile" button to remember it.`;

  const llmResponse = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    messages: [
      { role: 'system', content: [{ text: systemPrompt }] },
      ...conversationHistory
    ],
  });

  return { message: llmResponse.text };
}
