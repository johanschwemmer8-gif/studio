const buildEvidenceMock = jest.fn();
const interpretMock = jest.fn();

jest.mock(
  '@/ai/flows/build-product-suitability-evidence',
  () => ({
    buildProductSuitabilityEvidence: (...args: unknown[]) =>
      buildEvidenceMock(...args),
  }),
);

jest.mock(
  '@/ai/flows/interpret-product-suitability',
  () => ({
    interpretProductSuitability: (...args: unknown[]) =>
      interpretMock(...args),
  }),
);

import {
  assessProductSuitability,
} from '@/ai/flows/assess-product-suitability';

const evidenceAssessment = {
  product: {
    gtin: '06001234567890',
    productName: 'Test Product',
  },
  requirement: {
    text: 'I need something waterproof',
    sensitivity: 'STANDARD' as const,
  },
  outcome: 'INSUFFICIENT_EVIDENCE' as const,
  supportingFacts: [],
  limitations: [],
  requiresProfessionalAdvice: false,
};

describe('assessProductSuitability', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    buildEvidenceMock.mockResolvedValue({
      success: true,
      assessment: evidenceAssessment,
    });

    interpretMock.mockResolvedValue({
      outcome: 'INSUFFICIENT_EVIDENCE',
      supportingFactKeys: [],
      explanation:
        'The available product information is not sufficient to determine this reliably.',
      requiresProfessionalAdvice: false,
    });
  });

  it('trims the requirement and performs the complete suitability pipeline', async () => {
    const result = await assessProductSuitability({
      sessionId: 'session-1',
      requirement: '  I need something waterproof  ',
    });

    expect(buildEvidenceMock).toHaveBeenCalledWith({
      sessionId: 'session-1',
      requirement: {
        text: 'I need something waterproof',
        sensitivity: 'STANDARD',
      },
    });

    expect(interpretMock).toHaveBeenCalledWith(
      evidenceAssessment,
    );

    expect(result).toMatchObject({
      success: true,
      sensitivity: 'STANDARD',
    });
  });

  it('classifies medical requirements on the server', async () => {
    await assessProductSuitability({
      sessionId: 'session-1',
      requirement:
        'Is this suitable for my medical condition?',
    });

    expect(buildEvidenceMock).toHaveBeenCalledWith({
      sessionId: 'session-1',
      requirement: {
        text:
          'Is this suitable for my medical condition?',
        sensitivity: 'MEDICAL',
      },
    });
  });

  it('classifies safety-sensitive requirements on the server', async () => {
    await assessProductSuitability({
      sessionId: 'session-1',
      requirement:
        'Is this safe for electrical use?',
    });

    expect(buildEvidenceMock).toHaveBeenCalledWith({
      sessionId: 'session-1',
      requirement: {
        text: 'Is this safe for electrical use?',
        sensitivity: 'SAFETY_SENSITIVE',
      },
    });
  });

  it('rejects an empty requirement before evidence acquisition', async () => {
    const result = await assessProductSuitability({
      sessionId: 'session-1',
      requirement: '   ',
    });

    expect(result).toEqual({
      success: false,
      code: 'INVALID_REQUIREMENT',
      message:
        'Tell Ari what matters to you for this product.',
    });

    expect(buildEvidenceMock).not.toHaveBeenCalled();
    expect(interpretMock).not.toHaveBeenCalled();
  });

  it('propagates fail-closed evidence failures without interpretation', async () => {
    buildEvidenceMock.mockResolvedValue({
      success: false,
      code: 'SESSION_INTEGRITY_ERROR',
      message:
        'The shopper session could not be validated.',
    });

    const result = await assessProductSuitability({
      sessionId: 'session-1',
      requirement: 'I need something waterproof',
    });

    expect(result).toEqual({
      success: false,
      code: 'SESSION_INTEGRITY_ERROR',
      message:
        'The shopper session could not be validated.',
    });

    expect(interpretMock).not.toHaveBeenCalled();
  });
});
