import { GetScanInteractionOutputSchema } from './scan-interaction';

describe('GetScanInteractionOutputSchema retailer logo', () => {
  const baseResponse = {
    messages: ['Hello! Ari here.'],
    destinationUrl: 'https://interactaoe.co.za',
  };

  it('accepts an absent retailer logo', () => {
    expect(
      GetScanInteractionOutputSchema.safeParse(baseResponse).success
    ).toBe(true);
  });

  it('accepts a valid retailer logo URL', () => {
    expect(
      GetScanInteractionOutputSchema.safeParse({
        ...baseResponse,
        retailerLogoUrl: 'https://example.com/logo.png',
      }).success
    ).toBe(true);
  });

  it('rejects an empty retailer logo URL', () => {
    expect(
      GetScanInteractionOutputSchema.safeParse({
        ...baseResponse,
        retailerLogoUrl: '',
      }).success
    ).toBe(false);
  });
});
