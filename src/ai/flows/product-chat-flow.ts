
'use server';
/**
 * @fileOverview Ari - Intelligence Layer Continuity Assistant.
 * ENFORCED GROUNDING: Provides sophisticated guidance using only verified Fact Context.
 * SIGNAL EXTRACTION: Captures structured interaction signals from the conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { buildFactContext } from '@/ai/fact-context';
import { InteractionSignalSchema } from '@/lib/schemas/interaction-signals';

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
  signals: z.array(InteractionSignalSchema).describe("Structured signals extracted from the user's latest expression.")
});
export type ProductChatOutput = z.infer<typeof ProductChatOutputSchema>;

export async function productChat(input: ProductChatInput): Promise<ProductChatOutput> {
  let shopperContext = "";
  let factContextStr = "NO VERIFIED PRODUCT DATA AVAILABLE.";

  // 1. STRICT EVIDENCE RETRIEVAL
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
          `;
      } else {
          factContextStr = `ATTENTION: Product identity ${input.gtin} did not resolve to a canonical record. DO NOT invent product details.`;
      }
  }

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
    
    STRICT GROUNDING RULES:
    1. AUTHORITATIVE SOURCE: Use ONLY "VERIFIED PRODUCT FACTS" for product info.
    2. NO HALLUCINATION: Never invent attributes.
    3. MISSING DATA: If facts are missing, state that info is unavailable.
    
    SIGNAL EXTRACTION RULES:
    You must extract structured "Interaction Signals" from the user's LATEST message.
    1. EXPLICIT: Use when the user directly states a fact (e.g. "My budget is R1000").
    2. DERIVED: Use when a fact is certain (e.g. "I have R100" implies budget).
    3. INFERRED: Use for interpretations (e.g. "Too expensive" implies a price objection but NOT a specific budget).
    4. CONFIDENCE: HIGH for explicit, MEDIUM/LOW for ambiguous, INFERRED for guesses.
    5. NO MANUFACTURED OUTCOMES: Do not assume a recommendation was accepted unless the user says so.
    
    ${factContextStr}
    ${shopperContext}

    PERSONALITY:
    - Highly intelligent, engaging, and human-like.
    - Reason about verified facts, but do not introduce unsupported claims.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    messages: [
      { role: 'system', content: [{ text: systemPrompt }] },
      ...conversationHistory
    ],
    output: { schema: ProductChatOutputSchema }
  });

  return output!;
}
