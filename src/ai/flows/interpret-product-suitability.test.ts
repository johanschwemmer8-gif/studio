import {
  interpretProductSuitability,
  type ProductSuitabilityGenerator,
} from '@/ai/flows/interpret-product-suitability';
import type { ProductSuitabilityAssessment } from '@/lib/product-suitability';

function assessment(
  overrides: Partial<ProductSuitabilityAssessment> = {},
): ProductSuitabilityAssessment {
  return {
    product: {
      gtin: '06001234567890',
      productName: 'Test Product',
    },
    requirement: {
      text: 'I need something waterproof',
      sensitivity: 'STANDARD',
    },
    outcome: 'INSUFFICIENT_EVIDENCE',
    supportingFacts: [
      {
        key: 'waterproof',
        label: 'Waterproof',
        value: 'Yes',
        source: {
          sourceType: 'MANUFACTURER',
          sourceName: 'Manufacturer',
          retrievedAt: '2026-09-26T10:00:00.000Z',
          identityMatched: true,
        },
        verificationState: 'SUPPORTED',
        hasConflict: false,
      },
    ],
    limitations: [],
    requiresProfessionalAdvice: false,
    ...overrides,
  };
}

describe('interpretProductSuitability', () => {
  it('accepts a grounded supported interpretation', async () => {
    const generator: ProductSuitabilityGenerator =
      jest.fn().mockResolvedValue({
        outcome: 'SUPPORTED',
        supportingFactKeys: ['waterproof'],
        explanation:
          'The available product information states that this product is waterproof.',
      });

    const result = await interpretProductSuitability(
      assessment(),
      generator,
    );

    expect(result.outcome).toBe('SUPPORTED');
    expect(result.supportingFactKeys).toEqual([
      'waterproof',
    ]);
  });

  it('accepts a grounded not-supported interpretation', async () => {
    const generator: ProductSuitabilityGenerator =
      jest.fn().mockResolvedValue({
        outcome: 'NOT_SUPPORTED',
        supportingFactKeys: ['waterproof'],
        explanation:
          'The available product information shows that the stated requirement is not met.',
      });

    const result = await interpretProductSuitability(
      assessment(),
      generator,
    );

    expect(result.outcome).toBe('NOT_SUPPORTED');
  });

  it('rejects an invented supporting fact', async () => {
    const generator: ProductSuitabilityGenerator =
      jest.fn().mockResolvedValue({
        outcome: 'SUPPORTED',
        supportingFactKeys: ['invented_fact'],
        explanation: 'This product is suitable.',
      });

    const result = await interpretProductSuitability(
      assessment(),
      generator,
    );

    expect(result.outcome).toBe(
      'INSUFFICIENT_EVIDENCE',
    );
    expect(result.supportingFactKeys).toEqual([]);
  });

  it('fails closed when generation fails', async () => {
    const generator: ProductSuitabilityGenerator =
      jest.fn().mockRejectedValue(
        new Error('Gemini unavailable'),
      );

    const result = await interpretProductSuitability(
      assessment(),
      generator,
    );

    expect(result.outcome).toBe(
      'INSUFFICIENT_EVIDENCE',
    );
  });

  it('does not call the model when there are no admissible facts', async () => {
    const generator: ProductSuitabilityGenerator =
      jest.fn();

    const result = await interpretProductSuitability(
      assessment({
        supportingFacts: [],
      }),
      generator,
    );

    expect(generator).not.toHaveBeenCalled();
    expect(result.outcome).toBe(
      'INSUFFICIENT_EVIDENCE',
    );
  });

  it('cannot turn medical evidence into personal medical suitability clearance', async () => {
    const generator: ProductSuitabilityGenerator =
      jest.fn().mockResolvedValue({
        outcome: 'SUPPORTED',
        supportingFactKeys: ['waterproof'],
        explanation:
          'The supplied product information contains a relevant supported fact.',
      });

    const result = await interpretProductSuitability(
      assessment({
        requirement: {
          text: 'Is this suitable for my medical condition?',
          sensitivity: 'MEDICAL',
        },
        requiresProfessionalAdvice: true,
      }),
      generator,
    );

    expect(result.outcome).toBe(
      'INSUFFICIENT_EVIDENCE',
    );
    expect(result.requiresProfessionalAdvice).toBe(
      true,
    );
  });
});
