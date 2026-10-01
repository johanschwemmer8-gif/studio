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

const ARI_ACTIVATION_CONTEXT_LIMITS = {
  shopperObjective: 500,
  persona: 200,
  tone: 200,
} as const;

function normalizeOptionalContext(
  value: string | undefined
): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function assertBoundedAriContext(
  field: keyof typeof ARI_ACTIVATION_CONTEXT_LIMITS,
  value: string | undefined
): void {
  if (
    value !== undefined &&
    value.length > ARI_ACTIVATION_CONTEXT_LIMITS[field]
  ) {
    throw new Error(
      `ACTIVATION_CONTEXT_DENIED:${field.toUpperCase()}_TOO_LONG`
    );
  }
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

  const shopperObjective = activation.shopperObjective.trim();
  const persona = normalizeOptionalContext(
    activation.experienceConfig.persona
  );
  const tone = normalizeOptionalContext(
    activation.experienceConfig.tone
  );
  const greeting = normalizeOptionalContext(
    activation.experienceConfig.greeting
  );

  assertBoundedAriContext('shopperObjective', shopperObjective);
  assertBoundedAriContext('persona', persona);
  assertBoundedAriContext('tone', tone);

  return {
    activationId: activation.activationId,
    retailerId: activation.retailerId,
    shopperObjective,
    ...(persona ? { persona } : {}),
    ...(tone ? { tone } : {}),
    ...(greeting ? { greeting } : {}),
  };
}
