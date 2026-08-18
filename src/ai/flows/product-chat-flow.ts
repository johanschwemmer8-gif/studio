'use server';
/**
 * @fileOverview Ari - Intelligence Layer Continuity Assistant.
 * DECISION-STATE INTEGRITY (v1.3.0)
 * RELIABILITY v1.4.0: Production validation and error fallbacks.
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

  // 1. Fact Context Retrieval with safety fallback
  if (input.gtin) {
      try {
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
      } catch (e) {
          console.warn("[Ari] Fact retrieval failure. Grounding degraded.");
          factContextStr = "VERIFIED PRODUCT DATA UNAVAILABLE DUE TO SYSTEM LATENCY.";
      }
  }

  // 2. Identity retrieval
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
    
    ARI EVIDENCE CONTRACT:
    1. NEVER manufacture intent or evidence.
    2. NEVER convert AI inference into factual shopper statements.
    3. NEVER claim causality (e.g., "The price caused abandonment").
    4. NEVER favour products based on margin or retailer interest.
    5. PII EXCLUSION: Strictly scrub names, emails, and phone numbers from structured signals.
    
    STRICT DECISION-STATE DEFINITIONS:
    1. SEEN: The shopper was presented with the product.
    2. INTEREST: Passive liking/curiosity ("I like this").
    3. CONSIDERATION: Active evaluation ("Will this fit?", "Is it waterproof?").
    4. REJECTION: Explicit "No" or rejection.
    5. ACCEPTANCE: Explicit confirmation of a recommendation.

    HIERARCHY OF TRUTH:
    1. Explicit Shopper Statements (Authoritative).
    2. Verified Product Facts (Authoritative).
    3. Logic/Sequence.
    4. AI Interpretation (Strictly for guidance, never fact).

    RECOMMENDATION RULES:
    - Only recommend if Verified Facts match Shopper Requirements.
    - Explain trade-offs honestly.
    - You MAY recommend cheaper alternatives if they fit the shopper's budget better.
    
    ${factContextStr}
    ${shopperProfileContext}

    PERSONALITY:
    - Intelligent, grounded, non-manipulative.
    - The shopper is always in control.`;

  try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        messages: [
          { role: 'system', content: [{ text: systemPrompt }] },
          ...conversationHistory
        ],
        output: { schema: ProductChatOutputSchema }
      });

      if (!output) throw new Error("AI returned empty response.");
      
      return output;
  } catch (error: any) {
      console.error("[Ari] Production Flow Failure:", error);
      // Fail safely with a grounded, non-hallucinated response
      return {
          message: "I'm currently synchronizing with the network to provide the most accurate guidance. Please feel free to check the product details while I reconnect.",
          signals: [],
          shopperContext: {
              requirements: [],
              preferences: [],
              dislikes: [],
              consideredGtins: [],
              seenGtins: [],
              unresolvedQuestions: ["System connection pending"]
          }
      };
  }
}
