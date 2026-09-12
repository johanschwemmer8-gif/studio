'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { ActivationSchema } from '@/lib/schemas/activation';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import {
  CreateDeploymentInputSchema,
  type CreateDeploymentInput,
} from '@/lib/schemas/deployment-command';

const CreateDeploymentOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
});

export type CreateDeploymentOutput = z.infer<
  typeof CreateDeploymentOutputSchema
>;

export async function createDeployment(
  input: CreateDeploymentInput
): Promise<CreateDeploymentOutput> {
  return createDeploymentFlow(input);
}

const createDeploymentFlow = ai.defineFlow(
  {
    name: 'createDeploymentFlow',
    inputSchema: CreateDeploymentInputSchema,
    outputSchema: CreateDeploymentOutputSchema,
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

    requireCapability(actor.role, 'DEPLOYMENT_CREATE');

    if (db == null) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const activationRef = db.collection('activations').doc(data.activationId);
    const activationSnapshot = await activationRef.get();

    if (activationSnapshot.exists === false) {
      throw new Error('ACTIVATION_NOT_FOUND');
    }

    const rawActivation = activationSnapshot.data();

    if (rawActivation === undefined) {
      throw new Error('ACTIVATION_NOT_FOUND');
    }

    const activation = ActivationSchema.parse(rawActivation);

    if (activation.retailerId !== authorizedRetailerId) {
      throw new Error(
        'ACCESS_DENIED: Activation does not belong to the authorized retailer.'
      );
    }

    if (
      activation.status === 'ENDED' ||
      activation.status === 'ARCHIVED'
    ) {
      throw new Error(
        'INVALID_ACTIVATION_STATE: Deployments cannot be created for an ended or archived Activation.'
      );
    }

    const deploymentRef = db.collection('deployments').doc();
    const now = admin.firestore.Timestamp.now();

    const deploymentData = {
      deploymentId: deploymentRef.id,
      retailerId: authorizedRetailerId,
      activationId: activation.activationId,
      campaignId: activation.campaignId,
      storeId: data.storeId,
      storeName: data.storeName,
      placement: data.placement,
      status: 'NOT_ASSIGNED' as const,
      createdAt: now,
      createdBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    DeploymentSchema.parse(deploymentData);

    await deploymentRef.set(deploymentData);

    return {
      success: true,
      deploymentId: deploymentRef.id,
    };
  }
);
