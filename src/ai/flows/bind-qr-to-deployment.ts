"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { admin, db } from "@/lib/firebase-admin";
import { verifyAuth, getAuthorizedRetailerId } from "@/lib/auth-server";
import { requireCapability } from "@/lib/authorization";
import { ActivationSchema } from "@/lib/schemas/activation";
import { DeploymentSchema } from "@/lib/schemas/deployment";
import { QrCodeSchema } from "@/lib/schemas/qr-code";
import {
  BindQrToDeploymentInputSchema,
  type BindQrToDeploymentInput,
} from "@/lib/schemas/qr-command";

const BindQrToDeploymentOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
  qrCodeId: z.string(),
  deploymentStatus: z.literal("READY_TO_PRINT"),
  qrStatus: z.literal("ASSIGNED"),
});

export type BindQrToDeploymentOutput = z.infer<
  typeof BindQrToDeploymentOutputSchema
>;

export async function bindQrToDeployment(
  input: BindQrToDeploymentInput
): Promise<BindQrToDeploymentOutput> {
  return bindQrToDeploymentFlow(input);
}

const bindQrToDeploymentFlow = ai.defineFlow(
  {
    name: "bindQrToDeploymentFlow",
    inputSchema: BindQrToDeploymentInputSchema,
    outputSchema: BindQrToDeploymentOutputSchema,
  },
  async (data) => {
    const actor = await verifyAuth(data.idToken);

    if (actor.error) {
      throw new Error(actor.error);
    }

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    requireCapability(actor.role, "QR_GENERATE");

    if (db == null) {
      throw new Error("Infrastructure Layer Unavailable.");
    }

    const deploymentRef = db.collection("deployments").doc(data.deploymentId);

    const result = await db.runTransaction(async (transaction) => {
      const deploymentSnapshot = await transaction.get(deploymentRef);

      if (deploymentSnapshot.exists === false) {
        throw new Error("DEPLOYMENT_NOT_FOUND");
      }

      const rawDeployment = deploymentSnapshot.data();

      if (rawDeployment === undefined) {
        throw new Error("DEPLOYMENT_NOT_FOUND");
      }

      const deployment = DeploymentSchema.parse(rawDeployment);

      if (deployment.retailerId !== authorizedRetailerId) {
        throw new Error(
          "ACCESS_DENIED: Deployment does not belong to the authorized retailer."
        );
      }

      if (deployment.removedAt !== undefined) {
        throw new Error(
          "DEPLOYMENT_REMOVED: Removed Deployments cannot receive a QR identity."
        );
      }

      if (deployment.status === "PROBLEM_REPORTED") {
        throw new Error(
          "INVALID_DEPLOYMENT_STATE: A Deployment with an unresolved problem cannot receive a QR identity."
        );
      }

      if (deployment.qrCodeId !== undefined) {
        const existingQrRef = db.collection("qrcodes").doc(deployment.qrCodeId);
        const existingQrSnapshot = await transaction.get(existingQrRef);

        if (existingQrSnapshot.exists === false) {
          throw new Error(
            "QR_INTEGRITY_ERROR: Deployment references a QR identity that does not exist."
          );
        }

        const rawExistingQr = existingQrSnapshot.data();

        if (rawExistingQr === undefined) {
          throw new Error(
            "QR_INTEGRITY_ERROR: Deployment references an unreadable QR identity."
          );
        }

        const existingQr = QrCodeSchema.parse(rawExistingQr);

        if (
          existingQr.retailerId !== authorizedRetailerId ||
          existingQr.deploymentId !== deployment.deploymentId ||
          existingQr.activationId !== deployment.activationId ||
          existingQr.campaignId !== deployment.campaignId
        ) {
          throw new Error(
            "QR_INTEGRITY_ERROR: Existing QR identity does not match the Deployment relationship chain."
          );
        }

        if (deployment.status !== "READY_TO_PRINT") {
          throw new Error(
            "QR_INTEGRITY_ERROR: Deployment already has a QR identity but is not READY_TO_PRINT."
          );
        }

        return {
          qrCodeId: existingQr.qrCodeId,
        };
      }

      if (deployment.status !== "ASSIGNED") {
        throw new Error(
          "INVALID_DEPLOYMENT_TRANSITION: Only ASSIGNED Deployments can receive a production QR identity."
        );
      }

      const activationRef = db
        .collection("activations")
        .doc(deployment.activationId);
      const activationSnapshot = await transaction.get(activationRef);

      if (activationSnapshot.exists === false) {
        throw new Error("ACTIVATION_NOT_FOUND");
      }

      const rawActivation = activationSnapshot.data();

      if (rawActivation === undefined) {
        throw new Error("ACTIVATION_NOT_FOUND");
      }

      const activation = ActivationSchema.parse(rawActivation);

      if (activation.retailerId !== authorizedRetailerId) {
        throw new Error(
          "ACCESS_DENIED: Activation does not belong to the authorized retailer."
        );
      }

      if (
        activation.activationId !== deployment.activationId ||
        activation.campaignId !== deployment.campaignId
      ) {
        throw new Error(
          "QR_INTEGRITY_ERROR: Deployment and Activation relationship chain is inconsistent."
        );
      }

      if (
        activation.status === "ENDED" ||
        activation.status === "ARCHIVED"
      ) {
        throw new Error(
          "INVALID_ACTIVATION_STATE: A QR identity cannot be bound to an ended or archived Activation."
        );
      }

      const qrRef = db.collection("qrcodes").doc();
      const now = admin.firestore.Timestamp.now();

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

      const trackingUrl = `${baseUrl.replace(/\/$/, "")}/resolve/${qrRef.id}`;

      const qrData = {
        qrCodeId: qrRef.id,
        retailerId: authorizedRetailerId,
        campaignId: activation.campaignId,
        activationId: activation.activationId,
        deploymentId: deployment.deploymentId,
        environment: "PRODUCTION" as const,
        status: "ASSIGNED" as const,
        trackingUrl,
        configurationVersion: activation.configurationVersion,
        createdAt: now,
        createdBy: actor.uid,
        updatedAt: now,
        updatedBy: actor.uid,
      };

      QrCodeSchema.parse(qrData);

      const candidateDeployment = {
        ...deployment,
        qrCodeId: qrRef.id,
        status: "READY_TO_PRINT" as const,
        updatedAt: now,
        updatedBy: actor.uid,
      };

      DeploymentSchema.parse(candidateDeployment);

      transaction.set(qrRef, qrData);
      transaction.update(deploymentRef, {
        qrCodeId: qrRef.id,
        status: candidateDeployment.status,
        updatedAt: candidateDeployment.updatedAt,
        updatedBy: candidateDeployment.updatedBy,
      });

      return {
        qrCodeId: qrRef.id,
      };
    });

    return {
      success: true,
      deploymentId: data.deploymentId,
      qrCodeId: result.qrCodeId,
      deploymentStatus: "READY_TO_PRINT" as const,
      qrStatus: "ASSIGNED" as const,
    };
  }
);
