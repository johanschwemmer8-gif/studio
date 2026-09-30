import { z } from 'zod';

import { FirestoreTimestampSchema } from './retail-domain';

/**
 * Canonical AI capability, provider and model registry schemas.
 *
 * ARCHITECTURE:
 * A governed AI capability represents a real business/AI function.
 * A provider or model invocation is an implementation dependency and does
 * not automatically constitute a separate governed capability.
 *
 * Provider/model authorization and capability lifecycle enforcement remain
 * backend responsibilities.
 */

export const AiCapabilityStatusSchema = z.enum([
  'PROPOSED',
  'DEVELOPMENT',
  'PILOT',
  'ACTIVE',
  'SUSPENDED',
  'RETIRED',
]);

export type AiCapabilityStatus = z.infer<
  typeof AiCapabilityStatusSchema
>;

export const AiProviderStatusSchema = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'RETIRED',
]);

export type AiProviderStatus = z.infer<
  typeof AiProviderStatusSchema
>;

export const AiModelStatusSchema = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'RETIRED',
]);

export type AiModelStatus = z.infer<
  typeof AiModelStatusSchema
>;

export const AiProviderModelBindingStatusSchema = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'RETIRED',
]);

export type AiProviderModelBindingStatus = z.infer<
  typeof AiProviderModelBindingStatusSchema
>;

/**
 * Canonical governed AI capability.
 *
 * FIRESTORE:
 * aiCapabilities/{capabilityId}
 *
 * Only real production capabilities belong in this registry.
 */
export const AiCapabilitySchema = z.object({
  capabilityId: z.string().min(1),
  capabilityVersion: z.string().min(1),

  name: z.string().min(1),
  description: z.string().min(1),

  intendedUse: z.string().min(1),
  prohibitedUses: z.array(z.string().min(1)).default([]),

  status: AiCapabilityStatusSchema,

  owner: z.string().min(1),

  governanceControlIds: z.array(z.string().min(1)).default([]),
  providerModelBindingIds: z.array(z.string().min(1)).default([]),

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),

  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),

  suspendedAt: FirestoreTimestampSchema.optional(),
  suspendedBy: z.string().min(1).optional(),
  suspensionReason: z.string().min(1).optional(),

  retiredAt: FirestoreTimestampSchema.optional(),
  retiredBy: z.string().min(1).optional(),
});

export type AiCapability = z.infer<typeof AiCapabilitySchema>;

/**
 * Canonical AI provider registry entry.
 *
 * FIRESTORE:
 * aiProviders/{providerId}
 */
export const AiProviderSchema = z.object({
  providerId: z.string().min(1),

  name: z.string().min(1),
  status: AiProviderStatusSchema,

  responsibilityNotes: z.string().min(1).optional(),
  supplierReference: z.string().min(1).optional(),

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),

  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),
});

export type AiProvider = z.infer<typeof AiProviderSchema>;

/**
 * Canonical AI model registry entry.
 *
 * FIRESTORE:
 * aiModels/{modelId}
 *
 * providerModelIdentifier records the provider-facing model identifier.
 */
export const AiModelSchema = z.object({
  modelId: z.string().min(1),
  providerId: z.string().min(1),

  name: z.string().min(1),
  providerModelIdentifier: z.string().min(1),

  status: AiModelStatusSchema,

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),

  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),
});

export type AiModel = z.infer<typeof AiModelSchema>;

/**
 * Authoritative relationship between a governed capability and a permitted
 * provider/model combination.
 *
 * FIRESTORE:
 * aiProviderModelBindings/{bindingId}
 *
 * Runtime code must not infer permission merely because a provider or model
 * exists in its respective registry.
 */
export const AiProviderModelBindingSchema = z.object({
  bindingId: z.string().min(1),

  capabilityId: z.string().min(1),
  providerId: z.string().min(1),
  modelId: z.string().min(1),

  status: AiProviderModelBindingStatusSchema,

  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),

  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),

  suspendedAt: FirestoreTimestampSchema.optional(),
  suspendedBy: z.string().min(1).optional(),
  suspensionReason: z.string().min(1).optional(),

  retiredAt: FirestoreTimestampSchema.optional(),
  retiredBy: z.string().min(1).optional(),
});

export type AiProviderModelBinding = z.infer<
  typeof AiProviderModelBindingSchema
>;
