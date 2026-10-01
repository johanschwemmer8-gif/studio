import {
  AriPersonality,
  AriTone,
} from '@/lib/schemas/retailer-ari-configuration';
import { getRetailerAriConfiguration } from '@/lib/ari-configuration-repository';

export const RETAILER_ARI_CONFIGURATION_VERSION = '1.0.0';

export type AriConfigurationSource =
  | 'RETAILER_CONFIGURATION'
  | 'PLATFORM_DEFAULT';

export interface EffectiveAriConfiguration {
  retailerId: string;
  configurationVersion: string;
  source: AriConfigurationSource;
  assistantName: string;
  personality: AriPersonality;
  tone: AriTone;
  brandVoice: string;
  welcomeMessage: string;
  recommendationCount: number;
  includePrice: boolean;
  showAvailability: boolean;
}

export function createDefaultAriConfiguration(
  retailerId: string
): EffectiveAriConfiguration {
  return {
    retailerId,
    configurationVersion: RETAILER_ARI_CONFIGURATION_VERSION,
    source: 'PLATFORM_DEFAULT',
    assistantName: 'Ari',
    personality: 'FRIENDLY_APPROACHABLE',
    tone: 'CONVERSATIONAL',
    brandVoice: '',
    welcomeMessage:
      "Hi! I'm Ari. How can I help you with this product today?",
    recommendationCount: 3,
    includePrice: true,
    showAvailability: true,
  };
}

export async function resolveAriConfiguration(
  retailerId: string
): Promise<EffectiveAriConfiguration> {
  if (!retailerId) {
    throw new Error(
      'ARI_CONFIGURATION_DENIED:RETAILER_ID_REQUIRED'
    );
  }

  const configuration =
    await getRetailerAriConfiguration(retailerId);

  if (!configuration) {
    return createDefaultAriConfiguration(retailerId);
  }

  return {
    retailerId: configuration.retailerId,
    configurationVersion:
      configuration.configurationVersion,
    source: 'RETAILER_CONFIGURATION',
    assistantName: configuration.assistantName,
    personality: configuration.personality,
    tone: configuration.tone,
    brandVoice: configuration.brandVoice,
    welcomeMessage: configuration.welcomeMessage,
    recommendationCount:
      configuration.recommendationCount,
    includePrice: configuration.includePrice,
    showAvailability: configuration.showAvailability,
  };
}
