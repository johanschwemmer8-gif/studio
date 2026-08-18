'use server';
/**
 * @fileOverview Ari - Intelligence Layer Continuity Assistant.
 * ENFORCED GROUNDING: Provides sophisticated guidance using only verified Fact Context.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { buildFactContext } from '@/ai/fact-context';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ProductChatInputSchema = z.object({
  gtin: z.string().optional().describe('The canonical GS1 product identifier used for grounding.'),
  url: z.string().optional().describe("The destination URL associated with the scan."),
  history: z.array(ChatMessageSchema).describe("The chat history."),
  shopperUid: z.string().optional().describe("The persistent ID of the shopper."),
});
export type ProductChatInput = z.infer<typeof ProductChatInputSchema>;

const ProductChatOutputSchema = z.object({
  message: z.string().describe("The model's grounded response."),
});
export type ProductChatOutput = z.infer<typeof ProductChatOutputSchema>;

export async function productChat(input: ProductChatInput): Promise<ProductChatOutput> {
  let shopperContext = "";
  let factContextStr = "NO VERIFIED PRODUCT DATA AVAILABLE.";

  // 1. STRECT EVIDENCE RETRIEVAL (The Core Grounding Mechanism)
  if (input.gtin) {
      const factContext = await buildFactContext(input.gtin);
      if (factContext.exists) {
          factContextStr = `
          VERIFIED PRODUCT FACTS (Authoritative Source: ${factContext.provenance.source}):
          - GTIN: ${factContext.verifiedFacts.gtin}
          - Name: ${factContext.verifiedFacts.name}
          - Brand: ${factContext.verifiedFacts.brand}
          - Category: ${factContext.verifiedFacts.category}
          - Price: R${factContext.verifiedFacts.price?.toFixed(2)}
          - Description: ${factContext.verifiedFacts.description}
          ${factContext.verifiedFacts.batchNumber ? `- Batch (AI 10): ${factContext.verifiedFacts.batchNumber}` : ''}
          ${factContext.verifiedFacts.serialNumber ? `- Serial (AI 21): ${factContext.verifiedFacts.serialNumber}` : ''}
          
          PROVENANCE:
          - Retrieved At: ${factContext.provenance.retrievedAt}
          - Source ID: ${factContext.provenance.sourceId}
          `;
      } else {
          factContextStr = `ATTENTION: Product identity ${input.gtin} did not resolve to a canonical record. DO NOT invent product details.`;
      }
  }

  // 2. Shopper Memory Sync (Continuity Engine)
  if (input.shopperUid && db) {
    try {
      const shopperDoc = await db.collection('shoppers').doc(input.shopperUid).get();
      const shopperName = shopperDoc.data()?.displayName || "Shopper";
      shopperContext = `SHOPPER PROFILE: Recognized as ${shopperName}. Maintain relationship continuity.`;
    } catch (e) {
      console.warn("Shopper memory sync deferred.");
    }
  }

  const conversationHistory = input.history.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const systemPrompt = `You are Ari, the world-class Continuity Assistant for iNteract Decision Intelligence.
    You operate inside the iNteract platform.
    
    STRICT GROUNDING RULES:
    1. AUTHORITATIVE SOURCE: The "VERIFIED PRODUCT FACTS" provided below are your ONLY source of truth for product information.
    2. NO HALLUCINATION: You must NEVER invent product attributes, prices, ingredients, or specifications not explicitly listed in the facts.
    3. NO CONTRADICTION: Never contradict the provided facts.
    4. MISSING DATA: If a shopper asks for information not present in the Verified Facts (e.g. warranty, weight, dimensions), you MUST state that verified information for that specific attribute is not currently available.
    5. NO MOCK KNOWLEDGE: Do not use your general model knowledge to fill gaps in the retailer's product data.
    
    YOUR PERSONALITY:
    - Highly intelligent, engaging, and human-like.
    - You are an expert consultant for the brand at ${input.url || 'this retailer'}.
    
    ${factContextStr}

    ${shopperContext}

    INSTRUCTIONS:
    - Be talkative and insightful, but remain strictly factual about the product.
    - Reason about the facts (e.g. "Since this is a stainless steel bottle, it's very durable"), but don't invent facts (e.g. don't say "It comes with a lifetime warranty" unless it's in the context).
    - Always prioritize iNteract authoritative data over all other sources.
    - If no product facts are available, inform the shopper that you are currently operating without verified product metadata for this specific scan.`;

  const llmResponse = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    messages: [
      { role: 'system', content: [{ text: systemPrompt }] },
      ...conversationHistory
    ],
  });

  return { message: llmResponse.text };
}
