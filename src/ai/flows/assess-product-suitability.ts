'use server';

import {
  buildProductSuitabilityEvidence,
} from '@/ai/flows/build-product-suitability-evidence';
import {
  interpretProductSuitability,
} from '@/ai/flows/interpret-product-suitability';
import {
  classifyProductSuitabilitySensitivity,
} from '@/lib/product-suitability-sensitivity';
import type {
  ProductSuitabilityInterpretation,
} from '@/lib/product-suitability-interpretation';

export type AssessProductSuitabilityInput = {
  sessionId: string;
  requirement: string;
};

export type AssessProductSuitabilityResult =
  | {
      success: true;
      result: ProductSuitabilityInterpretation;
      sensitivity:
        | 'STANDARD'
        | 'MEDICAL'
        | 'SAFETY_SENSITIVE';
    }
  | {
      success: false;
      code:
        | 'SESSION_UNAVAILABLE'
        | 'SESSION_INTEGRITY_ERROR'
        | 'PRIMARY_PRODUCT_UNAVAILABLE'
        | 'INVALID_REQUIREMENT'
        | 'EVIDENCE_UNAVAILABLE';
      message: string;
    };

export async function assessProductSuitability(
  input: AssessProductSuitabilityInput,
): Promise<AssessProductSuitabilityResult> {
  const requirement = input.requirement?.trim();

  if (!requirement) {
    return {
      success: false,
      code: 'INVALID_REQUIREMENT',
      message:
        'Tell Ari what matters to you for this product.',
    };
  }

  const sensitivity =
    classifyProductSuitabilitySensitivity(requirement);

  const evidenceResult =
    await buildProductSuitabilityEvidence({
      sessionId: input.sessionId,
      requirement: {
        text: requirement,
        sensitivity,
      },
    });

  if (!evidenceResult.success) {
    return evidenceResult;
  }

  const result = await interpretProductSuitability(
    evidenceResult.assessment,
  );

  return {
    success: true,
    result,
    sensitivity,
  };
}
