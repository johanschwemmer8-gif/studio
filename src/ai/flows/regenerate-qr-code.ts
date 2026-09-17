'use server';

/**
 * @fileOverview Canonical QR reprint flow.
 *
 * ARCHITECTURE:
 * - Reprinting preserves QR identity.
 * - The client supplies qrCodeId plus a presentation-only templateId.
 * - Campaign, Activation, Deployment, tenant, and tracking relationships
 *   are resolved and validated server-side.
 * - The existing canonical trackingUrl is rendered locally.
 * - Reprinting does not create or replace QR identity.
 * - Reprinting does not mutate the canonical QR document.
 * - The rendered presentation is a transient operational artifact.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { renderQrPresentationArtifact } from '@/lib/qr-presentation-server-renderer';
import { prepareQrTemplateDefaultsForArtifact } from '@/lib/qr-artifact-branding';

import { admin, db } from '@/lib/firebase-admin';
import { verifyAuth, getAuthorizedRetailerId } from '@/lib/auth-server';
import { requireCapability } from '@/lib/authorization';
import { requireQrStoreResourceAccess } from '@/lib/qr-resource-authorization';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import { QrCodeSchema } from '@/lib/schemas/qr-code';
import { QrTemplateSchema } from '@/lib/schemas/qr-templates';
import {
  ReprintQrCodeInputSchema,
  type ReprintQrCodeInput,
} from '@/lib/schemas/qr-command';

const RegenerateQrCodeOutputSchema = z.object({
  success: z.boolean(),
  qrCodeId: z.string(),
  trackingUrl: z.string().url(),
  qrImageDataUrl: z.string().min(1),
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
    const diagnosticStartedAt = Date.now();

    const diagnosticLog = (
      stage: string,
      details: Record<string, unknown> = {}
    ) => {
      console.log('[QR_REPRINT_DIAGNOSTIC]', {
        stage,
        elapsedMs: Date.now() - diagnosticStartedAt,
        qrCodeId: data.qrCodeId,
        templateId: data.templateId,
        ...details,
      });
    };

    diagnosticLog('START');

    const actor = await verifyAuth(data.idToken);

    diagnosticLog('AUTH_COMPLETE');

    if ('error' in actor) {
      throw new Error(actor.error);
    }

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    diagnosticLog('RETAILER_AUTH_COMPLETE');

    requireCapability(actor.role, 'QR_REPRINT');

    if (db == null) {
      throw new Error('Infrastructure Layer Unavailable.');
    }

    const qrRef = db.collection('qrcodes').doc(data.qrCodeId);

    /*
     * Read and validate the complete canonical QR → Deployment relationship
     * inside a transaction so the rendering context is derived from one
     * consistent database view.
     *
     * The transaction deliberately performs no writes.
     */
    diagnosticLog('CANONICAL_READ_START');

    const renderingContext = await db.runTransaction(
      async (transaction) => {
        const qrSnapshot = await transaction.get(qrRef);

        if (qrSnapshot.exists === false) {
          throw new Error('QR_NOT_FOUND');
        }

        const rawQr = qrSnapshot.data();

        if (rawQr === undefined) {
          throw new Error(
            'QR_INTEGRITY_ERROR: QR identity is unreadable.'
          );
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

        requireQrStoreResourceAccess(actor, deployment.storeId);

        if (deployment.removedAt !== undefined) {
          throw new Error(
            'DEPLOYMENT_REMOVED: QR identities bound to removed Deployments cannot be reprinted.'
          );
        }

        return {
          qrCodeId: qrCode.qrCodeId,
          retailerId: qrCode.retailerId,
          campaignId: qrCode.campaignId,
          activationId: qrCode.activationId,
          deploymentId: qrCode.deploymentId,
          trackingUrl: qrCode.trackingUrl,
        };
      }
    );

    diagnosticLog('CANONICAL_READ_COMPLETE');

    /*
     * Render only after canonical database validation has completed.
     * The QR image is derived from the existing stable trackingUrl and
     * therefore cannot create or replace QR identity.
     */
    diagnosticLog('TEMPLATE_READ_START');

    const templateSnapshot = await db
      .collection('qrTemplates')
      .doc(data.templateId)
      .get();

    diagnosticLog('TEMPLATE_READ_COMPLETE');

    if (templateSnapshot.exists === false) {
      throw new Error('QR_TEMPLATE_NOT_FOUND');
    }

    const rawTemplate = templateSnapshot.data();

    if (rawTemplate === undefined) {
      throw new Error('QR_TEMPLATE_NOT_FOUND');
    }

    const qrTemplate = QrTemplateSchema.parse(rawTemplate);

    if (
      qrTemplate.templateId !== data.templateId ||
      qrTemplate.retailerId !== authorizedRetailerId
    ) {
      throw new Error(
        'ACCESS_DENIED: QR Template does not belong to the authorized retailer.'
      );
    }

    const storageBucket = process.env.QR_TEMPLATE_STORAGE_BUCKET;

    if (!storageBucket) {
      throw new Error(
        'QR_TEMPLATE_STORAGE_BUCKET is required for QR artifact branding.'
      );
    }

    diagnosticLog('BRANDING_PREPARATION_START');

    const artifactDefaults = await prepareQrTemplateDefaultsForArtifact(
      qrTemplate.defaults,
      storageBucket,
      authorizedRetailerId
    );

    diagnosticLog('BRANDING_PREPARATION_COMPLETE', {
      centralLogoEmbedded:
        artifactDefaults.logoPath?.startsWith('data:image/') === true,
      backgroundLogoEnabled:
        artifactDefaults.backgroundLogo.enabled === true,
      backgroundLogoEmbedded:
        artifactDefaults.backgroundLogo.logoPath?.startsWith('data:image/') === true,
    });

    diagnosticLog('RENDER_START');

    const qrImageDataUrl = await renderQrPresentationArtifact(
      renderingContext.trackingUrl,
      artifactDefaults,
      512
    );

    diagnosticLog('RENDER_COMPLETE', {
      artifactLength: qrImageDataUrl.length,
    });

    /*
     * Audit only after rendering succeeds. A failed render must not be
     * recorded as a successful QR reprint.
     */
    const now = admin.firestore.Timestamp.now();

    diagnosticLog('AUDIT_WRITE_START');

    await db.collection('auditLogs').add({
      type: 'QR_REPRINT',
      retailerId: renderingContext.retailerId,
      campaignId: renderingContext.campaignId,
      activationId: renderingContext.activationId,
      deploymentId: renderingContext.deploymentId,
      qrCodeId: renderingContext.qrCodeId,
      actorUid: actor.uid,
      timestamp: now,
    });

    diagnosticLog('AUDIT_WRITE_COMPLETE');
    diagnosticLog('COMPLETE');

    return {
      success: true,
      qrCodeId: renderingContext.qrCodeId,
      trackingUrl: renderingContext.trackingUrl,
      qrImageDataUrl,
      regeneratedAt: now.toDate().toISOString(),
    };
  }
);
