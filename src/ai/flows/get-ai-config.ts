'use server';

import { z } from 'zod';
import { verifyAuth } from '@/lib/auth-server';
import { getRetailerAriConfiguration } from '@/lib/ari-configuration-repository';
import {
  AriPersonality,
  AriTone,
} from '@/lib/schemas/retailer-ari-configuration';

const GetAiConfigInputSchema = z
  .object({
    idToken: z.string().min(1),
    retailerId: z.string().min(1),
  })
  .strict();

export type GetAiConfigInput = z.infer<
  typeof GetAiConfigInputSchema
>;

export type RetailerAriConfigurationClientDto = {
  assistantName: string;
  personality: AriPersonality;
  tone: AriTone;
  brandVoice: string;
  welcomeMessage: string;
  recommendationCount: number;
  includePrice: boolean;
  showAvailability: boolean;
};

export type GetAiConfigResult = {
  configuration: RetailerAriConfigurationClientDto | null;
};

export async function getAiConfig(
  input: GetAiConfigInput
): Promise<GetAiConfigResult> {
  const parsedInput = GetAiConfigInputSchema.parse(input);

  const auth = await verifyAuth(parsedInput.idToken);

  if ('error' in auth) {
    throw new Error(auth.error);
  }

  if (!auth.retailerId) {
    throw new Error(
      'IDENTITY_NOT_PROVISIONED: Account not linked to a retailer.'
    );
  }

  if (auth.retailerId !== parsedInput.retailerId) {
    throw new Error('ACCESS_DENIED: Tenant mismatch.');
  }

  const configuration = await getRetailerAriConfiguration(
    auth.retailerId
  );

  if (!configuration) {
    return {
      configuration: null,
    };
  }

  return {
    configuration: {
      assistantName: configuration.assistantName,
      personality: configuration.personality,
      tone: configuration.tone,
      brandVoice: configuration.brandVoice,
      welcomeMessage: configuration.welcomeMessage,
      recommendationCount: configuration.recommendationCount,
      includePrice: configuration.includePrice,
      showAvailability: configuration.showAvailability,
    },
  };
}
