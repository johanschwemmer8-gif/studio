'use server';

import { getDb } from '@/lib/firebase-admin';
import { ShopperSessionSchema } from '@/lib/schemas/shopper-session';
import { collectProductEvidence } from '@/lib/product-evidence-orchestrator';
import { createProductionProductEvidenceProviders } from '@/lib/product-evidence-providers/production-product-evidence';

export type ExploreProductFact = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  verificationState: 'VERIFIED' | 'SUPPORTED';
};

export type ExploreProductResult =
  | {
      success: true;
      product: {
        gtin: string;
        productName?: string;
        brandName?: string;
      };
      facts: ExploreProductFact[];
      evidenceState: 'SUFFICIENT' | 'LIMITED' | 'INSUFFICIENT';
      limitations: string[];
    }
  | {
      success: false;
      code:
        | 'SESSION_UNAVAILABLE'
        | 'SESSION_INTEGRITY_ERROR'
        | 'PRIMARY_PRODUCT_UNAVAILABLE'
        | 'EVIDENCE_UNAVAILABLE';
      message: string;
    };

export async function getExploreProductEvidence(input: {
  sessionId: string;
}): Promise<ExploreProductResult> {
  try {
    const sessionId = input.sessionId?.trim();

    if (!sessionId) {
      return {
        success: false,
        code: 'SESSION_UNAVAILABLE',
        message: 'The current shopper session is unavailable.',
      };
    }

    const db = getDb();

    if (!db) {
      return {
        success: false,
        code: 'SESSION_UNAVAILABLE',
        message: 'The current shopper session is unavailable.',
      };
    }

    const snapshot = await db
      .collection('sessions')
      .doc(sessionId)
      .get();

    if (!snapshot.exists) {
      return {
        success: false,
        code: 'SESSION_UNAVAILABLE',
        message: 'The current shopper session could not be found.',
      };
    }

    const parsed = ShopperSessionSchema.safeParse(snapshot.data());

    if (
      !parsed.success ||
      parsed.data.sessionId !== sessionId ||
      parsed.data.environment !== 'PRODUCTION'
    ) {
      return {
        success: false,
        code: 'SESSION_INTEGRITY_ERROR',
        message: 'The current shopper session could not be validated.',
      };
    }

    const session = parsed.data;
    const gtin = session.entryGtin?.trim();

    if (!gtin) {
      return {
        success: false,
        code: 'PRIMARY_PRODUCT_UNAVAILABLE',
        message: 'The current product could not be identified reliably.',
      };
    }

    const providers = createProductionProductEvidenceProviders();

    const result = await collectProductEvidence(
      { gtin },
      { retailerId: session.retailerId },
      providers,
    );

    const evidence = result.evidence;

    const facts: ExploreProductFact[] = evidence.facts
      .filter(
        (fact) =>
          !fact.hasConflict &&
          (fact.verificationState === 'VERIFIED' ||
            fact.verificationState === 'SUPPORTED'),
      )
      .map((fact) => {
        const verificationState: ExploreProductFact['verificationState'] =
          fact.verificationState === 'VERIFIED'
            ? 'VERIFIED'
            : 'SUPPORTED';

        return {
          key: fact.key,
          label: fact.label,
          value: fact.value,
          ...(fact.unit ? { unit: fact.unit } : {}),
          verificationState,
        };
      });

    return {
      success: true,
      product: {
        gtin: evidence.identity.gtin,
        ...(evidence.identity.productName
          ? { productName: evidence.identity.productName }
          : {}),
        ...(evidence.identity.brandName
          ? { brandName: evidence.identity.brandName }
          : {}),
      },
      facts,
      evidenceState: evidence.evidenceState,
      limitations: evidence.limitations,
    };
  } catch {
    return {
      success: false,
      code: 'EVIDENCE_UNAVAILABLE',
      message:
        'Ari could not retrieve the available product information right now.',
    };
  }
}
