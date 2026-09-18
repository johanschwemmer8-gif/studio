'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import { ActivationSchema } from '@/lib/schemas/activation';
import { CampaignSchema } from '@/lib/schemas/campaign';
import { requireParentsAllowDeployment } from '@/lib/deployment-parent-eligibility';
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

    if ('error' in actor) {
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
    const nextStatus: 'ASSIGNED' = 'ASSIGNED';

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
          'DEPLOYMENT_REMOVED: Removed Deployments cannot be assigned.'
        );
      }

      if (existingDeployment.status !== 'NOT_ASSIGNED') {
        throw new Error(
          'INVALID_DEPLOYMENT_TRANSITION: Only NOT_ASSIGNED Deployments can be assigned.'
        );
      }

      const activationRef = db
        .collection('activations')
        .doc(existingDeployment.activationId);

      const activationSnapshot = await transaction.get(activationRef);

      if (activationSnapshot.exists === false) {
        throw new Error(
          'ACTIVATION_NOT_FOUND: Deployment references an Activation that does not exist.'
        );
      }

      const rawActivation = activationSnapshot.data();

      if (rawActivation === undefined) {
        throw new Error(
          'ACTIVATION_NOT_FOUND: Deployment references an unreadable Activation.'
        );
      }

      const activation = ActivationSchema.parse(rawActivation);

      if (
        activation.activationId !== existingDeployment.activationId ||
        activation.campaignId !== existingDeployment.campaignId ||
        activation.retailerId !== authorizedRetailerId
      ) {
        throw new Error(
          'DEPLOYMENT_ACTIVATION_INTEGRITY_ERROR: Activation does not match the Deployment relationship chain.'
        );
      }

      const campaignRef = db
        .collection('campaigns')
        .doc(existingDeployment.campaignId);

      const campaignSnapshot = await transaction.get(campaignRef);

      if (campaignSnapshot.exists === false) {
        throw new Error(
          'CAMPAIGN_NOT_FOUND: Deployment references a Campaign that does not exist.'
        );
      }

      const rawCampaign = campaignSnapshot.data();

      if (rawCampaign === undefined) {
        throw new Error(
          'CAMPAIGN_NOT_FOUND: Deployment references an unreadable Campaign.'
        );
      }

      const campaign = CampaignSchema.parse(rawCampaign);

      if (
        campaign.campaignId !== existingDeployment.campaignId ||
        campaign.retailerId !== authorizedRetailerId ||
        activation.campaignId !== campaign.campaignId
      ) {
        throw new Error(
          'DEPLOYMENT_CAMPAIGN_INTEGRITY_ERROR: Campaign does not match the Deployment relationship chain.'
        );
      }

      const now = admin.firestore.Timestamp.now();

      requireParentsAllowDeployment(
        campaign,
        activation,
        now
      );

      const candidateDeployment = {
        ...existingDeployment,
        status: nextStatus,
        assignedAt: now,
        assignedBy: actor.uid,
        updatedAt: now,
        updatedBy: actor.uid,
      };

      DeploymentSchema.parse(candidateDeployment);

      transaction.update(deploymentRef, {
        status: candidateDeployment.status,
        assignedAt: candidateDeployment.assignedAt,
        assignedBy: candidateDeployment.assignedBy,
        updatedAt: candidateDeployment.updatedAt,
        updatedBy: candidateDeployment.updatedBy,
      });
    });

    return {
      success: true,
      deploymentId: data.deploymentId,
      status: nextStatus,
    };
  }
);
