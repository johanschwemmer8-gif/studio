'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import { QrCodeSchema } from '@/lib/schemas/qr-code';
import {
  RemoveDeploymentInputSchema,
  type RemoveDeploymentInput,
} from '@/lib/schemas/deployment-command';

const RemoveDeploymentOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
  alreadyRemoved: z.boolean(),
});

export type RemoveDeploymentOutput = z.infer<
  typeof RemoveDeploymentOutputSchema
>;

export async function removeDeployment(
  input: RemoveDeploymentInput
): Promise<RemoveDeploymentOutput> {
  return removeDeploymentFlow(input);
}

const removeDeploymentFlow = ai.defineFlow(
  {
    name: 'removeDeploymentFlow',
    inputSchema: RemoveDeploymentInputSchema,
    outputSchema: RemoveDeploymentOutputSchema,
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

    requireCapability(actor.role, 'DEPLOYMENT_REMOVE');

    if (db == null) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const deploymentRef = db.collection('deployments').doc(data.deploymentId);

    const alreadyRemoved = await db.runTransaction(async (transaction) => {
      const deploymentSnapshot = await transaction.get(deploymentRef);

      if (deploymentSnapshot.exists === false) {
        throw new Error('DEPLOYMENT_NOT_FOUND');
      }

      const rawDeployment = deploymentSnapshot.data();

      if (rawDeployment === undefined) {
        throw new Error('DEPLOYMENT_NOT_FOUND');
      }

      const existingDeployment = DeploymentSchema.parse(rawDeployment);

      if (existingDeployment.retailerId !== authorizedRetailerId) {
        throw new Error(
          'ACCESS_DENIED: Deployment does not belong to the authorized retailer.'
        );
      }

      const wasAlreadyRemoved = existingDeployment.removedAt !== undefined;
      const now = admin.firestore.Timestamp.now();

      if (existingDeployment.qrCodeId === undefined) {
        if (wasAlreadyRemoved === false) {
          const candidateDeployment = {
            ...existingDeployment,
            removedAt: now,
            removedBy: actor.uid,
            updatedAt: now,
            updatedBy: actor.uid,
          };

          DeploymentSchema.parse(candidateDeployment);

          transaction.update(deploymentRef, {
            removedAt: candidateDeployment.removedAt,
            removedBy: candidateDeployment.removedBy,
            updatedAt: candidateDeployment.updatedAt,
            updatedBy: candidateDeployment.updatedBy,
          });
        }

        return wasAlreadyRemoved;
      }

      const qrRef = db.collection('qrcodes').doc(existingDeployment.qrCodeId);
      const qrSnapshot = await transaction.get(qrRef);

      if (qrSnapshot.exists === false) {
        throw new Error(
          'QR_INTEGRITY_ERROR: Deployment references a QR identity that does not exist.'
        );
      }

      const rawQr = qrSnapshot.data();

      if (rawQr === undefined) {
        throw new Error(
          'QR_INTEGRITY_ERROR: Deployment references an unreadable QR identity.'
        );
      }

      const qrCode = QrCodeSchema.parse(rawQr);

      if (
        qrCode.retailerId !== authorizedRetailerId ||
        qrCode.deploymentId !== existingDeployment.deploymentId ||
        qrCode.activationId !== existingDeployment.activationId ||
        qrCode.campaignId !== existingDeployment.campaignId
      ) {
        throw new Error(
          'QR_INTEGRITY_ERROR: QR identity does not match the Deployment relationship chain.'
        );
      }

      if (qrCode.environment !== 'PRODUCTION') {
        throw new Error(
          'QR_INTEGRITY_ERROR: A production Deployment cannot use a non-production QR identity.'
        );
      }

      if (wasAlreadyRemoved === false) {
        const candidateDeployment = {
          ...existingDeployment,
          removedAt: now,
          removedBy: actor.uid,
          updatedAt: now,
          updatedBy: actor.uid,
      };

        DeploymentSchema.parse(candidateDeployment);

        transaction.update(deploymentRef, {
          removedAt: candidateDeployment.removedAt,
          removedBy: candidateDeployment.removedBy,
          updatedAt: candidateDeployment.updatedAt,
          updatedBy: candidateDeployment.updatedBy,
        });
      }

      if (qrCode.status !== 'RETIRED') {
        const candidateQrCode = {
          ...qrCode,
          status: 'RETIRED' as const,
          retiredAt: now,
          retiredBy: actor.uid,
          updatedAt: now,
          updatedBy: actor.uid,
        };

        QrCodeSchema.parse(candidateQrCode);

        transaction.update(qrRef, {
          status: candidateQrCode.status,
          retiredAt: candidateQrCode.retiredAt,
          retiredBy: candidateQrCode.retiredBy,
          updatedAt: candidateQrCode.updatedAt,
          updatedBy: candidateQrCode.updatedBy,
        });
      }

      return wasAlreadyRemoved;
    });

    return {
      success: true,
      deploymentId: data.deploymentId,
      alreadyRemoved,
    };
  }
);
