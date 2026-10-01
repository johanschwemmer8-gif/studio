import { db } from '@/lib/firebase-admin';
import { ActivationSchema } from '@/lib/schemas/activation';

export type ActivationAriContext = {
  activationId: string;
  retailerId: string;
  shopperObjective: string;
  persona?: string;
  tone?: string;
  greeting?: string;
};

function normalizeOptionalContext(
  value: string | undefined
): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export async function resolveActivationAriContext(
  activationId: string,
  retailerId: string
): Promise<ActivationAriContext> {
  if (!activationId.trim()) {
    throw new Error('ACTIVATION_CONTEXT_DENIED:ACTIVATION_ID_REQUIRED');
  }

  if (!retailerId.trim()) {
    throw new Error('ACTIVATION_CONTEXT_DENIED:RETAILER_ID_REQUIRED');
  }

  if (db == null) {
    throw new Error('ACTIVATION_CONTEXT_DENIED:INFRASTRUCTURE_UNAVAILABLE');
  }

  const snapshot = await db
    .collection('activations')
    .doc(activationId)
    .get();

  if (!snapshot.exists) {
    throw new Error('ACTIVATION_CONTEXT_DENIED:ACTIVATION_NOT_FOUND');
  }

  const parsed = ActivationSchema.safeParse(snapshot.data());

  if (!parsed.success) {
    throw new Error('ACTIVATION_CONTEXT_DENIED:INVALID_ACTIVATION');
  }

  const activation = parsed.data;

  if (activation.activationId !== activationId) {
    throw new Error('ACTIVATION_CONTEXT_DENIED:ACTIVATION_IDENTITY_MISMATCH');
  }

  if (activation.retailerId !== retailerId) {
    throw new Error('ACTIVATION_CONTEXT_DENIED:TENANT_IDENTITY_MISMATCH');
  }

  return {
    activationId: activation.activationId,
    retailerId: activation.retailerId,
    shopperObjective: activation.shopperObjective,
    ...(normalizeOptionalContext(activation.experienceConfig.persona)
      ? { persona: normalizeOptionalContext(activation.experienceConfig.persona) }
      : {}),
    ...(normalizeOptionalContext(activation.experienceConfig.tone)
      ? { tone: normalizeOptionalContext(activation.experienceConfig.tone) }
      : {}),
    ...(normalizeOptionalContext(activation.experienceConfig.greeting)
      ? { greeting: normalizeOptionalContext(activation.experienceConfig.greeting) }
      : {}),
  };
}
