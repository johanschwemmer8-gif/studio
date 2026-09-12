'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import {
  ReportDeploymentProblemInputSchema,
  type ReportDeploymentProblemInput,
} from '@/lib/schemas/deployment-command';

const ReportDeploymentProblemOutputSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string(),
  status: z.literal('PROBLEM_REPORTED'),
});

export type ReportDeploymentProblemOutput = z.infer<
  typeof ReportDeploymentProblemOutputSchema
>;

export async function reportDeploymentProblem(
  input: ReportDeploymentProblemInput
): Promise<ReportDeploymentProblemOutput> {
  return reportDeploymentProblemFlow(input);
}

const reportDeploymentProblemFlow = ai.defineFlow(
  {
    name: 'reportDeploymentProblemFlow',
    inputSchema: ReportDeploymentProblemInputSchema,
    outputSchema: ReportDeploymentProblemOutputSchema,
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

    requireCapability(actor.role, 'DEPLOYMENT_REPORT_PROBLEM');

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
        'DEPLOYMENT_REMOVED: Removed Deployments cannot report problems.'
      );
    }

    if (existingDeployment.status === 'PROBLEM_REPORTED') {
      throw new Error(
        'INVALID_DEPLOYMENT_TRANSITION: Deployment already has an unresolved problem.'
      );
    }

    const now = admin.firestore.Timestamp.now();
    const previousStatus = existingDeployment.status;
    const nextStatus: 'PROBLEM_REPORTED' = 'PROBLEM_REPORTED';

    const {
      problemResolvedAt: _problemResolvedAt,
      problemResolvedBy: _problemResolvedBy,
      ...deploymentWithoutResolution
    } = existingDeployment;

    const candidateDeployment = {
      ...deploymentWithoutResolution,
      status: nextStatus,
      problemPreviousStatus: previousStatus,
      problemReportedAt: now,
      problemReportedBy: actor.uid,
      problemReason: data.problemReason,
      updatedAt: now,
      updatedBy: actor.uid,
    };

    DeploymentSchema.parse(candidateDeployment);

    await deploymentRef.update({
      status: candidateDeployment.status,
      problemPreviousStatus: candidateDeployment.problemPreviousStatus,
      problemReportedAt: candidateDeployment.problemReportedAt,
      problemReportedBy: candidateDeployment.problemReportedBy,
      problemReason: candidateDeployment.problemReason,
      problemResolvedAt: admin.firestore.FieldValue.delete(),
      problemResolvedBy: admin.firestore.FieldValue.delete(),
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
