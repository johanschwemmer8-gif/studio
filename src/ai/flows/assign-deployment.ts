'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import {
  AssignDeploymentInputSchema,
  type AssignDeploymentInput,
} from '@/lib/schemas/deployment-command';

const AssignDeploymentOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
  status: z.literal('ASSIGNED'),
});

export type AssignDeploymentOutput = z.infer<
  typeof AssignDeploymentOutputSchema
>;

export async function assignDeployment(
  input: AssignDeploymentInput
): Promise<AssignDeploymentOutput> {
  return assignDeploymentFlow(input);
}

const assignDeploymentFlow = ai.defineFlow(
  {
    name: 'assignDeploymentFlow',
    inputSchema: AssignDeploymentInputSchema,
    outputSchema: AssignDeploymentOutputSchema,
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

    requireCapability(actor.role, 'DEPLOYMENT_ASSIGN');

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
        'DEPLOYMENT_REMOVED: Removed Deployments cannot be assigned.'
      );
    }

    if (existingDeployment.status !== 'NOT_ASSIGNED') {
      throw new Error(
        'INVALID_DEPLOYMENT_TRANSITION: Only NOT_ASSIGNED Deployments can be assigned.'
      );
    }

    const now = admin.firestore.Timestamp.now();
    const nextStatus: 'ASSIGNED' = 'ASSIGNED';

    const candidateDeployment = {
      ...existingDeployment,
      status: nextStatus,
      assignedAt: now,
      assignedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    DeploymentSchema.parse(candidateDeployment);

    await deploymentRef.update({
      status: candidateDeployment.status,
      assignedAt: candidateDeployment.assignedAt,
      assignedBy: candidateDeployment.assignedBy,
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
