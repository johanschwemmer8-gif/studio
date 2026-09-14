"use server";

/**
 * @fileOverview Generates an operational Deployment Pack for an existing
 * Deployment with an already-bound canonical production QR identity.
 *
 * ARCHITECTURE:
 * - The Deployment Pack is an operational projection, not a domain entity.
 * - It does not create, replace, or mutate QR identity.
 * - It does not advance Deployment lifecycle state.
 * - Campaign, Activation, Deployment, and QR relationships are resolved
 *   and validated server-side from canonical records.
 * - The QR image renders the existing canonical trackingUrl.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import QRCode from "qrcode";

import { db } from "@/lib/firebase-admin";
import { verifyAuth, getAuthorizedRetailerId } from "@/lib/auth-server";
import { requireCapability } from "@/lib/authorization";
import { CampaignSchema } from "@/lib/schemas/campaign";
import { ActivationSchema } from "@/lib/schemas/activation";
import {
  DeploymentSchema,
  DeploymentPlacementSchema,
} from "@/lib/schemas/deployment";
import { QrCodeSchema } from "@/lib/schemas/qr-code";
import {
  GenerateDeploymentPackInputSchema,
  type GenerateDeploymentPackInput,
} from "@/lib/schemas/deployment-command";

const DeploymentPackOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
  qrCodeId: z.string(),

  campaign: z.object({
    campaignId: z.string(),
    name: z.string(),
  }),

  activation: z.object({
    activationId: z.string(),
    name: z.string(),
    target: z.object({
      level: z.string(),
      value: z.string(),
      label: z.string().optional(),
      productGtin: z.string().optional(),
    }),
    shopperObjective: z.string(),
    configurationVersion: z.number().int().positive(),
  }),

  deployment: z.object({
    storeId: z.string(),
    storeName: z.string(),
    placement: DeploymentPlacementSchema,
    status: z.enum(["READY_TO_PRINT", "PRINTED", "DEPLOYED"]),
  }),

  qr: z.object({
    trackingUrl: z.string().url(),
    qrImageDataUrl: z.string().min(1),
  }),

  generatedAt: z.string(),
});

export type GenerateDeploymentPackOutput = z.infer<
  typeof DeploymentPackOutputSchema
>;

export async function generateDeploymentPack(
  input: GenerateDeploymentPackInput
): Promise<GenerateDeploymentPackOutput> {
  return generateDeploymentPackFlow(input);
}

const generateDeploymentPackFlow = ai.defineFlow(
  {
    name: "generateDeploymentPackFlow",
    inputSchema: GenerateDeploymentPackInputSchema,
    outputSchema: DeploymentPackOutputSchema,
  },
  async (data) => {
    const actor = await verifyAuth(data.idToken);

    if ('error' in actor) {
      throw new Error(actor.error);
    }

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    requireCapability(actor.role, "DEPLOYMENT_PACK_GENERATE");

    if (db == null) {
      throw new Error("Infrastructure Layer Unavailable.");
    }

    const deploymentSnapshot = await db
      .collection("deployments")
      .doc(data.deploymentId)
      .get();

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
        "DEPLOYMENT_REMOVED: Removed Deployments cannot generate Deployment Packs."
      );
    }

    if (deployment.status === "PROBLEM_REPORTED") {
      throw new Error(
        "INVALID_DEPLOYMENT_STATE: A Deployment with an unresolved problem cannot generate a Deployment Pack."
      );
    }

    if (
      deployment.status !== "READY_TO_PRINT" &&
      deployment.status !== "PRINTED" &&
      deployment.status !== "DEPLOYED"
    ) {
      throw new Error(
        "INVALID_DEPLOYMENT_STATE: Deployment Pack generation requires an existing printable QR identity."
      );
    }

    if (deployment.qrCodeId === undefined) {
      throw new Error(
        "QR_INTEGRITY_ERROR: Deployment does not reference a QR identity."
      );
    }

    const qrSnapshot = await db
      .collection("qrcodes")
      .doc(deployment.qrCodeId)
      .get();

    if (qrSnapshot.exists === false) {
      throw new Error(
        "QR_INTEGRITY_ERROR: Deployment references a QR identity that does not exist."
      );
    }

    const rawQr = qrSnapshot.data();

    if (rawQr === undefined) {
      throw new Error(
        "QR_INTEGRITY_ERROR: Deployment references an unreadable QR identity."
      );
    }

    const qrCode = QrCodeSchema.parse(rawQr);

    if (qrCode.environment !== "PRODUCTION") {
      throw new Error(
        "QR_INTEGRITY_ERROR: Deployment Packs only support production QR identities."
      );
    }

    if (qrCode.status === "RETIRED") {
      throw new Error(
        "QR_RETIRED: Retired QR identities cannot generate Deployment Packs."
      );
    }

    if (
      qrCode.qrCodeId !== deployment.qrCodeId ||
      qrCode.retailerId !== deployment.retailerId ||
      qrCode.campaignId !== deployment.campaignId ||
      qrCode.activationId !== deployment.activationId ||
      qrCode.deploymentId !== deployment.deploymentId
    ) {
      throw new Error(
        "QR_INTEGRITY_ERROR: QR identity does not match the Deployment relationship chain."
      );
    }

    const activationSnapshot = await db
      .collection("activations")
      .doc(deployment.activationId)
      .get();

    if (activationSnapshot.exists === false) {
      throw new Error("ACTIVATION_NOT_FOUND");
    }

    const rawActivation = activationSnapshot.data();

    if (rawActivation === undefined) {
      throw new Error("ACTIVATION_NOT_FOUND");
    }

    const activation = ActivationSchema.parse(rawActivation);

    if (
      activation.retailerId !== authorizedRetailerId ||
      activation.activationId !== deployment.activationId ||
      activation.campaignId !== deployment.campaignId ||
      activation.configurationVersion !== qrCode.configurationVersion
    ) {
      throw new Error(
        "ACTIVATION_INTEGRITY_ERROR: Activation does not match the Deployment and QR relationship chain."
      );
    }

    const campaignSnapshot = await db
      .collection("campaigns")
      .doc(deployment.campaignId)
      .get();

    if (campaignSnapshot.exists === false) {
      throw new Error("CAMPAIGN_NOT_FOUND");
    }

    const rawCampaign = campaignSnapshot.data();

    if (rawCampaign === undefined) {
      throw new Error("CAMPAIGN_NOT_FOUND");
    }

    const campaign = CampaignSchema.parse(rawCampaign);

    if (
      campaign.retailerId !== authorizedRetailerId ||
      campaign.campaignId !== deployment.campaignId ||
      campaign.campaignId !== activation.campaignId
    ) {
      throw new Error(
        "CAMPAIGN_INTEGRITY_ERROR: Campaign does not match the Activation and Deployment relationship chain."
      );
    }

    const qrImageDataUrl = await QRCode.toDataURL(qrCode.trackingUrl, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 512,
      margin: 4,
    });

    return {
      success: true,
      deploymentId: deployment.deploymentId,
      qrCodeId: qrCode.qrCodeId,

      campaign: {
        campaignId: campaign.campaignId,
        name: campaign.name,
      },

      activation: {
        activationId: activation.activationId,
        name: activation.name,
        target: activation.target,
        shopperObjective: activation.shopperObjective,
        configurationVersion: activation.configurationVersion,
      },

      deployment: {
        storeId: deployment.storeId,
        storeName: deployment.storeName,
        placement: deployment.placement,
        status: deployment.status,
      },

      qr: {
        trackingUrl: qrCode.trackingUrl,
        qrImageDataUrl,
      },

      generatedAt: new Date().toISOString(),
    };
  }
);
