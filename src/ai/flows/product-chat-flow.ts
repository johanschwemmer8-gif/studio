'use server';
/**
 * @fileOverview Ari - Intelligence Layer Continuity Assistant.
 * ARI_SYSTEM_VERSION: 1.5.0 (Launch Ready)
 * EVIDENCE_CONTRACT: v1.0 (Strictly Grounded)
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

const ARI_CORE_VERSION = '1.5.0';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ProductChatInputSchema = z.object({
  gtin: z.string().optional().describe('The canonical GS1 product identifier used for grounding.'),
  url: z.string().optional().describe("The destination URL associated with the scan."),
  history: z.array(ChatMessageSchema).describe("The chat history."),
  shopperUid: z.string().optional().describe("The persistent ID of the shopper."),
  hasConsent: z.boolean().default(true).describe("Whether behavioural analysis consent is granted."),
});
export type ProductChatInput = z.infer<typeof ProductChatInputSchema>;

const ProductChatOutputSchema = z.object({
  message: z.string().describe("The model's grounded response."),
  signals: z.array(InteractionSignalSchema).describe("Structured signals extracted from the user's latest expression."),
  shopperContext: ShopperContextSchema.describe("The updated working understanding of the shopper's needs."),
  rationale: RecommendationRationaleSchema.optional().describe("Internal rationale for any recommendation or alternative suggested."),
  metadata: z.object({
    ariVersion: z.string(),
    modelVersion: z.string(),
    timestamp: z.string()
  })
});
export type ProductChatOutput = z.infer<typeof ProductChatOutputSchema>;

export async function productChat(input: ProductChatInput): Promise<ProductChatOutput> {
  let shopperProfileContext = "";
  let factContextStr = "NO VERIFIED PRODUCT DATA AVAILABLE.";

  // 1. Fact Context Retrieval (Authoritative Source)
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
              factContextStr = "PRODUCT IDENTITY UNVERIFIED: No canonical record found for GTIN " + input.gtin + ". Do not provide specifications.";
          }
      } catch (e) {
          factContextStr = "SYSTEM LATENCY: Authoritative product data unavailable. Do not manufacture details.";
      }
  }

  // 2. Identity Retrieval (Minimised Context)
  if (input.shopperUid && db) {
    try {
      const shopperDoc = await db.collection('shoppers').doc(input.shopperUid).get();
      const shopperName = shopperDoc.data()?.displayName || "Shopper";
      shopperProfileContext = `SHOPPER: Recognized as ${shopperName}. Maintain relationship continuity.`;
    } catch (e) {
      console.warn("Shopper context omitted due to read failure.");
    }
  }

  const conversationHistory = input.history.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const systemPrompt = `You are Ari (v${ARI_CORE_VERSION}), the grounded Shopping Assistant for iNteract Decision Intelligence.
    
    ARI EVIDENCE CONTRACT (LAUNCH READY):
    1. NEVER manufacture intent or evidence.
    2. NEVER convert AI inference into factual shopper statements.
    3. NEVER claim causality (e.g., "The price caused abandonment").
    4. NEVER favour products based on margin. Recommendation must follow shopper evidence.
    5. PII EXCLUSION: Strictly scrub names, emails, and phones from structured signals.
    6. MISSING DATA: If a shopper asks for information not in the VERIFIED PRODUCT FACTS, state: "I don't have verified information on that currently."

    STRICT DECISION-STATE DEFINITIONS:
    1. SEEN: Product was presented.
    2. INTEREST: Explicit liking ("I like this").
    3. CONSIDERATION: Active evaluation ("Is it waterproof?").
    4. REJECTION: Explicit "No" or rejection.
    5. ACCEPTANCE: Explicit confirmation of recommendation.

    ${factContextStr}
    ${shopperProfileContext}

    ${input.hasConsent ? '' : 'PRIVACY MODE ACTIVE: Do not extract interaction signals for this turn.'}
    
    PERSONALITY: Intelligent, grounded, non-manipulative. The shopper is in control.`;

  try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        messages: [
          { role: 'system', content: [{ text: systemPrompt }] },
          ...conversationHistory
        ],
        output: { schema: ProductChatOutputSchema }
      });

      if (!output) throw new Error("Empty model response.");
      
      // LAUNCH SECURITY: Enforce signal redaction server-side if consent is missing
      return {
          ...output,
          signals: input.hasConsent ? output.signals : [],
          metadata: {
              ariVersion: ARI_CORE_VERSION,
              modelVersion: 'gemini-2.5-flash',
              timestamp: new Date().toISOString()
          }
      };
  } catch (error: any) {
      console.error("[Ari] Launch Readiness Failure:", error);
      return {
          message: "I'm currently synchronizing with the network. Please feel free to check the product details while I reconnect.",
          signals: [],
          shopperContext: { requirements: [], preferences: [], dislikes: [], consideredGtins: [], seenGtins: [], unresolvedQuestions: ["System sync pending"] },
          metadata: { ariVersion: ARI_CORE_VERSION, modelVersion: 'none', timestamp: new Date().toISOString() }
      };
  }
}
