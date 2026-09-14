'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { createDeploymentInternal } from '@/lib/deployment-internal';
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

    if ('error' in actor) {
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

    const deploymentRef = db.collection('deployments').doc();

    const result = await createDeploymentInternal({
      deploymentId: deploymentRef.id,
      retailerId: authorizedRetailerId,
      activationId: data.activationId,
      actorUid: actor.uid,
      deployment: {
        storeId: data.storeId,
        storeName: data.storeName,
        placement: data.placement,
      },
    });

    return {
      success: true,
      deploymentId: result.deploymentId,
    };
  }
);
