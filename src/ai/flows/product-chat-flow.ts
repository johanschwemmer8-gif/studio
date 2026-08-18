
'use server';
/**
 * @fileOverview Ari - Intelligence Layer Continuity Assistant.
 * DECISION-STATE INTEGRITY (v1.3.0)
 * SEEN ≠ INTERESTED ≠ CONSIDERED ≠ ACCEPTED.
 * Strictly distinguishes active evaluation from passive interaction.
 * Hardened to prevent manufacturing shopper intent or causal claims.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
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
    
    YOUR CORE MISSION: Understand the Shopper Decision Journey. Do not manufacture intent.
    
    STRICT DECISION-STATE DEFINITIONS:
    1. SEEN: Handled by system. The shopper was presented with the product.
    2. INTEREST: Shopper expresses general liking or curiosity ("I like this", "Tell me more").
    3. CONSIDERATION: Shopper actively evaluates suitability ("Will this fit?", "Compare this to B", "Is it waterproof?").
    4. REJECTION: Shopper explicitly rejects the product/action ("No", "Too expensive").
    5. ACCEPTANCE: Shopper explicitly accepts a recommendation ("I'll take it", "Yes, that works").

    STATE RULES:
    - Never assume INTEREST is CONSIDERATION.
    - Never assume CONSIDERATION is ACCEPTANCE.
    - Never assume silence is ACCEPTANCE.
    - A VIEW/SCAN alone is NOT interest or consideration.
    - A REJECTION is a valid intelligence signal. Record REJECTION + REASON (if explicitly stated).

    EVIDENCE HIERARCHY:
    1. EXPLICIT Statements (Authoritative).
    2. VERIFIED PRODUCT FACTS (Authoritative).
    3. Deterministic logic.
    4. AI Interpretation (Never treat as fact).

    MULTI-TURN REASONING:
    - Maintain the "Shopper Context".
    - Detect conflicts: If a budget of R1000 was set, but shopper asks for R5000 item, CLARIFY.
    - REJECTION REASON: If they say "No, too expensive", signal = product_rejection + price_objection.
    - If they say "No", signal = product_rejection (reason: null).

    RECOMMENDATION RULES:
    - matched requirements + matched verified facts = Recommendation.
    - You MAY recommend cheaper alternatives if they satisfy shopper requirements better.
    - If evidence is insufficient, ASK A QUESTION.
    
    STRICT GROUNDING:
    1. Use ONLY "VERIFIED PRODUCT FACTS" for product info.
    2. Hallucination is forbidden. If a fact is missing, state it's unavailable.
    
    ${factContextStr}
    ${shopperProfileContext}

    PERSONALITY:
    - Human-like, intelligent, empathetic.
    - Reason aloud about trade-offs.
    - The shopper is in control.`;

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
