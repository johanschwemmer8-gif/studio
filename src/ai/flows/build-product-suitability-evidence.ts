'use server';

import { getDb } from "@/lib/firebase-admin";
import { ShopperSessionSchema } from "@/lib/schemas/shopper-session";
import { collectProductEvidence } from "@/lib/product-evidence-orchestrator";
import { createProductionProductEvidenceProviders } from "@/lib/product-evidence-providers/production-product-evidence";
import {
  buildProductSuitabilityEvidenceBoundary,
  type ProductSuitabilityAssessment,
  type ProductSuitabilityRequirement,
} from "@/lib/product-suitability";

export type BuildProductSuitabilityEvidenceInput = {
  sessionId: string;
  requirement: ProductSuitabilityRequirement;
};

export type BuildProductSuitabilityEvidenceResult =
  | {
      success: true;
      assessment: ProductSuitabilityAssessment;
    }
  | {
      success: false;
      code:
        | "SESSION_UNAVAILABLE"
        | "SESSION_INTEGRITY_ERROR"
        | "PRIMARY_PRODUCT_UNAVAILABLE"
        | "INVALID_REQUIREMENT"
        | "EVIDENCE_UNAVAILABLE";
      message: string;
    };

export async function buildProductSuitabilityEvidence(
  input: BuildProductSuitabilityEvidenceInput,
): Promise<BuildProductSuitabilityEvidenceResult> {
  try {
    const sessionId = input.sessionId?.trim();
    const requirementText = input.requirement?.text?.trim();

    if (!sessionId) {
      return {
        success: false,
        code: "SESSION_UNAVAILABLE",
        message: "The current shopper session is unavailable.",
      };
    }

    if (!requirementText) {
      return {
        success: false,
        code: "INVALID_REQUIREMENT",
        message: "Tell Ari what matters to you for this product.",
      };
    }

    const db = getDb();

    if (!db) {
      return {
        success: false,
        code: "SESSION_UNAVAILABLE",
        message: "The current shopper session is unavailable.",
      };
    }

    const snapshot = await db.collection("sessions").doc(sessionId).get();

    if (!snapshot.exists) {
      return {
        success: false,
        code: "SESSION_UNAVAILABLE",
        message: "The current shopper session is unavailable.",
      };
    }

    const parsed = ShopperSessionSchema.safeParse(snapshot.data());

    if (
      !parsed.success ||
      parsed.data.sessionId !== sessionId ||
      parsed.data.environment !== "PRODUCTION"
    ) {
      return {
        success: false,
        code: "SESSION_INTEGRITY_ERROR",
        message: "The shopper session could not be validated.",
      };
    }

    const session = parsed.data;
    const gtin = session.entryGtin?.trim();

    if (!gtin) {
      return {
        success: false,
        code: "PRIMARY_PRODUCT_UNAVAILABLE",
        message: "The current product could not be identified reliably.",
      };
    }

    const providers = createProductionProductEvidenceProviders();

    const result = await collectProductEvidence(
      { gtin },
      { retailerId: session.retailerId },
      providers,
    );

    const assessment = buildProductSuitabilityEvidenceBoundary(
      result.evidence,
      {
        text: requirementText,
        sensitivity: input.requirement.sensitivity,
      },
    );

    return {
      success: true,
      assessment,
    };
  } catch {
    return {
      success: false,
      code: "EVIDENCE_UNAVAILABLE",
      message:
        "Ari could not check the available product information right now.",
    };
  }
}
