'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import { QrCodeSchema } from '@/lib/schemas/qr-code';
import {
  MarkDeploymentDeployedInputSchema,
  type MarkDeploymentDeployedInput,
} from '@/lib/schemas/deployment-command';

const MarkDeploymentDeployedOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
  status: z.literal('DEPLOYED'),
});

export type MarkDeploymentDeployedOutput = z.infer<
  typeof MarkDeploymentDeployedOutputSchema
>;

export async function markDeploymentDeployed(
  input: MarkDeploymentDeployedInput
): Promise<MarkDeploymentDeployedOutput> {
  return markDeploymentDeployedFlow(input);
}

const markDeploymentDeployedFlow = ai.defineFlow(
  {
    name: 'markDeploymentDeployedFlow',
    inputSchema: MarkDeploymentDeployedInputSchema,
    outputSchema: MarkDeploymentDeployedOutputSchema,
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

    requireCapability(actor.role, 'DEPLOYMENT_MARK_DEPLOYED');

    if (db == null) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const deploymentRef = db.collection('deployments').doc(data.deploymentId);
    await db.runTransaction(async (transaction) => {
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

    if (existingDeployment.removedAt !== undefined) {
      throw new Error(
        'DEPLOYMENT_REMOVED: Removed Deployments cannot be marked deployed.'
      );
    }

    if (existingDeployment.status !== 'PRINTED') {
      throw new Error(
        'INVALID_DEPLOYMENT_TRANSITION: Only PRINTED Deployments can be marked deployed.'
      );
    }

    if (existingDeployment.qrCodeId === undefined) {
      throw new Error(
        'QR_NOT_BOUND: Deployment cannot be deployed without a stable QR identity.'
      );
    }

    const qrRef = db.collection('qrcodes').doc(existingDeployment.qrCodeId);
    const qrSnapshot = await transaction.get(qrRef);

    if (qrSnapshot.exists === false) {
      throw new Error('QR_INTEGRITY_ERROR: Deployment references a QR identity that does not exist.');
    }

    const rawQr = qrSnapshot.data();

    if (rawQr === undefined) {
      throw new Error('QR_INTEGRITY_ERROR: Deployment references an unreadable QR identity.');
    }

    const qrCode = QrCodeSchema.parse(rawQr);

    if (
      qrCode.retailerId !== authorizedRetailerId ||
      qrCode.deploymentId !== existingDeployment.deploymentId ||
      qrCode.activationId !== existingDeployment.activationId ||
      qrCode.campaignId !== existingDeployment.campaignId
    ) {
      throw new Error('QR_INTEGRITY_ERROR: QR identity does not match the Deployment relationship chain.');
    }

    if (qrCode.environment !== 'PRODUCTION') {
      throw new Error('QR_INTEGRITY_ERROR: A production Deployment cannot use a non-production QR identity.');
    }

    if (qrCode.status !== 'ASSIGNED') {
      throw new Error('INVALID_QR_TRANSITION: Only ASSIGNED QR identities can transition to DEPLOYED.');
    }

    const now = admin.firestore.Timestamp.now();
    const nextDeploymentStatus: 'DEPLOYED' = 'DEPLOYED';
    const nextQrStatus: 'DEPLOYED' = 'DEPLOYED';

    const candidateDeployment = {
      ...existingDeployment,
      status: nextDeploymentStatus,
      deployedAt: now,
      deployedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    const candidateQrCode = {
      ...qrCode,
      status: nextQrStatus,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    DeploymentSchema.parse(candidateDeployment);
    QrCodeSchema.parse(candidateQrCode);

    transaction.update(deploymentRef, {
      status: candidateDeployment.status,
      deployedAt: candidateDeployment.deployedAt,
      deployedBy: candidateDeployment.deployedBy,
      updatedAt: candidateDeployment.updatedAt,
      updatedBy: candidateDeployment.updatedBy,
    });

    transaction.update(qrRef, {
      status: candidateQrCode.status,
      updatedAt: candidateQrCode.updatedAt,
      updatedBy: candidateQrCode.updatedBy,
    });
  });

    return {
      success: true,
      deploymentId: data.deploymentId,
      status: 'DEPLOYED' as const,
    };
  }
);
