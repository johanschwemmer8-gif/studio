import { z } from "zod";

/**
 * Command contract for binding a stable production QR identity
 * to an existing Deployment.
 *
 * Business relationships such as campaignId, activationId,
 * configurationVersion, and qrCodeId are deliberately not accepted
 * from the client. They are resolved or generated server-side.
 */
export const BindQrToDeploymentInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  deploymentId: z.string().min(1),
});

export type BindQrToDeploymentInput = z.infer<
  typeof BindQrToDeploymentInputSchema
>;

/**
 * Command contract for reprinting an existing canonical QR identity.
 *
 * qrCodeId is the only QR relationship identifier accepted from the client.
 * Campaign, Activation, Deployment, configuration, and tracking identity
 * are resolved and validated server-side from the canonical QR record.
 */
export const ReprintQrCodeInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
  qrCodeId: z.string().min(1),
});

export type ReprintQrCodeInput = z.infer<
  typeof ReprintQrCodeInputSchema
>;
