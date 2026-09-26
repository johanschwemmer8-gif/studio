import {
  classifyProductSuitabilitySensitivity,
} from '@/lib/product-suitability-sensitivity';

describe('classifyProductSuitabilitySensitivity', () => {
  it('classifies ordinary shopping requirements as standard', () => {
    expect(
      classifyProductSuitabilitySensitivity(
        'I need something waterproof for hiking',
      ),
    ).toBe('STANDARD');
  });

  it('classifies medical requirements as medical', () => {
    expect(
      classifyProductSuitabilitySensitivity(
        'Is this suitable for my medical condition?',
      ),
    ).toBe('MEDICAL');
  });

  it('classifies allergy questions as medical', () => {
    expect(
      classifyProductSuitabilitySensitivity(
        'I have an allergy. Is this suitable for me?',
      ),
    ).toBe('MEDICAL');
  });

  it('classifies safety-critical requirements as safety-sensitive', () => {
    expect(
      classifyProductSuitabilitySensitivity(
        'Is this safe for electrical use?',
      ),
    ).toBe('SAFETY_SENSITIVE');
  });
});
