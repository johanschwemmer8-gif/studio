'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import {
  ResolveDeploymentProblemInputSchema,
  type ResolveDeploymentProblemInput,
} from '@/lib/schemas/deployment-command';

const ResolveDeploymentProblemOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
  status: z.enum([
    'NOT_ASSIGNED',
    'ASSIGNED',
    'READY_TO_PRINT',
    'PRINTED',
    'DEPLOYED',
  ]),
});

export type ResolveDeploymentProblemOutput = z.infer<
  typeof ResolveDeploymentProblemOutputSchema
>;

export async function resolveDeploymentProblem(
  input: ResolveDeploymentProblemInput
): Promise<ResolveDeploymentProblemOutput> {
  return resolveDeploymentProblemFlow(input);
}

const resolveDeploymentProblemFlow = ai.defineFlow(
  {
    name: 'resolveDeploymentProblemFlow',
    inputSchema: ResolveDeploymentProblemInputSchema,
    outputSchema: ResolveDeploymentProblemOutputSchema,
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

    requireCapability(actor.role, 'DEPLOYMENT_RESOLVE_PROBLEM');

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
        'DEPLOYMENT_REMOVED: Removed Deployments cannot resolve problems.'
      );
    }

    if (existingDeployment.status !== 'PROBLEM_REPORTED') {
      throw new Error(
        'INVALID_DEPLOYMENT_TRANSITION: Only PROBLEM_REPORTED Deployments can be resolved.'
      );
    }

    const previousStatus = existingDeployment.problemPreviousStatus;

    if (previousStatus === undefined) {
      throw new Error(
        'DEPLOYMENT_DATA_INTEGRITY_ERROR: Problem state is missing problemPreviousStatus.'
      );
    }

    const qrDependentStatuses = [
      'READY_TO_PRINT',
      'PRINTED',
      'DEPLOYED',
    ] as const;

    if (
      qrDependentStatuses.includes(
        previousStatus as (typeof qrDependentStatuses)[number]
      ) &&
      existingDeployment.qrCodeId === undefined
    ) {
      throw new Error(
        'DEPLOYMENT_DATA_INTEGRITY_ERROR: Cannot restore a QR-dependent Deployment state without qrCodeId.'
      );
    }

    const now = admin.firestore.Timestamp.now();

    const candidateDeployment = {
      ...existingDeployment,
      status: previousStatus,
      problemResolvedAt: now,
      problemResolvedBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    DeploymentSchema.parse(candidateDeployment);

    await deploymentRef.update({
      status: candidateDeployment.status,
      problemResolvedAt: candidateDeployment.problemResolvedAt,
      problemResolvedBy: candidateDeployment.problemResolvedBy,
      updatedAt: candidateDeployment.updatedAt,
      updatedBy: candidateDeployment.updatedBy,
    });

    return {
      success: true,
      deploymentId: data.deploymentId,
      status: previousStatus,
    };
  }
);
