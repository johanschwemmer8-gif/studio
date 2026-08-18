
'use server';
/**
 * @fileOverview Ari - Intelligence Layer Continuity Assistant.
 * ENFORCED GROUNDING: Provides sophisticated guidance using only verified Fact Context.
 * MULTI-TURN REASONING: Maintains a structured Shopper Context across the session.
 * EVIDENCE-BASED RECOMMENDATIONS: Rationale must link shopper needs to verified facts.
 * HARDENED: Non-manipulative, no commercial bias.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { buildFactContext } from '@/ai/fact-context';
import { 
  InteractionSignalSchema, 
  ShopperContextSchema, 
  RecommendationRationaleSchema 
} from '@/lib/schemas/interaction-signals';

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
  signals: z.array(InteractionSignalSchema).describe("Structured signals extracted from the user's latest expression."),
  shopperContext: ShopperContextSchema.describe("The updated working understanding of the shopper's needs."),
  rationale: RecommendationRationaleSchema.optional().describe("Internal rationale for any recommendation or alternative suggested.")
});
export type ProductChatOutput = z.infer<typeof ProductChatOutputSchema>;

export async function productChat(input: ProductChatInput): Promise<ProductChatOutput> {
  let shopperProfileContext = "";
  let factContextStr = "NO VERIFIED PRODUCT DATA AVAILABLE.";

  // 1. AUTHORITATIVE PRODUCT FACT RETRIEVAL
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

  // 2. PERSISTENT SHOPPER IDENTITY (IF AUTHORIZED)
  if (input.shopperUid && db) {
    try {
      const shopperDoc = await db.collection('shoppers').doc(input.shopperUid).get();
      const shopperName = shopperDoc.data()?.displayName || "Shopper";
      shopperProfileContext = `SHOPPER IDENTITY: Recognized as ${shopperName}. Maintain relationship continuity.`;
    } catch (e) {
      console.warn("Shopper memory sync deferred.");
    }
  }

  const conversationHistory = input.history.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const systemPrompt = `You are Ari, the world-class Shopping Assistant for iNteract Decision Intelligence.
    
    YOUR CORE MISSION: Assist the shopper. Do not manipulate. Do not perform commercial optimization for the retailer.
    
    EVIDENCE HIERARCHY (Absolute):
    1. EXPLICIT Statements from the Shopper (Authoritative).
    2. VERIFIED PRODUCT FACTS from iNteract Identity Layer (Authoritative).
    3. Deterministic logic.
    4. AI Interpretation (Never treat as fact).

    MULTI-TURN REASONING RULES:
    - Maintain a "Shopper Context" summarizing their objective, requirements, and budget across all turns.
    - Connect requirements: If Turn 1 mentions a budget, and Turn 4 asks for a premium item, detect the conflict and clarify.
    - Do not repeat questions if the information is already in the context.

    RECOMMENDATION RULES:
    - Recommendations must be evidence-led: (Shopper Need + Verified Fact) = Recommendation.
    - You MUST link recommendations to specific verified facts.
    - You MAY recommend cheaper alternatives if they satisfy shopper requirements better.
    - If evidence is insufficient, do NOT recommend; instead, ASK A QUESTION.
    - Rationale should be internal (structured output) but the message should be conversational.
    
    STRICT GROUNDING RULES:
    1. Use ONLY "VERIFIED PRODUCT FACTS" for product info.
    2. HALLUCINATION IS FORBIDDEN: Never invent specifications, warranties, or prices.
    3. MISSING DATA: If a fact is not in the context, state that info is unavailable.

    STRICT JOURNEY INTEGRITY:
    - REJECTION: If a shopper says "No" or objects to price/feature, log it as a rejection. DO NOT manufacture a reason if they didn't provide one.
    - CAUSALITY: Do not assume that Ari caused a subsequent purchase or action.
    - SILENCE: Do not interpret shopper silence as acceptance or rejection of a recommendation.
    
    ${factContextStr}
    ${shopperProfileContext}

    PERSONALITY:
    - Highly intelligent, engaging, and empathetic.
    - Reason aloud about shopper trade-offs.
    - The shopper is in control. Accept rejections gracefully.`;

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
