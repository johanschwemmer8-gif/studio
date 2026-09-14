import { admin, db } from "@/lib/firebase-admin";
import { ActivationSchema } from "@/lib/schemas/activation";
import { DeploymentSchema } from "@/lib/schemas/deployment";
import type { CreateDeploymentInput } from "@/lib/schemas/deployment-command";

type DeploymentDefinition = Omit<
  CreateDeploymentInput,
  "idToken" | "retailerId" | "activationId"
>;

export type CreateDeploymentInternalInput = {
  deploymentId: string;
  retailerId: string;
  activationId: string;
  actorUid: string;
  deployment: DeploymentDefinition;
};

export type CreateDeploymentInternalResult = {
  deploymentId: string;
  recovered: boolean;
};

export async function createDeploymentInternal(
  input: CreateDeploymentInternalInput
): Promise<CreateDeploymentInternalResult> {
  if (db == null) {
    throw new Error("Infrastructure Layer Unavailable.");
  }

  const { deploymentId, retailerId, activationId, actorUid, deployment } = input;

  const activationRef = db.collection("activations").doc(activationId);
  const activationSnapshot = await activationRef.get();

  if (activationSnapshot.exists === false) {
    throw new Error("ACTIVATION_NOT_FOUND");
  }

  const rawActivation = activationSnapshot.data();

  if (rawActivation === undefined) {
    throw new Error("ACTIVATION_NOT_FOUND");
  }

  const activation = ActivationSchema.parse(rawActivation);

  if (activation.retailerId !== retailerId) {
    throw new Error(
      "ACCESS_DENIED: Activation does not belong to the authorized retailer."
    );
  }

  if (activation.status === "ENDED" || activation.status === "ARCHIVED") {
    throw new Error(
      "INVALID_ACTIVATION_STATE: Deployments cannot be created for an ended or archived Activation."
    );
  }

  const deploymentRef = db.collection("deployments").doc(deploymentId);
  const existingSnapshot = await deploymentRef.get();

  if (existingSnapshot.exists) {
    const existingData = existingSnapshot.data();

    if (existingData === undefined) {
      throw new Error("DEPLOYMENT_RECOVERY_FAILED");
    }

    const existingDeployment = DeploymentSchema.parse(existingData);

    const existingCreationDefinition = {
      deploymentId: existingDeployment.deploymentId,
      retailerId: existingDeployment.retailerId,
      activationId: existingDeployment.activationId,
      campaignId: existingDeployment.campaignId,
      storeId: existingDeployment.storeId,
      storeName: existingDeployment.storeName,
      placement: existingDeployment.placement,
      createdBy: existingDeployment.createdBy,
    };

    const requestedCreationDefinition = {
      deploymentId,
      retailerId,
      activationId: activation.activationId,
      campaignId: activation.campaignId,
      storeId: deployment.storeId,
      storeName: deployment.storeName,
      placement: deployment.placement,
      createdBy: actorUid,
    };

    if (
      JSON.stringify(existingCreationDefinition) !==
      JSON.stringify(requestedCreationDefinition)
    ) {
      throw new Error(
        "DEPLOYMENT_IDEMPOTENCY_CONFLICT: Existing Deployment does not match the original creation definition."
      );
    }

    return {
      deploymentId,
      recovered: true,
    };
  }

  const now = admin.firestore.Timestamp.now();

  const deploymentData = {
    deploymentId,
    retailerId,
    activationId: activation.activationId,
    campaignId: activation.campaignId,
    storeId: deployment.storeId,
    storeName: deployment.storeName,
    placement: deployment.placement,
    status: "NOT_ASSIGNED" as const,
    createdAt: now,
    createdBy: actorUid,
    updatedAt: now,
    updatedBy: actorUid,
  };

  DeploymentSchema.parse(deploymentData);

  await deploymentRef.set(deploymentData);

  return {
    deploymentId,
    recovered: false,
  };
}
