'use server';

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
  activationName: z.string(),
  personality: z.string(),
  intent: z.string(),
  greeting: z.string().optional(),
  constraints: z.string().optional(),
});

const InteractionPromptOutputSchema = z.object({
  messages: z.array(z.string()).max(3),
});

const prompt = ai.definePrompt({
  name: 'getScanInteractionPrompt',
  input: { schema: InteractionPromptInputSchema },
  output: { schema: InteractionPromptOutputSchema },
  prompt: `You are Ari, the in-store decision assistant for {{retailerName}}.
The shopper has entered the {{campaignName}} campaign experience through the {{activationName}} activation.

Your personality: {{personality}}.
Your objective: {{intent}}.
{{#if constraints}}Additional operating instructions: {{constraints}}.{{/if}}
{{#if greeting}}Preferred greeting: {{greeting}}.{{/if}}

Generate 1-3 short, useful shopper-facing messages. Be conversational and focused on helping the shopper make a decision. Do not invent product facts. Identify yourself as Ari when appropriate.`,
});

function validOptionalUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  try {
    new URL(value);
    return value;
  } catch {
    return undefined;
  }
}

export async function getScanInteraction(
  input: GetScanInteractionInput
): Promise<GetScanInteractionOutput> {
  return getScanInteractionFlow(input);
}

const getScanInteractionFlow = ai.defineFlow(
  {
    name: 'getScanInteractionFlow',
    inputSchema: GetScanInteractionInputSchema,
    outputSchema: GetScanInteractionOutputSchema,
  },
  async ({ qrCodeId }) => {
    const db = getDb();
    if (db == null) {
      throw new Error('INFRASTRUCTURE_UNAVAILABLE');
    }

    const { qr, activation, campaign } = await resolveProductionQr(qrCodeId);
    const config = activation.experienceConfig;

    if (config.scanDestination == null) {
      throw new Error('EXPERIENCE_CONFIGURATION_ERROR');
    }

    let destinationUrl: string | undefined;
    if (config.scanDestination === 'URL') {
      if (config.landingPageUrl == null) {
        throw new Error('EXPERIENCE_CONFIGURATION_ERROR');
      }
      destinationUrl = config.landingPageUrl;
    }

    const tenantDoc = await db.collection('tenants').doc(qr.retailerId).get();
    const tenantData = tenantDoc.exists ? tenantDoc.data() : undefined;
    const retailerName =
      typeof tenantData?.name === 'string' && tenantData.name.length > 0
        ? tenantData.name
        : qr.retailerId;
    const retailerLogoUrl = validOptionalUrl(tenantData?.logoUrl);

    const personality =
      config.persona || config.tone || 'Expert & Knowledgeable';
    const intent = config.goal || activation.shopperObjective;

    let messages: string[];
    try {
      const { output } = await prompt({
        retailerName,
        campaignName: campaign.name,
        activationName: activation.name,
        personality,
        intent,
        greeting: config.greeting,
        constraints: activation.advancedInstructions,
      });

      messages =
        output?.messages && output.messages.length > 0
          ? output.messages
          : [config.greeting || "Hello! I'm Ari. How can I help with your decision today?"];
    } catch (error) {
      console.warn('[Scan Interaction] Ari greeting generation fallback:', error);
      messages = [
        config.greeting || "Hello! I'm Ari. How can I help with your decision today?",
      ];
    }

    const result: GetScanInteractionOutput = {
      messages,
      qrCodeId: qr.qrCodeId,
      retailerId: qr.retailerId,
      campaignId: qr.campaignId,
      activationId: qr.activationId,
      deploymentId: qr.deploymentId,
      configurationVersion: activation.configurationVersion,
      environment: qr.environment,
      retailerName,
      campaignName: campaign.name,
      activationName: activation.name,
      shopperObjective: activation.shopperObjective,
      experienceMode: activation.experienceMode,
      scanDestination: config.scanDestination,
      ...(destinationUrl ? { destinationUrl } : {}),
      target: activation.target,
      productContext: activation.productContext,
      ...(retailerLogoUrl ? { retailerLogoUrl } : {}),
      ...(config.mediaType ? { mediaType: config.mediaType } : {}),
      ...(config.mediaUrl ? { mediaUrl: config.mediaUrl } : {}),
      ...(config.headline ? { headline: config.headline } : {}),
      ...(config.subhead ? { subhead: config.subhead } : {}),
    };

    return GetScanInteractionOutputSchema.parse(result);
  }
);
