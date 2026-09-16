import { admin, db } from "@/lib/firebase-admin";
import { CampaignSchema } from "@/lib/schemas/campaign";
import { ActivationSchema } from "@/lib/schemas/activation";
import type { CreateActivationInput } from "@/lib/schemas/activation-command";

type ActivationDefinition = Omit<CreateActivationInput, "idToken" | "retailerId">;

export type CreateActivationInternalInput = {
  activationId: string;
  retailerId: string;
  actorUid: string;
  activation: ActivationDefinition;
};

export type CreateActivationInternalResult = {
  activationId: string;
  recovered: boolean;
};

export async function createActivationInternal(
  input: CreateActivationInternalInput
): Promise<CreateActivationInternalResult> {
  if (db == null) {
    throw new Error("Infrastructure Layer Unavailable.");
  }

  const { activationId, retailerId, actorUid, activation } = input;

  const campaignRef = db.collection("campaigns").doc(activation.campaignId);
  const campaignSnapshot = await campaignRef.get();

  if (campaignSnapshot.exists === false) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  const campaignData = campaignSnapshot.data();

  if (campaignData === undefined) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  CampaignSchema.parse(campaignData);

  if (campaignData.retailerId !== retailerId) {
    throw new Error(
      "ACCESS_DENIED: Campaign does not belong to the authorized retailer."
    );
  }

  if (campaignData.status === "ARCHIVED") {
    throw new Error(
      "CAMPAIGN_ARCHIVED: Activations cannot be created under an archived Campaign."
    );
  }

  const startAt = activation.startAt
    ? admin.firestore.Timestamp.fromDate(new Date(activation.startAt))
    : undefined;

  const endAt = activation.endAt
    ? admin.firestore.Timestamp.fromDate(new Date(activation.endAt))
    : undefined;

  if (startAt && endAt && endAt.toMillis() < startAt.toMillis()) {
    throw new Error(
      "INVALID_ACTIVATION_SCHEDULE: endAt cannot be before startAt."
    );
  }

  const activationRef = db.collection("activations").doc(activationId);
  const existingSnapshot = await activationRef.get();

  if (existingSnapshot.exists) {
    const existingData = existingSnapshot.data();

    if (existingData === undefined) {
      throw new Error("ACTIVATION_RECOVERY_FAILED");
    }

    const existingActivation = ActivationSchema.parse(existingData);

    const existingCreationDefinition = {
      activationId: existingActivation.activationId,
      retailerId: existingActivation.retailerId,
      campaignId: existingActivation.campaignId,
      name: existingActivation.name,
      description: existingActivation.description,
      target: existingActivation.target,
      productContext: existingActivation.productContext,
      shopperObjective: existingActivation.shopperObjective,
      experienceMode: existingActivation.experienceMode,
      experienceConfig: existingActivation.experienceConfig,
      advancedInstructions: existingActivation.advancedInstructions,
      approvalRequired: existingActivation.approvalRequired,
      startAt: existingActivation.startAt ? { seconds: existingActivation.startAt.seconds, nanoseconds: existingActivation.startAt.nanoseconds } : undefined,
      endAt: existingActivation.endAt ? { seconds: existingActivation.endAt.seconds, nanoseconds: existingActivation.endAt.nanoseconds } : undefined,
      timezone: existingActivation.timezone,
      createdBy: existingActivation.createdBy,
    };

    const requestedCreationDefinition = {
      activationId,
      retailerId,
      campaignId: activation.campaignId,
      name: activation.name,
      description: activation.description,
      target: activation.target,
      productContext: activation.productContext,
      shopperObjective: activation.shopperObjective,
      experienceMode: activation.experienceMode,
      experienceConfig: activation.experienceConfig,
      advancedInstructions: activation.advancedInstructions,
      approvalRequired: activation.approvalRequired,
      startAt: startAt ? { seconds: startAt.seconds, nanoseconds: startAt.nanoseconds } : undefined,
      endAt: endAt ? { seconds: endAt.seconds, nanoseconds: endAt.nanoseconds } : undefined,
      timezone: activation.timezone,
      createdBy: actorUid,
    };

    if (JSON.stringify(existingCreationDefinition) !== JSON.stringify(requestedCreationDefinition)) {
      throw new Error(
        "ACTIVATION_IDEMPOTENCY_CONFLICT: Existing Activation does not match the original creation definition."
      );
    }

    return {
      activationId,
      recovered: true,
    };
  }

  const now = admin.firestore.Timestamp.now();

  const activationData = ActivationSchema.parse({
    activationId,
    retailerId,
    campaignId: activation.campaignId,
    name: activation.name,
    ...(activation.description !== undefined
      ? { description: activation.description }
      : {}),
    target: activation.target,
    productContext: activation.productContext,
    shopperObjective: activation.shopperObjective,
    experienceMode: activation.experienceMode,
    experienceConfig: activation.experienceConfig,
    ...(activation.advancedInstructions !== undefined
      ? { advancedInstructions: activation.advancedInstructions }
      : {}),
    status: "DRAFT" as const,
    approvalRequired: activation.approvalRequired,
    ...(startAt !== undefined ? { startAt } : {}),
    ...(endAt !== undefined ? { endAt } : {}),
    ...(activation.timezone !== undefined
      ? { timezone: activation.timezone }
      : {}),
    configurationVersion: 1,
    createdAt: now,
    createdBy: actorUid,
    updatedAt: now,
    updatedBy: actorUid,
  });

  await activationRef.set(activationData);

  return {
    activationId,
    recovered: false,
  };
}
