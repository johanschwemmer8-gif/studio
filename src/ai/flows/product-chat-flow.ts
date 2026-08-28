'use server';
/**
 * @fileOverview Ari - Intelligence Layer Continuity Assistant.
 * ARI_SYSTEM_VERSION: 1.7.0 (State Feedback Loop & Tenant Isolation Hardened)
 * EVIDENCE_CONTRACT: v1.2 (Strictly Grounded, Stateless to Stateful Loop)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb, admin } from '@/lib/firebase-admin';
import { buildFactContext } from '@/ai/fact-context';
import { 
  InteractionSignalSchema, 
  ShopperContextSchema, 
  RecommendationRationaleSchema 
} from '@/lib/schemas/interaction-signals';

const ARI_CORE_VERSION = '1.7.0';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ProductChatInputSchema = z.object({
  gtin: z.string().optional().describe('The canonical GS1 product identifier used for grounding.'),
  url: z.string().optional().describe("The destination URL associated with the scan."),
  history: z.array(ChatMessageSchema).describe("The chat history."),
  previousContext: ShopperContextSchema.optional().describe("The previous conversational state feedback."),
  shopperUid: z.string().optional().describe("The persistent ID of the shopper."),
  hasConsent: z.boolean().default(false).describe("Whether behavioural analysis and transcript consent is granted."),
  sessionId: z.string().optional().describe("The active session ID for event anchoring."),
  retailerId: z.string().optional().describe("The retailer ID for tenant verification."),
});
export type ProductChatInput = z.infer<typeof ProductChatInputSchema>;

const ProductChatOutputSchema = z.object({
  message: z.string().describe("The model's grounded response."),
  signals: z.array(InteractionSignalSchema).describe("Structured signals extracted from the user's latest expression."),
  shopperContext: ShopperContextSchema.describe("The updated working understanding of the shopper's needs."),
  rationale: RecommendationRationaleSchema.optional().describe("Internal rationale for any recommendation or alternative suggested."),
});
export type ProductChatOutput = z.infer<typeof ProductChatOutputSchema>;

export async function productChat(input: ProductChatInput): Promise<ProductChatOutput> {
  const db = getDb();
  
  // 1. Authoritative Identity Resolution (Tenant Isolation)
  let authorizedRetailerId = input.retailerId || 'unknown';
  if (db && input.sessionId) {
    try {
      const sessionDoc = await db.collection('sessions').doc(input.sessionId).get();
      if (sessionDoc.exists) {
        const sessionData = sessionDoc.data();
        const authoritativeRetailerId = sessionData?.retailerId;
        
        if (authoritativeRetailerId) {
          // Security Gate: Reject client-side spoofing attempt
          if (input.retailerId && input.retailerId !== 'unknown' && input.retailerId !== authoritativeRetailerId) {
            console.error(`[Security] Tenant mismatch! Client: ${input.retailerId}, Session: ${authoritativeRetailerId}`);
            throw new Error("ACCESS_DENIED: Request parameters do not match authorized session tenant.");
          }
          authorizedRetailerId = authoritativeRetailerId;
        }
      }
    } catch (e: any) {
      if (e.message.startsWith("ACCESS_DENIED")) throw e;
      console.warn("[Auth] Session validation deferred due to infrastructure friction:", e.message);
    }
  }

  let shopperProfileContext = "";
  let factContextStr = "NO VERIFIED PRODUCT DATA AVAILABLE.";

  // 2. Fact Context Retrieval (Authoritative & Scoped)
  if (input.gtin) {
      try {
          const factContext = await buildFactContext(input.gtin, authorizedRetailerId);
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
              factContextStr = `PRODUCT IDENTITY UNVERIFIED: No canonical record found for GTIN ${input.gtin} within Retailer ${authorizedRetailerId}. Do not provide specifications.`;
          }
      } catch (e) {
          factContextStr = "SYSTEM LATENCY: Authoritative product data unavailable. Do not manufacture details.";
      }
  }

  // 3. Identity Retrieval (Minimised Context)
  if (input.shopperUid && db) {
    try {
      const shopperDoc = await db.collection('shoppers').doc(input.shopperUid).get();
      const shopperName = shopperDoc.data()?.displayName || "Shopper";
      shopperProfileContext = `SHOPPER: Recognized as ${shopperName}. Maintain relationship continuity.`;
    } catch (e) {
      console.warn("[Shopper Identity] Context omitted due to read failure.");
    }
  }

  const conversationHistory = input.history.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const turnCount = input.previousContext?.turnCount || 1;

  const systemPrompt = `You are Ari (v${ARI_CORE_VERSION}), the grounded Shopping Assistant for iNteract Decision Intelligence.
    
    CURRENT TURN: ${turnCount}

    ARI EVIDENCE CONTRACT (v1.2):
    1. EVIDENCE HIERARCHY: Authoritative Product Data > Explicit Shopper Evidence > AI Interpretation.
    2. NO MANUFACTURING: Never manufacture intent, evidence, or product facts.
    3. NO CAUSALITY: Never claim causality (e.g., "The price caused abandonment"). Use "observed", "associated", or "preceded".
    4. RECOMMENDATION INTEGRITY: Base recommendations ONLY on verified facts and explicit shopper evidence.
    5. NEUTRALITY: Do not favour products based on price or margin. If a cheaper product is a better match for the shopper's stated needs, recommend it.
    6. PII EXCLUSION: Strictly scrub names, emails, phones, and addresses from structured signals.
    7. MISSING DATA: If information is not in the VERIFIED PRODUCT FACTS, state: "I don't have verified information on that currently." Do not assume or fill gaps.
    8. SILENCE: Do not interpret silence or lack of response as acceptance or interest.

    CONVERSATIONAL STRATEGY:
    - Turn 1: Warm greeting and introduction. Briefly mention the product.
    - Turn 2+: DO NOT re-introduce yourself. Maintain a direct, contextual conversation.
    - DISCOVERY: If requirements are vague, ask ONE targeted clarifying question. Avoid premature recommendations.
    - EVALUATION: Answer product questions using verified facts.
    - EVOLUTION: Acknowledge requirement changes (e.g., new budget). Newer explicit statements supersede older ones.
    - REJECTION: If a product or trait is rejected, add to dislikes/rejectionSet and pivot. Never repeatedly recommend a rejected item.
    - COMPARISON: Use seenGtins from the state to resolve references like "the first one".

    STRICT DECISION-STATE DEFINITIONS:
    1. SEEN: Product was presented.
    2. INTEREST: Explicit liking ("I like this").
    3. CONSIDERATION: Active evaluation ("Is it waterproof?").
    4. REJECTION: Explicit "No" or rejection.
    5. ACCEPTANCE: Explicit confirmation of recommendation.

    ${factContextStr}
    ${shopperProfileContext}

    ${input.previousContext ? `PREVIOUS SHOPPER CONTEXT:
    - Requirements: ${input.previousContext.requirements.join(', ') || 'None'}
    - Dislikes: ${input.previousContext.dislikes.join(', ') || 'None'}
    - Budget: ${input.previousContext.budget?.limit || 'Not stated'}
    - Rejected Items: ${input.previousContext.rejectionSet?.join(', ') || 'None'}
    - Encountered GTINs: ${input.previousContext.seenGtins.join(', ') || 'None'}` : ''}

    ${input.hasConsent ? '' : 'PRIVACY MODE ACTIVE: Do not extract interaction signals or persist transcript for this turn.'}
    
    PERSONALITY: Intelligent, grounded, non-manipulative. The shopper is always in control.`;

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
      
      // 4. PERSISTENCE LAYER: Only if database, session, and consent are available
      if (db && input.sessionId && input.hasConsent) {
          const sessionId = input.sessionId;
          const gtin = input.gtin || '00000000000000';
          const retailerId = authorizedRetailerId;

          // A. Log Conversation Node
          const conversationId = `convo_${Date.now()}`;
          db.collection('ai_conversations').doc(conversationId).set({
              conversationId,
              sessionId,
              shopperId: input.shopperUid || 'guest',
              gtin,
              retailerId,
              transcript: [...input.history, { role: 'model', content: output.message }],
              shopperContext: output.shopperContext,
              timestamp: admin.firestore.Timestamp.now(),
              ariVersion: ARI_CORE_VERSION,
              dataStatus: 'VERIFIED'
          }).catch(console.warn);

          // B. Extract and Log Signals
          if (output.signals && output.signals.length > 0) {
              output.signals.forEach((signal) => {
                  if (signal.evidenceType === 'inferred') {
                      signal.confidence = 'INFERRED';
                  }

                  const eventId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                  db.collection('events').doc(eventId).set({
                      eventId,
                      sessionId,
                      gtin,
                      retailerId,
                      eventType: 'interaction_signal',
                      timestamp: admin.firestore.Timestamp.now(),
                      metadata: {
                          ...signal,
                          statedReason: signal.statedReason ? "[PII REDACTED]" : null,
                          ariVersion: ARI_CORE_VERSION,
                          evidenceType: signal.evidenceType
                      }
                  }).catch(console.warn);
              });
          }

          // C. Log Recommendation Node
          if (output.rationale && output.rationale.confidence !== 'NONE') {
              const recId = `rec_${Date.now()}`;
              db.collection('events').doc(recId).set({
                  eventId: recId,
                  sessionId,
                  gtin,
                  retailerId,
                  eventType: 'recommendation_event',
                  timestamp: admin.firestore.Timestamp.now(),
                  metadata: {
                      ...output.rationale,
                      ariVersion: ARI_CORE_VERSION
                  }
              }).catch(console.warn);
          }
      }

      return {
          ...output,
          metadata: {
              ariVersion: ARI_CORE_VERSION,
              modelVersion: 'gemini-2.5-flash',
              timestamp: new Date().toISOString(),
              authorizedRetailerId
          }
      } as any;
  } catch (error: any) {
      console.error("[Ari] Resilience Fallback Active:", error);
      return {
          message: "I'm currently synchronizing with the network. Please feel free to check the product details while I reconnect.",
          signals: [],
          shopperContext: input.previousContext || { turnCount: turnCount + 1, requirements: [], preferences: [], dislikes: [], consideredGtins: [], seenGtins: [], rejectionSet: [], unresolvedQuestions: ["System sync pending"] },
          metadata: { ariVersion: ARI_CORE_VERSION, modelVersion: 'none', timestamp: new Date().toISOString() }
      } as any;
  }
}
