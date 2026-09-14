import { admin, db } from '@/lib/firebase-admin';
import { ActivationSchema, type Activation } from '@/lib/schemas/activation';
import { CampaignSchema, type Campaign } from '@/lib/schemas/campaign';
import { DeploymentSchema, type Deployment } from '@/lib/schemas/deployment';
import { QrCodeSchema, type QrCode } from '@/lib/schemas/qr-code';

export type ResolvedProductionQr = {
  qr: QrCode;
  deployment: Deployment;
  activation: Activation;
  campaign: Campaign;
};

function timestampToMillis(timestamp: {
  seconds: number;
  nanoseconds: number;
}): number {
  return (
    timestamp.seconds * 1000 +
    Math.floor(timestamp.nanoseconds / 1_000_000)
  );
}

/**
 * Resolve and validate a production QR identity against the canonical
 * Retailer -> Campaign -> Activation -> Deployment -> QR relationship chain.
 *
 * This helper is intentionally read-only.
 */
export async function resolveProductionQr(
  qrCodeId: string
): Promise<ResolvedProductionQr> {
  if (db == null) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const qrSnapshot = await db.collection('qrcodes').doc(qrCodeId).get();

  if (!qrSnapshot.exists) {
    throw new Error('QR_NOT_FOUND');
  }

  const qr = QrCodeSchema.parse(qrSnapshot.data());

  if (qr.qrCodeId !== qrCodeId) {
    throw new Error('QR_INTEGRITY_ERROR');
  }

  if (qr.environment !== 'PRODUCTION') {
    throw new Error('UNSUPPORTED_QR_ENVIRONMENT');
  }

  if (qr.status === 'RETIRED') {
    throw new Error('QR_RETIRED');
  }

  const deploymentSnapshot = await db
    .collection('deployments')
    .doc(qr.deploymentId)
    .get();

  if (!deploymentSnapshot.exists) {
    throw new Error('DEPLOYMENT_NOT_FOUND');
  }

  const deployment = DeploymentSchema.parse(deploymentSnapshot.data());

  if (
    deployment.deploymentId !== qr.deploymentId ||
    deployment.retailerId !== qr.retailerId ||
    deployment.activationId !== qr.activationId ||
    deployment.campaignId !== qr.campaignId ||
    deployment.qrCodeId !== qr.qrCodeId
  ) {
    throw new Error('DEPLOYMENT_INTEGRITY_ERROR');
  }

  if (deployment.removedAt !== undefined) {
    throw new Error('DEPLOYMENT_REMOVED');
  }

  if (deployment.status !== 'DEPLOYED') {
    throw new Error('DEPLOYMENT_UNAVAILABLE');
  }

  const activationSnapshot = await db
    .collection('activations')
    .doc(qr.activationId)
    .get();

  if (!activationSnapshot.exists) {
    throw new Error('ACTIVATION_NOT_FOUND');
  }

  const activation = ActivationSchema.parse(activationSnapshot.data());

  if (
    activation.activationId !== qr.activationId ||
    activation.retailerId !== qr.retailerId ||
    activation.campaignId !== qr.campaignId
  ) {
    throw new Error('ACTIVATION_INTEGRITY_ERROR');
  }

  const nowMillis = admin.firestore.Timestamp.now().toMillis();

  if (
    activation.status === 'DRAFT' ||
    activation.status === 'PENDING_APPROVAL' ||
    activation.status === 'PAUSED' ||
    activation.status === 'ENDED' ||
    activation.status === 'ARCHIVED'
  ) {
    throw new Error('ACTIVATION_UNAVAILABLE');
  }

  if (
    activation.startAt !== undefined &&
    timestampToMillis(activation.startAt) > nowMillis
  ) {
    throw new Error('ACTIVATION_NOT_STARTED');
  }

  if (
    activation.endAt !== undefined &&
    timestampToMillis(activation.endAt) < nowMillis
  ) {
    throw new Error('ACTIVATION_ENDED');
  }

  if (
    activation.status === 'SCHEDULED' &&
    (
      activation.startAt === undefined ||
      timestampToMillis(activation.startAt) > nowMillis
    )
  ) {
    throw new Error('ACTIVATION_NOT_STARTED');
  }

  if (
    activation.status !== 'ACTIVE' &&
    activation.status !== 'SCHEDULED'
  ) {
    throw new Error('ACTIVATION_UNAVAILABLE');
  }

  const campaignSnapshot = await db
    .collection('campaigns')
    .doc(qr.campaignId)
    .get();

  if (!campaignSnapshot.exists) {
    throw new Error('CAMPAIGN_NOT_FOUND');
  }

  const campaign = CampaignSchema.parse(campaignSnapshot.data());

  if (
    campaign.campaignId !== qr.campaignId ||
    campaign.retailerId !== qr.retailerId
  ) {
    throw new Error('CAMPAIGN_INTEGRITY_ERROR');
  }

  if (campaign.status === 'ARCHIVED') {
    throw new Error('CAMPAIGN_ARCHIVED');
  }

  if (
    campaign.startAt !== undefined &&
    timestampToMillis(campaign.startAt) > nowMillis
  ) {
    throw new Error('CAMPAIGN_NOT_STARTED');
  }

  if (
    campaign.endAt !== undefined &&
    timestampToMillis(campaign.endAt) < nowMillis
  ) {
    throw new Error('CAMPAIGN_ENDED');
  }

  return {
    qr,
    deployment,
    activation,
    campaign,
  };
}
