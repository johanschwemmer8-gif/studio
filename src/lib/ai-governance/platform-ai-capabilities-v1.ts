import type {
  AiCapabilityExecutionType,
  AiCapabilityStatus,
} from '@/lib/schemas/ai-capability';

export const PLATFORM_AI_CAPABILITY_REGISTRY_V1_ID =
  'INTERACT-AI-CAPABILITY-REGISTRY-V1';

export const PLATFORM_AI_CAPABILITY_REGISTRY_V1_VERSION = '1.0.0';

export const PLATFORM_AI_PROVIDER_IDS = {
  GOOGLE_AI: 'GOOGLE_AI',
} as const;

export const PLATFORM_AI_MODEL_IDS = {
  GEMINI_2_5_FLASH: 'GOOGLE_AI_GEMINI_2_5_FLASH',
} as const;

export const PLATFORM_AI_DEPENDENCY_IDS = {
  GOOGLE_SEARCH_PRODUCT_RESEARCH: 'GOOGLE_SEARCH_PRODUCT_RESEARCH',
} as const;

export const PLATFORM_AI_CAPABILITY_IDS = [
  'ARI_PRODUCT_CHAT',
  'ARI_PRODUCT_SUITABILITY',
  'ARI_CROSS_SELL_RECOMMENDATION',
  'ARI_SCAN_INTERACTION',
  'RETAIL_BEHAVIORAL_INTELLIGENCE',
  'RETAIL_CAMPAIGN_INTELLIGENCE',
  'RETAIL_DECISION_JOURNEY_INTELLIGENCE',
  'RETAIL_AGGREGATE_INTELLIGENCE',
  'ARI_FINANCIAL_NARRATIVE',
] as const;

export type PlatformAiCapabilityId =
  (typeof PLATFORM_AI_CAPABILITY_IDS)[number];

export type PlatformAiCapabilityIdentity = {
  capabilityId: PlatformAiCapabilityId;
  status: AiCapabilityStatus;
  executionType: AiCapabilityExecutionType;
};

export const PLATFORM_AI_CAPABILITY_IDENTITIES_V1:
  readonly PlatformAiCapabilityIdentity[] = [
    {
      capabilityId: 'ARI_PRODUCT_CHAT',
      status: 'ACTIVE',
      executionType: 'HYBRID',
    },
    {
      capabilityId: 'ARI_PRODUCT_SUITABILITY',
      status: 'ACTIVE',
      executionType: 'HYBRID',
    },
    {
      capabilityId: 'ARI_CROSS_SELL_RECOMMENDATION',
      status: 'ACTIVE',
      executionType: 'MODEL_BACKED',
    },
    {
      capabilityId: 'ARI_SCAN_INTERACTION',
      status: 'ACTIVE',
      executionType: 'HYBRID',
    },
    {
      capabilityId: 'RETAIL_BEHAVIORAL_INTELLIGENCE',
      status: 'ACTIVE',
      executionType: 'MODEL_BACKED',
    },
    {
      capabilityId: 'RETAIL_CAMPAIGN_INTELLIGENCE',
      status: 'DEVELOPMENT',
      executionType: 'MODEL_BACKED',
    },
    {
      capabilityId: 'RETAIL_DECISION_JOURNEY_INTELLIGENCE',
      status: 'ACTIVE',
      executionType: 'HYBRID',
    },
    {
      capabilityId: 'RETAIL_AGGREGATE_INTELLIGENCE',
      status: 'ACTIVE',
      executionType: 'HYBRID',
    },
    {
      capabilityId: 'ARI_FINANCIAL_NARRATIVE',
      status: 'ACTIVE',
      executionType: 'DETERMINISTIC',
    },
  ];

export const PLATFORM_AI_PROVIDERS_V1 = [
  {
    providerId: 'GOOGLE_AI',
    name: 'Google AI',
    status: 'ACTIVE',
  },
] as const;

export const PLATFORM_AI_MODELS_V1 = [
  {
    modelId: 'GOOGLE_AI_GEMINI_2_5_FLASH',
    providerId: 'GOOGLE_AI',
    name: 'Gemini 2.5 Flash',
    providerModelIdentifier: 'googleai/gemini-2.5-flash',
    status: 'ACTIVE',
  },
] as const;

export const PLATFORM_AI_DEPENDENCIES_V1 = [
  {
    dependencyId: 'GOOGLE_SEARCH_PRODUCT_RESEARCH',
    name: 'Google Search Product Research',
    dependencyType: 'EXTERNAL_RESEARCH',
  },
] as const;

const PLATFORM_AI_PROVIDER_MODEL_BINDING_DEFINITIONS_V1:
  readonly [
    PlatformAiCapabilityId,
    'AUTHORIZED' | 'NOT_AUTHORIZED',
  ][] = [
    ['ARI_PRODUCT_CHAT', 'AUTHORIZED'],
    ['ARI_PRODUCT_SUITABILITY', 'AUTHORIZED'],
    ['ARI_CROSS_SELL_RECOMMENDATION', 'AUTHORIZED'],
    ['ARI_SCAN_INTERACTION', 'AUTHORIZED'],
    ['RETAIL_BEHAVIORAL_INTELLIGENCE', 'AUTHORIZED'],
    ['RETAIL_CAMPAIGN_INTELLIGENCE', 'NOT_AUTHORIZED'],
    ['RETAIL_DECISION_JOURNEY_INTELLIGENCE', 'AUTHORIZED'],
    ['RETAIL_AGGREGATE_INTELLIGENCE', 'AUTHORIZED'],
    ['ARI_FINANCIAL_NARRATIVE', 'NOT_AUTHORIZED'],
  ];

export const PLATFORM_AI_PROVIDER_MODEL_BINDINGS_V1 =
  PLATFORM_AI_PROVIDER_MODEL_BINDING_DEFINITIONS_V1.map(
    ([capabilityId, executionAuthorization]) => ({
      bindingId: `${capabilityId}__GOOGLE_AI_GEMINI_2_5_FLASH`,
      capabilityId,
      providerId: PLATFORM_AI_PROVIDER_IDS.GOOGLE_AI,
      modelId: PLATFORM_AI_MODEL_IDS.GEMINI_2_5_FLASH,
      status: 'ACTIVE' as const,
      executionAuthorization,
    })
  );

export const PLATFORM_AI_CAPABILITY_DEPENDENCIES_V1 = [
  {
    capabilityId: 'ARI_PRODUCT_CHAT',
    dependencyIds: ['GOOGLE_SEARCH_PRODUCT_RESEARCH'],
  },
] as const;
