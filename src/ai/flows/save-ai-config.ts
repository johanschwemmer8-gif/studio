'use server';

import { z } from 'zod';
import { admin } from '@/lib/firebase-admin';
import { getAuthorizedRetailerId, verifyAuth } from '@/lib/auth-server';
import {
  AriPersonalitySchema,
  AriToneSchema,
  RetailerAriConfigurationSchema,
} from '@/lib/schemas/retailer-ari-configuration';

const RetailerAriConfigurationCommandSchema = z
  .object({
    assistantName: z.string().trim().min(1).max(60).default('Ari'),
    personality: AriPersonalitySchema.default('FRIENDLY_APPROACHABLE'),
    tone: AriToneSchema.default('CONVERSATIONAL'),
    brandVoice: z.string().trim().max(500).default(''),
    welcomeMessage: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .default("Hi! I'm Ari. How can I help you with this product today?"),
    recommendationCount: z.number().int().min(1).max(6).default(3),
    includePrice: z.boolean().default(true),
    showAvailability: z.boolean().default(true),
  })
  .strict();

const SaveAiConfigInputSchema = z
  .object({
    idToken: z.string().min(1),
    retailerId: z.string().min(1),
    config: RetailerAriConfigurationCommandSchema,
  })
  .strict();

export type SaveAiConfigInput = z.input<
  typeof SaveAiConfigInputSchema
>;

export type SaveAiConfigResult = {
  success: true;
  message: string;
};

export async function saveAiConfig(
  input: SaveAiConfigInput
): Promise<SaveAiConfigResult> {
  const parsedInput = SaveAiConfigInputSchema.parse(input);

  const auth = await verifyAuth(parsedInput.idToken);

  if ('error' in auth) {
    throw new Error(auth.error);
  }

  const authorizedRetailerId =
    await getAuthorizedRetailerId(
      parsedInput.idToken,
      parsedInput.retailerId
    );

  const db = admin.firestore();
  const ref = db
    .collection('configurations')
    .doc(`${authorizedRetailerId}_ai`);

  const existing = await ref.get();
  const existingData = existing.exists ? existing.data() : undefined;

  const existingCanonical =
    existingData === undefined
      ? null
      : RetailerAriConfigurationSchema.safeParse(existingData);

  const now = admin.firestore.FieldValue.serverTimestamp();

  const canonicalDocument = {
    retailerId: authorizedRetailerId,
    configurationVersion: '1.0.0',
    ...parsedInput.config,
    createdAt:
      existingCanonical?.success === true
        ? existingCanonical.data.createdAt
        : now,
    createdBy:
      existingCanonical?.success === true
        ? existingCanonical.data.createdBy
        : auth.uid,
    updatedAt: now,
    updatedBy: auth.uid,
  };

  const validatedDocument =
    RetailerAriConfigurationSchema.parse(canonicalDocument);

  await ref.set(validatedDocument);

  return {
    success: true,
    message: 'Ari configuration saved.',
  };
}
