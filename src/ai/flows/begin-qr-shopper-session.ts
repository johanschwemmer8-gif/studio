"use server";

import { randomUUID } from "node:crypto";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { admin, db } from "@/lib/firebase-admin";
import { resolveProductionQr } from "@/lib/qr-resolution";
import { ShopperSessionSchema } from "@/lib/schemas/shopper-session";
import {
  BeginQrShopperSessionInputSchema,
  type BeginQrShopperSessionInput,
} from "@/lib/schemas/shopper-session-command";

const BeginQrShopperSessionOutputSchema = z.object({
  sessionId: z.string(),
  qrCodeId: z.string(),
  retailerId: z.string(),
  campaignId: z.string(),
  activationId: z.string(),
  deploymentId: z.string(),
  configurationVersion: z.number().int().positive(),
  environment: z.enum(["PRODUCTION", "TEST", "DEMO"]),
});

export type BeginQrShopperSessionOutput = z.infer<
  typeof BeginQrShopperSessionOutputSchema
>;

function resolveUnambiguousEntryGtin(
  activation: Awaited<ReturnType<typeof resolveProductionQr>>["activation"]
): string | undefined {
  const gtins = new Set<string>();

  if (
    activation.target.level === "PRODUCT" &&
    activation.target.productGtin
  ) {
    gtins.add(activation.target.productGtin);
  }

  for (const product of activation.productContext) {
    if (product.gtin) {
      gtins.add(product.gtin);
    }
  }

  return gtins.size === 1 ? Array.from(gtins)[0] : undefined;
}

export async function beginQrShopperSession(
  input: BeginQrShopperSessionInput
): Promise<BeginQrShopperSessionOutput> {
  return beginQrShopperSessionFlow(input);
}

const beginQrShopperSessionFlow = ai.defineFlow(
  {
    name: "beginQrShopperSessionFlow",
    inputSchema: BeginQrShopperSessionInputSchema,
    outputSchema: BeginQrShopperSessionOutputSchema,
  },
  async (data) => {
    if (db == null) {
      throw new Error("INFRASTRUCTURE_UNAVAILABLE");
    }

    const { qr, activation } = await resolveProductionQr(data.qrCodeId);
    const now = admin.firestore.Timestamp.now();

    if (data.sessionId) {
      const sessionRef = db.collection("sessions").doc(data.sessionId);

      const existingSession = await db.runTransaction(async (transaction) => {
        const sessionSnapshot = await transaction.get(sessionRef);

        if (!sessionSnapshot.exists) {
          throw new Error("SESSION_NOT_FOUND");
        }

        const session = ShopperSessionSchema.parse(sessionSnapshot.data());

        if (
          session.sessionId !== data.sessionId ||
          session.qrCodeId !== qr.qrCodeId ||
          session.retailerId !== qr.retailerId ||
          session.campaignId !== qr.campaignId ||
          session.activationId !== qr.activationId ||
          session.deploymentId !== qr.deploymentId ||
          session.environment !== qr.environment
        ) {
          throw new Error("SESSION_INTEGRITY_ERROR");
        }

        transaction.update(sessionRef, {
          lastInteractionAt: now,
        });

        return session;
      });

      return {
        sessionId: existingSession.sessionId,
        qrCodeId: existingSession.qrCodeId,
        retailerId: existingSession.retailerId,
        campaignId: existingSession.campaignId,
        activationId: existingSession.activationId,
        deploymentId: existingSession.deploymentId,
        configurationVersion: existingSession.configurationVersion,
        environment: existingSession.environment,
      };
    }

    const sessionId = `sess_${randomUUID()}`;
    const sessionRef = db.collection("sessions").doc(sessionId);
    const entryGtin = resolveUnambiguousEntryGtin(activation);

    const sessionData = {
      sessionId,
      retailerId: qr.retailerId,
      campaignId: qr.campaignId,
      activationId: qr.activationId,
      deploymentId: qr.deploymentId,
      qrCodeId: qr.qrCodeId,
      configurationVersion: activation.configurationVersion,
      environment: qr.environment,
      startedAt: now,
      lastInteractionAt: now,
      ...(entryGtin ? { entryGtin } : {}),
    };

    ShopperSessionSchema.parse(sessionData);

    await sessionRef.create(sessionData);

    return {
      sessionId,
      qrCodeId: qr.qrCodeId,
      retailerId: qr.retailerId,
      campaignId: qr.campaignId,
      activationId: qr.activationId,
      deploymentId: qr.deploymentId,
      configurationVersion: activation.configurationVersion,
      environment: qr.environment,
    };
  }
);
