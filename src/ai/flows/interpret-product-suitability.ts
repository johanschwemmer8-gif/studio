'use server';

import { z } from 'zod';

import type { ProductSuitabilityAssessment } from '@/lib/product-suitability';
import {
  validateProductSuitabilityInterpretation,
  type ProductSuitabilityInterpretation,
  type ProductSuitabilityInterpretationProposal,
} from '@/lib/product-suitability-interpretation';

const ProductSuitabilityProposalSchema = z.object({
  outcome: z.enum([
    'SUPPORTED',
    'NOT_SUPPORTED',
    'INSUFFICIENT_EVIDENCE',
  ]),
  supportingFactKeys: z.array(z.string()),
  explanation: z.string().min(1),
});

export type ProductSuitabilityGenerator = (
  assessment: ProductSuitabilityAssessment,
) => Promise<ProductSuitabilityInterpretationProposal>;

function fallback(
  assessment: ProductSuitabilityAssessment,
): ProductSuitabilityInterpretation {
  return validateProductSuitabilityInterpretation(
    assessment,
    {
      outcome: 'INSUFFICIENT_EVIDENCE',
      supportingFactKeys: [],
      explanation:
        'The available product information is not sufficient to determine this reliably.',
    },
  );
}

export async function generateProductSuitabilityProposal(
  assessment: ProductSuitabilityAssessment,
): Promise<ProductSuitabilityInterpretationProposal> {
  // Lazy-load Genkit so deterministic Suitability tests and fallback paths
  // do not initialize the Genkit/dotprompt/YAML runtime.
  const { ai } = await import('@/ai/genkit');

  const facts = assessment.supportingFacts.map((fact) => ({
    key: fact.key,
    label: fact.label,
    value: fact.value,
    unit: fact.unit,
    verificationState: fact.verificationState,
  }));

  const systemPrompt = `
You are Ari, an evidence-bounded retail product assistant.

Your task is to evaluate ONE explicit shopper requirement against ONLY the
product facts supplied to you.

STRICT RULES:
1. Use only the supplied product facts.
2. Never invent, assume, infer, retrieve, or add product facts.
3. supportingFactKeys may contain only keys from the supplied facts.
4. SUPPORTED means the supplied facts positively support the shopper's stated requirement.
5. NOT_SUPPORTED means the supplied facts positively show that the stated requirement is not met.
6. Missing information is NOT evidence against the product.
7. If the supplied facts cannot establish the answer, return INSUFFICIENT_EVIDENCE.
8. Do not diagnose medical conditions, prescribe treatment, or declare a product personally medically safe.
9. Do not declare individualized safety for safety-critical use.
10. Keep the explanation concise, factual, and shopper-friendly.
`.trim();

  const shopperPrompt = JSON.stringify({
    product: assessment.product,
    shopperRequirement: assessment.requirement.text,
    sensitivity: assessment.requirement.sensitivity,
    admissibleProductFacts: facts,
    limitations: assessment.limitations,
  });

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: [{ text: systemPrompt }],
      },
      {
        role: 'user',
        content: [{ text: shopperPrompt }],
      },
    ],
    output: {
      schema: ProductSuitabilityProposalSchema,
    },
  });

  if (!output) {
    throw new Error('Empty suitability interpretation response.');
  }

  return output;
}

export async function interpretProductSuitability(
  assessment: ProductSuitabilityAssessment,
  generator: ProductSuitabilityGenerator =
    generateProductSuitabilityProposal,
): Promise<ProductSuitabilityInterpretation> {
  if (
    assessment.supportingFacts.length === 0 ||
    assessment.outcome !== 'INSUFFICIENT_EVIDENCE'
  ) {
    return fallback(assessment);
  }

  try {
    const proposal = await generator(assessment);

    return validateProductSuitabilityInterpretation(
      assessment,
      proposal,
    );
  } catch {
    return fallback(assessment);
  }
}
