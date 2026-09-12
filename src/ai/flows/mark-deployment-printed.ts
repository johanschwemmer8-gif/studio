'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import {
  MarkDeploymentPrintedInputSchema,
  type MarkDeploymentPrintedInput,
} from '@/lib/schemas/deployment-command';

const MarkDeploymentPrintedOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
  status: z.literal('PRINTED'),
});

export type MarkDeploymentPrintedOutput = z.infer<
  typeof MarkDeploymentPrintedOutputSchema
>;

export async function markDeploymentPrinted(
  input: MarkDeploymentPrintedInput
): Promise<MarkDeploymentPrintedOutput> {
  return markDeploymentPrintedFlow(input);
}

const markDeploymentPrintedFlow = ai.defineFlow(
  {
    name: 'markDeploymentPrintedFlow',
    inputSchema: MarkDeploymentPrintedInputSchema,
    outputSchema: MarkDeploymentPrintedOutputSchema,
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

    requireCapability(actor.role, 'DEPLOYMENT_MARK_PRINTED');

    if (db == null) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const deploymentRef = db.collection('deployments').doc(data.deploymentId);
    const deploymentSnapshot = await deploymentRef.get();

    if (deploymentSnapshot.exists === false) {
      throw new Error('DEPLOYMENT_NOT_FOUND');
    }

    const existingDeployment = deploymentSnapshot.data();

    if (existingDeployment === undefined) {
      throw new Error('DEPLOYMENT_NOT_FOUND');
    }

    DeploymentSchema.parse(existingDeployment);

    if (existingDeployment.retailerId !== authorizedRetailerId) {
      throw new Error(
        'ACCESS_DENIED: Deployment does not belong to the authorized retailer.'
      );
    }

    if (existingDeployment.removedAt !== undefined) {
      throw new Error(
        'DEPLOYMENT_REMOVED: Removed Deployments cannot be marked printed.'
      );
    }

    if (existingDeployment.status !== 'READY_TO_PRINT') {
      throw new Error(
        'INVALID_DEPLOYMENT_TRANSITION: Only READY_TO_PRINT Deployments can be marked printed.'
      );
    }

    if (existingDeployment.qrCodeId === undefined) {
      throw new Error(
        'QR_NOT_BOUND: Deployment cannot be printed without a stable QR identity.'
      );
    }

    const now = admin.firestore.Timestamp.now();
    const nextStatus: 'PRINTED' = 'PRINTED';

    const candidateDeployment = {
      ...existingDeployment,
      status: nextStatus,
      printedAt: now,
      printedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    DeploymentSchema.parse(candidateDeployment);

    await deploymentRef.update({
      status: candidateDeployment.status,
      printedAt: candidateDeployment.printedAt,
      printedBy: candidateDeployment.printedBy,
      updatedAt: candidateDeployment.updatedAt,
      updatedBy: candidateDeployment.updatedBy,
    });

    return {
      success: true,
      deploymentId: data.deploymentId,
      status: nextStatus,
    };
  }
);
