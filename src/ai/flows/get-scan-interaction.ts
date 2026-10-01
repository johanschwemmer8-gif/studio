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
import { randomUUID } from 'node:crypto';

import { admin, getDb } from '@/lib/firebase-admin';
import { resolveProductionQr } from '@/lib/qr-resolution';
import { QrExposureSchema } from '@/lib/schemas/qr-exposure';
import { establishSponsoredMediaEligibility } from '@/lib/sponsored-media-eligibility';
import {
  createDefaultAriConfiguration,
  resolveAriConfiguration,
} from '@/lib/resolve-ari-configuration';
import {
  GetScanInteractionInputSchema,
  type GetScanInteractionInput,
  GetScanInteractionOutputSchema,
  type GetScanInteractionOutput,
} from '@/lib/schemas/scan-interaction';

const InteractionPromptInputSchema = z.object({
  retailerName: z.string(),
  campaignName: z.string(),
  persona: z.string().optional(),
  tone: z.string().optional(),
  shopperObjective: z.string(),
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

{{#if persona}}Activation communication context: {{persona}}.{{/if}}
{{#if tone}}Activation communication tone: {{tone}}.{{/if}}
Shopper Objective: {{shopperObjective}}.

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


const DEFAULT_SHOPPER_PRESENTATION: GetScanInteractionOutput['shopperPresentation'] = {
  selectedTemplate: 'template1',
  branding: {
    logoUrl: '',
    logoWidth: 128,
    logoMaxHeight: 32,
    logoAlign: 'center',
    logoPadding: 0,
    headerBackgroundColor: '#07162f',
  },
  ariPresentation: {
    assistantName: 'Ari',
    welcomeMessage: 'How can I help you today?',
  },
};

function normalizeShopperPresentation(
  value: unknown
): GetScanInteractionOutput['shopperPresentation'] {
  const data =
    value && typeof value === 'object'
      ? value as Record<string, unknown>
      : {};

  const templates = new Set([
    'template1', 'template2', 'template3',
    'template4', 'template5', 'template6',
    'template7', 'template8', 'template9',
  ]);

  const clamp = (
    value: unknown,
    min: number,
    max: number,
    fallback: number
  ) => {
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.min(Math.max(number, min), max)
      : fallback;
  };

  const logoAlign =
    data.logoAlign === 'flex-start' ||
    data.logoAlign === 'flex-end' ||
    data.logoAlign === 'center'
      ? data.logoAlign
      : 'center';

  const headerBackgroundColor =
    typeof data.headerBackgroundColor === 'string' &&
    /^#[0-9A-Fa-f]{6}$/.test(data.headerBackgroundColor)
      ? data.headerBackgroundColor
      : '#07162f';

  return {
    selectedTemplate:
      typeof data.selectedTemplate === 'string' &&
      templates.has(data.selectedTemplate)
        ? data.selectedTemplate as GetScanInteractionOutput['shopperPresentation']['selectedTemplate']
        : 'template1',
    branding: {
      logoUrl: (() => {
        if (typeof data.logoUrl !== 'string' || data.logoUrl === '') return '';
        try {
          new URL(data.logoUrl);
          return data.logoUrl;
        } catch {
          return '';
        }
      })(),
      logoWidth: clamp(data.logoWidth, 40, 220, 128),
      logoMaxHeight: clamp(data.logoMaxHeight, 16, 48, 32),
      logoAlign,
      logoPadding: clamp(data.logoPadding, 0, 12, 0),
      headerBackgroundColor,
    },
    ariPresentation: DEFAULT_SHOPPER_PRESENTATION.ariPresentation,
  };
}

function resolveUnambiguousExposureGtin(
  activation: Awaited<ReturnType<typeof resolveProductionQr>>['activation']
): string | undefined {
  const gtins = new Set<string>();

  if (
    activation.target.level === 'PRODUCT' &&
    activation.target.productGtin
  ) {
    gtins.add(activation.target.productGtin);
  }

  for (const product of activation.productContext) {
    if (product.gtin) {
      gtins.add(product.gtin);
    }
  }

  return gtins.size === 1 ? Array.from(gtins)[0] : undefined;
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
    shopperPresentation: DEFAULT_SHOPPER_PRESENTATION,
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
        shopperPresentation: DEFAULT_SHOPPER_PRESENTATION,
      };
    }

    const { qr, activation, campaign } = await resolveProductionQr(qrId);

    let shopperPresentation = DEFAULT_SHOPPER_PRESENTATION;

    try {
      const brandDoc = await db
        .collection('configurations')
        .doc(`${qr.retailerId}_brand`)
        .get();

      if (brandDoc.exists) {
        shopperPresentation = normalizeShopperPresentation(
          brandDoc.data()?.data
        );
      }
    } catch {
      console.warn(
        '[Shopper Presentation] Retailer branding unavailable; defaults active.'
      );
    }

    const exposureId = `exp_${randomUUID()}`;
    const exposureGtin = resolveUnambiguousExposureGtin(activation);
    const exposureData = {
      exposureId,
      retailerId: qr.retailerId,
      campaignId: qr.campaignId,
      activationId: qr.activationId,
      deploymentId: qr.deploymentId,
      qrCodeId: qr.qrCodeId,
      configurationVersion: qr.configurationVersion,
      environment: qr.environment,
      timestamp: admin.firestore.Timestamp.now(),
      ...(exposureGtin ? { gtin: exposureGtin } : {}),
    };

    QrExposureSchema.parse(exposureData);
    await db.collection('qrExposures').doc(exposureId).create(exposureData);

    const experienceConfig = activation.experienceConfig;

    let ariConfiguration =
      createDefaultAriConfiguration(qr.retailerId);

    try {
      ariConfiguration =
        await resolveAriConfiguration(qr.retailerId);
    } catch {
      console.warn(
        '[Ari Presentation] Retailer configuration unavailable; defaults active.'
      );
    }

    const activationGreeting =
      experienceConfig.greeting?.trim();

    const ariPresentation = {
      assistantName:
        ariConfiguration.assistantName?.trim() || 'Ari',
      welcomeMessage:
        activationGreeting ||
        ariConfiguration.welcomeMessage,
    };

    let sponsoredMediaPresentationId: string | undefined;

    if (
      experienceConfig.sponsoredMedia?.partnerId &&
      experienceConfig.sponsoredMedia?.creativeId
    ) {
      const eligibility = await establishSponsoredMediaEligibility(qrId);
      sponsoredMediaPresentationId = eligibility.presentationId;
    }

    const shopperSponsoredMedia = experienceConfig.sponsoredMedia
      ? {
          format: experienceConfig.sponsoredMedia.format,
          sponsorName: experienceConfig.sponsoredMedia.sponsorName,
          mediaUrl: experienceConfig.sponsoredMedia.mediaUrl,
          headline: experienceConfig.sponsoredMedia.headline,
          destinationUrl: experienceConfig.sponsoredMedia.destinationUrl,
          ...(sponsoredMediaPresentationId
            ? { presentationId: sponsoredMediaPresentationId }
            : {}),
        }
      : undefined;

    let shopperName: string | undefined;
    let pastInterests: string[] = [];
    let retailerName = 'iNteract';
    let retailerLogoUrl: string | undefined;

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
        retailerLogoUrl = retailerData.logoUrl || undefined;
      }
    } catch {
      console.warn('[Retailer Context] Metadata unavailable.');
    }

    const activationPersona =
      experienceConfig.persona?.trim() || undefined;

    const activationTone =
      experienceConfig.tone?.trim() || undefined;

    const shopperObjective =
      activation.shopperObjective;

    try {
      const { output } = await prompt({
        retailerName,
        campaignName: campaign.name,
        persona: activationPersona,
        tone: activationTone,
        shopperObjective,
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
        retailerId: qr.retailerId,
        activationId: qr.activationId,
        ...(exposureGtin ? { gtin: exposureGtin } : {}),
        shopperPresentation: {
          ...shopperPresentation,
          ariPresentation,
        },
        mediaType: resolveMediaType(experienceConfig.mediaType),
        mediaUrl: experienceConfig.mediaUrl,
        headline: experienceConfig.headline,
        subhead: experienceConfig.subhead,
        sponsoredMedia: shopperSponsoredMedia,
      };
    } catch {
      return {
        messages: [
          'Hello! Ari here.',
          "I'm ready to help with your shopping decision.",
        ],
        destinationUrl: resolveDestination(experienceConfig),
        retailerLogoUrl,
        retailerId: qr.retailerId,
        activationId: qr.activationId,
        ...(exposureGtin ? { gtin: exposureGtin } : {}),
        shopperPresentation: {
          ...shopperPresentation,
          ariPresentation,
        },
        mediaType: resolveMediaType(experienceConfig.mediaType),
        mediaUrl: experienceConfig.mediaUrl,
        headline: experienceConfig.headline,
        subhead: experienceConfig.subhead,
        sponsoredMedia: shopperSponsoredMedia,
      };
    }
  }
);
