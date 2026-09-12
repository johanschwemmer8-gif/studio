'use server';

/**
 * @fileOverview Canonical QR reprint flow.
 *
 * Reprinting preserves QR identity. The client supplies only qrCodeId;
 * all Campaign, Activation, Deployment, tenant, tracking, and artifact
 * relationships are resolved and validated server-side.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import { QrCodeSchema } from '@/lib/schemas/qr-code';
import {
  ReprintQrCodeInputSchema,
  type ReprintQrCodeInput,
} from '@/lib/schemas/qr-command';

const RegenerateQrCodeOutputSchema = z.object({
  success: z.boolean(),
  signedUrl: z.string(),
  regeneratedAt: z.string(),
});

export type RegenerateQrCodeOutput = z.infer<
  typeof RegenerateQrCodeOutputSchema
>;

export type RegenerateQrCodeInput = ReprintQrCodeInput;

export async function regenerateQrCode(
  input: RegenerateQrCodeInput
): Promise<RegenerateQrCodeOutput> {
  return regenerateQrCodeFlow(input);
}

const regenerateQrCodeFlow = ai.defineFlow(
  {
    name: 'regenerateQrCodeFlow',
    inputSchema: ReprintQrCodeInputSchema,
    outputSchema: RegenerateQrCodeOutputSchema,
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

    requireCapability(actor.role, 'QR_REPRINT');

    if (db == null) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const qrRef = db.collection('qrcodes').doc(data.qrCodeId);

    const result = await db.runTransaction(async (transaction) => {
      const qrSnapshot = await transaction.get(qrRef);

      if (qrSnapshot.exists === false) {
        throw new Error('QR_NOT_FOUND');
      }

      const rawQr = qrSnapshot.data();

      if (rawQr === undefined) {
        throw new Error('QR_INTEGRITY_ERROR: QR identity is unreadable.');
      }

      const qrCode = QrCodeSchema.parse(rawQr);

      if (qrCode.qrCodeId !== data.qrCodeId) {
        throw new Error(
          'QR_INTEGRITY_ERROR: QR document identity does not match the requested QR.'
        );
      }

      if (qrCode.retailerId !== authorizedRetailerId) {
        throw new Error(
          'ACCESS_DENIED: QR identity does not belong to the authorized retailer.'
        );
      }

      if (qrCode.environment !== 'PRODUCTION') {
        throw new Error(
          'QR_INTEGRITY_ERROR: Canonical production reprint only supports production QR identities.'
        );
      }

      if (qrCode.status === 'RETIRED') {
        throw new Error(
          'QR_RETIRED: Retired QR identities cannot be reprinted.'
        );
      }

      const deploymentRef = db
        .collection('deployments')
        .doc(qrCode.deploymentId);

      const deploymentSnapshot = await transaction.get(deploymentRef);

      if (deploymentSnapshot.exists === false) {
        throw new Error(
          'DEPLOYMENT_NOT_FOUND: QR identity references a Deployment that does not exist.'
        );
      }

      const rawDeployment = deploymentSnapshot.data();

      if (rawDeployment === undefined) {
        throw new Error(
          'DEPLOYMENT_INTEGRITY_ERROR: QR identity references an unreadable Deployment.'
        );
      }

      const deployment = DeploymentSchema.parse(rawDeployment);

      if (
        deployment.retailerId !== qrCode.retailerId ||
        deployment.campaignId !== qrCode.campaignId ||
        deployment.activationId !== qrCode.activationId ||
        deployment.deploymentId !== qrCode.deploymentId ||
        deployment.qrCodeId !== qrCode.qrCodeId
      ) {
        throw new Error(
          'QR_INTEGRITY_ERROR: QR identity does not match the Deployment relationship chain.'
        );
      }

      if (deployment.removedAt !== undefined) {
        throw new Error(
          'DEPLOYMENT_REMOVED: QR identities bound to removed Deployments cannot be reprinted.'
        );
      }

      const encodedTrackingUrl = encodeURIComponent(qrCode.trackingUrl);
      const signedUrl =
        `https://api.qrserver.com/v1/create-qr-code/?size=512x512` +
        `&data=${encodedTrackingUrl}&color=000000&bgcolor=ffffff&ecc=M`;

      const storagePath =
        qrCode.storagePath ??
        `qr/${qrCode.retailerId}/${qrCode.campaignId}/${qrCode.qrCodeId}.png`;

      const now = admin.firestore.Timestamp.now();

      const candidateQrCode = {
        ...qrCode,
        storagePath,
        signedUrl,
        updatedAt: now,
        updatedBy: actor.uid,
      };

      QrCodeSchema.parse(candidateQrCode);

      transaction.update(qrRef, {
        storagePath: candidateQrCode.storagePath,
        signedUrl: candidateQrCode.signedUrl,
        updatedAt: candidateQrCode.updatedAt,
        updatedBy: candidateQrCode.updatedBy,
      });

      const auditLogRef = db.collection('auditLogs').doc();

      transaction.set(auditLogRef, {
        type: 'QR_REPRINT',
        retailerId: qrCode.retailerId,
        campaignId: qrCode.campaignId,
        activationId: qrCode.activationId,
        deploymentId: qrCode.deploymentId,
        qrCodeId: qrCode.qrCodeId,
        actorUid: actor.uid,
        timestamp: now,
      });

      return {
        signedUrl,
        regeneratedAt: now.toDate().toISOString(),
      };
    });

    return {
      success: true,
      signedUrl: result.signedUrl,
      regeneratedAt: result.regeneratedAt,
    };
  }
);
