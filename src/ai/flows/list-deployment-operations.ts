"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { db } from "@/lib/firebase-admin";
import { verifyAuth, getAuthorizedRetailerId } from "@/lib/auth-server";
import { canAccessQrStoreResource } from "@/lib/qr-resource-authorization";
import { DeploymentSchema } from "@/lib/schemas/deployment";
import { ActivationSchema } from "@/lib/schemas/activation";
import { CampaignSchema } from "@/lib/schemas/campaign";
import { QrCodeSchema } from "@/lib/schemas/qr-code";

const ListDeploymentOperationsInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
});

function timestampToIso(timestamp: {
  seconds: number;
  nanoseconds: number;
}): string {
  const milliseconds =
    timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1_000_000);

  return new Date(milliseconds).toISOString();
}

const DeploymentOperationsItemSchema = z.object({
  deploymentId: z.string().min(1),
  status: z.string().min(1),
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  placement: z.object({
    department: z.string().optional(),
    area: z.string().optional(),
    aisle: z.string().optional(),
    shelf: z.string().optional(),
    fixture: z.string().optional(),
    description: z.string().optional(),
  }),

  assignedAt: z.string().optional(),
  printedAt: z.string().optional(),
  deployedAt: z.string().optional(),

  problemReportedAt: z.string().optional(),
  problemReason: z.string().optional(),
  problemPreviousStatus: z.string().optional(),
  problemResolvedAt: z.string().optional(),

  removedAt: z.string().optional(),

  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),

  campaignId: z.string().min(1),
  campaignName: z.string().min(1),
  campaignStatus: z.string().min(1),

  activationId: z.string().min(1),
  activationName: z.string().min(1),
  activationStatus: z.string().min(1),
  activationTarget: z.object({
    level: z.string().min(1),
    value: z.string().min(1),
    label: z.string().optional(),
    productGtin: z.string().optional(),
  }),
  activationConfigurationVersion: z.number().int().positive(),
  activationApprovalRequired: z.boolean(),
  activationSubmittedAt: z.string().optional(),
  activationApprovedAt: z.string().optional(),
  activationStartAt: z.string().optional(),
  activationEndAt: z.string().optional(),
  activationTimezone: z.string().min(1).optional(),

  qrCodeId: z.string().min(1).optional(),
  qrStatus: z.string().min(1).optional(),
  qrEnvironment: z.string().min(1).optional(),
  trackingUrl: z.string().url().optional(),
  qrConfigurationVersion: z.number().int().positive().optional(),
});

export type DeploymentOperationsItem = z.infer<
  typeof DeploymentOperationsItemSchema
>;

const ListDeploymentOperationsOutputSchema = z.array(
  DeploymentOperationsItemSchema
);

export async function listDeploymentOperations(input: {
  idToken: string;
  retailerId: string;
}): Promise<DeploymentOperationsItem[]> {
  return listDeploymentOperationsFlow(input);
}

const listDeploymentOperationsFlow = ai.defineFlow(
  {
    name: "listDeploymentOperationsFlow",
    inputSchema: ListDeploymentOperationsInputSchema,
    outputSchema: ListDeploymentOperationsOutputSchema,
  },
  async (data) => {
    const actor = await verifyAuth(data.idToken);

    if ("error" in actor) {
      throw new Error(actor.error);
    }

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    if (!db) {
      throw new Error("Infrastructure Layer Unavailable.");
    }

    const deploymentSnapshot = await db
      .collection("deployments")
      .where("retailerId", "==", authorizedRetailerId)
      .get();

    const deployments: DeploymentOperationsItem[] = [];

    for (const document of deploymentSnapshot.docs) {
      const deployment = DeploymentSchema.parse(document.data());

      if (!canAccessQrStoreResource(actor, deployment.storeId)) {
        continue;
      }

      if (deployment.deploymentId !== document.id) {
        throw new Error("DEPLOYMENT_IDENTITY_MISMATCH");
      }

      const [campaignSnapshot, activationSnapshot] = await Promise.all([
        db.collection("campaigns").doc(deployment.campaignId).get(),
        db.collection("activations").doc(deployment.activationId).get(),
      ]);

      if (!campaignSnapshot.exists) {
        throw new Error("DEPLOYMENT_CAMPAIGN_NOT_FOUND");
      }

      if (!activationSnapshot.exists) {
        throw new Error("DEPLOYMENT_ACTIVATION_NOT_FOUND");
      }

      const campaign = CampaignSchema.parse(campaignSnapshot.data());
      const activation = ActivationSchema.parse(activationSnapshot.data());

      if (campaign.campaignId !== campaignSnapshot.id) {
        throw new Error("CAMPAIGN_IDENTITY_MISMATCH");
      }

      if (activation.activationId !== activationSnapshot.id) {
        throw new Error("ACTIVATION_IDENTITY_MISMATCH");
      }

      if (
        campaign.retailerId !== authorizedRetailerId ||
        campaign.campaignId !== deployment.campaignId
      ) {
        throw new Error("DEPLOYMENT_CAMPAIGN_RELATIONSHIP_MISMATCH");
      }

      if (
        activation.retailerId !== authorizedRetailerId ||
        activation.campaignId !== deployment.campaignId ||
        activation.activationId !== deployment.activationId
      ) {
        throw new Error("DEPLOYMENT_ACTIVATION_RELATIONSHIP_MISMATCH");
      }

      let qrProjection: {
        qrCodeId?: string;
        qrStatus?: string;
        qrEnvironment?: string;
        trackingUrl?: string;
        qrConfigurationVersion?: number;
      } = {};

      if (deployment.qrCodeId) {
        const qrSnapshot = await db
          .collection("qrcodes")
          .doc(deployment.qrCodeId)
          .get();

        if (!qrSnapshot.exists) {
          throw new Error("DEPLOYMENT_QR_NOT_FOUND");
        }

        const qrCode = QrCodeSchema.parse(qrSnapshot.data());

        if (qrCode.qrCodeId !== qrSnapshot.id) {
          throw new Error("QR_IDENTITY_MISMATCH");
        }

        if (
          qrCode.qrCodeId !== deployment.qrCodeId ||
          qrCode.retailerId !== authorizedRetailerId ||
          qrCode.campaignId !== deployment.campaignId ||
          qrCode.activationId !== deployment.activationId ||
          qrCode.deploymentId !== deployment.deploymentId
        ) {
          throw new Error("DEPLOYMENT_QR_RELATIONSHIP_MISMATCH");
        }

        qrProjection = {
          qrCodeId: qrCode.qrCodeId,
          qrStatus: qrCode.status,
          qrEnvironment: qrCode.environment,
          trackingUrl: qrCode.trackingUrl,
          qrConfigurationVersion: qrCode.configurationVersion,
        };
      }

      deployments.push({
        deploymentId: deployment.deploymentId,
        status: deployment.status,
        storeId: deployment.storeId,
        storeName: deployment.storeName,
        placement: deployment.placement,

        assignedAt: deployment.assignedAt
          ? timestampToIso(deployment.assignedAt)
          : undefined,
        printedAt: deployment.printedAt
          ? timestampToIso(deployment.printedAt)
          : undefined,
        deployedAt: deployment.deployedAt
          ? timestampToIso(deployment.deployedAt)
          : undefined,

        problemReportedAt: deployment.problemReportedAt
          ? timestampToIso(deployment.problemReportedAt)
          : undefined,
        problemReason: deployment.problemReason,
        problemPreviousStatus: deployment.problemPreviousStatus,
        problemResolvedAt: deployment.problemResolvedAt
          ? timestampToIso(deployment.problemResolvedAt)
          : undefined,

        removedAt: deployment.removedAt
          ? timestampToIso(deployment.removedAt)
          : undefined,

        createdAt: timestampToIso(deployment.createdAt),
        updatedAt: timestampToIso(deployment.updatedAt),

        campaignId: campaign.campaignId,
        campaignName: campaign.name,
        campaignStatus: campaign.status,

        activationId: activation.activationId,
        activationName: activation.name,
        activationStatus: activation.status,
        activationTarget: activation.target,
        activationConfigurationVersion: activation.configurationVersion,
        activationApprovalRequired: activation.approvalRequired,
        activationSubmittedAt: activation.submittedAt
          ? timestampToIso(activation.submittedAt)
          : undefined,
        activationApprovedAt: activation.approvedAt
          ? timestampToIso(activation.approvedAt)
          : undefined,
        activationStartAt: activation.startAt
          ? timestampToIso(activation.startAt)
          : undefined,
        activationEndAt: activation.endAt
          ? timestampToIso(activation.endAt)
          : undefined,
        activationTimezone: activation.timezone,

        ...qrProjection,
      });
    }

    return deployments.sort((a, b) => {
      const storeComparison = a.storeName.localeCompare(b.storeName);

      if (storeComparison !== 0) {
        return storeComparison;
      }

      return a.deploymentId.localeCompare(b.deploymentId);
    });
  }
);
