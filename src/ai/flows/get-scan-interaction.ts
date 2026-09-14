'use server';

/**
 * @fileOverview Canonical QR shopper-experience bootstrap.
 *
 * Runtime authority:
 * QR -> Deployment -> Activation -> Campaign
 *
 * Activation.experienceConfig is the authoritative shopper-experience
 * configuration. bulkQrRequests is technical provenance only and is never
 * runtime presentation authority.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

import { getDb } from '@/lib/firebase-admin';
import { resolveProductionQr } from '@/lib/qr-resolution';
import {
  GetScanInteractionInputSchema,
  type GetScanInteractionInput,
  GetScanInteractionOutputSchema,
  type GetScanInteractionOutput,
} from '@/lib/schemas/scan-interaction';

const InteractionPromptInputSchema = z.object({
  retailerName: z.string(),
  campaignName: z.string(),
  personality: z.string(),
  intent: z.string(),
  constraints: z.string().optional(),
  shopperName: z.string().optional(),
  pastInterests: z.array(z.string()).optional(),
});

const InteractionPromptOutputSchema = z.object({
  messages: z
    .array(z.string())
    .max(3, 'Maximum of 3 messages')
    .describe('Personalized continuity messages.'),
});

const prompt = ai.definePrompt({
  name: 'getScanInteractionPrompt',
  input: { schema: InteractionPromptInputSchema },
  output: { schema: InteractionPromptOutputSchema },
  prompt: `You are Ari, the world-class Continuity Assistant for {{retailerName}} Decision Intelligence.
Your goal is to provide expert Lifecycle Guidance. You are not just selling; you are managing a relationship.
A shopper has entered the experience for "{{campaignName}}".

{{#if shopperName}}
SHOPPER RECOGNIZED: {{shopperName}}.
CONTINUITY LOG: They have previously explored these categories: {{#each pastInterests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
Acknowledge them by name and reinforce their persistent relationship with the brand.
{{else}}
GUEST SHOPPER: Welcome the shopper and focus on useful buying guidance.
{{/if}}

Your personality: {{personality}}.
Operating Objective: {{intent}}.
{{#if constraints}}Constraints: {{constraints}}.{{/if}}

Generate 1-3 short, engaging messages. Be brief and conversational. Identify yourself as Ari if introducing yourself.`,
});

function resolveMediaType(
  mediaType: string | undefined
): 'image' | 'video' | undefined {
  return mediaType === 'image' || mediaType === 'video'
    ? mediaType
    : undefined;
}

function resolveDestination(
  experienceConfig: Awaited<
    ReturnType<typeof resolveProductionQr>
  >['activation']['experienceConfig']
): string {
  if (
    experienceConfig.scanDestination === 'URL' &&
    experienceConfig.landingPageUrl
  ) {
    return experienceConfig.landingPageUrl;
  }

  return 'https://interactaoe.co.za';
}

export async function getScanInteraction(
  input: GetScanInteractionInput
): Promise<GetScanInteractionOutput> {
  const fallbackResponse: GetScanInteractionOutput = {
    messages: [
      'Hello! Ari here.',
      "I'm synchronizing your shopping guidance now.",
    ],
    destinationUrl: 'https://interactaoe.co.za',
    retailerLogoUrl: '',
  };

  try {
    return await getScanInteractionFlow(input);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    console.warn('[Continuity Engine] Resilience fallback active:', message);
    return fallbackResponse;
  }
}

const getScanInteractionFlow = ai.defineFlow(
  {
    name: 'getScanInteractionFlow',
    inputSchema: GetScanInteractionInputSchema,
    outputSchema: GetScanInteractionOutputSchema,
  },
  async ({ qrId, shopperUid }) => {
    const db = getDb();

    if (!db) {
      return {
        messages: [
          "Hello! I'm Ari.",
          "I'm currently operating in simulation mode while we synchronize with the store network.",
        ],
        destinationUrl: 'https://interactaoe.co.za',
        retailerLogoUrl: '',
      };
    }

    const { qr, activation, campaign } = await resolveProductionQr(qrId);
    const experienceConfig = activation.experienceConfig;

    let shopperName: string | undefined;
    let pastInterests: string[] = [];
    let retailerName = 'iNteract';
    let retailerLogoUrl = '';

    if (shopperUid) {
      try {
        const shopperDoc = await db.collection('shoppers').doc(shopperUid).get();

        if (shopperDoc.exists) {
          const shopperData = shopperDoc.data()!;
          shopperName = shopperData.displayName;

          const interactions = await db
            .collection('product_interactions')
            .where('shopperId', '==', shopperUid)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

          const categories = new Set<string>();

          for (const interaction of interactions.docs) {
            const category = interaction.data().metadata?.category;
            if (category) {
              categories.add(category);
            }
          }

          pastInterests = Array.from(categories).slice(0, 3);
        }
      } catch {
        console.warn('[Shopper Memory] Synchronization deferred.');
      }
    }

    try {
      const retailerDoc = await db
        .collection('tenants')
        .doc(qr.retailerId)
        .get();

      if (retailerDoc.exists) {
        const retailerData = retailerDoc.data()!;
        retailerName = retailerData.name || 'iNteract';
        retailerLogoUrl = retailerData.logoUrl || '';
      }
    } catch {
      console.warn('[Retailer Context] Metadata unavailable.');
    }

    const personality =
      experienceConfig.persona ||
      experienceConfig.tone ||
      'Expert & Knowledgeable';

    const intent =
      experienceConfig.goal ||
      activation.shopperObjective ||
      'Provide useful buying guidance.';

    try {
      const { output } = await prompt({
        retailerName,
        campaignName: campaign.name,
        personality,
        intent,
        constraints: activation.advancedInstructions,
        shopperName,
        pastInterests,
      });

      return {
        messages:
          output?.messages || [
            "Hello! I'm Ari.",
            "I'm ready to help with your shopping decision.",
          ],
        destinationUrl: resolveDestination(experienceConfig),
        retailerLogoUrl,
        mediaType: resolveMediaType(experienceConfig.mediaType),
        mediaUrl: experienceConfig.mediaUrl,
        headline: experienceConfig.headline,
        subhead: experienceConfig.subhead,
      };
    } catch {
      return {
        messages: [
          'Hello! Ari here.',
          "I'm ready to help with your shopping decision.",
        ],
        destinationUrl: resolveDestination(experienceConfig),
        retailerLogoUrl,
        mediaType: resolveMediaType(experienceConfig.mediaType),
        mediaUrl: experienceConfig.mediaUrl,
        headline: experienceConfig.headline,
        subhead: experienceConfig.subhead,
      };
    }
  }
);
