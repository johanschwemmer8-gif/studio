import { getQrResolutionShopperMessage } from './qr-resolution-shopper-message';

describe('QR resolution shopper-safe messaging', () => {
  test.each([
    'CAMPAIGN_NOT_ACTIVE',
    'CAMPAIGN_NOT_STARTED',
    'ACTIVATION_NOT_STARTED',
  ])('%s maps to not-yet-available messaging', (code) => {
    expect(getQrResolutionShopperMessage(code).title).toBe(
      "This experience isn't available yet"
    );
  });

  test.each([
    'CAMPAIGN_PAUSED',
    'ACTIVATION_UNAVAILABLE',
  ])('%s maps to temporarily-unavailable messaging', (code) => {
    expect(getQrResolutionShopperMessage(code).title).toBe(
      'This experience is temporarily unavailable'
    );
  });

  test.each([
    'CAMPAIGN_ENDED',
    'CAMPAIGN_ARCHIVED',
    'ACTIVATION_ENDED',
    'QR_RETIRED',
    'DEPLOYMENT_REMOVED',
  ])('%s maps to no-longer-available messaging', (code) => {
    expect(getQrResolutionShopperMessage(code).title).toBe(
      'This experience is no longer available'
    );
  });

  test.each([
    undefined,
    'QR_NOT_FOUND',
    'QR_INTEGRITY_ERROR',
    'DEPLOYMENT_INTEGRITY_ERROR',
    'ACTIVATION_INTEGRITY_ERROR',
    'CAMPAIGN_INTEGRITY_ERROR',
    'INFRASTRUCTURE_UNAVAILABLE',
    'QR_RESOLUTION_FAILED',
    'SOMETHING_UNKNOWN',
  ])('%s maps to generic safe messaging', (code) => {
    expect(getQrResolutionShopperMessage(code).title).toBe(
      "We couldn't open this experience"
    );
  });

  test('does not expose the internal resolver code in shopper copy', () => {
    const code = 'DEPLOYMENT_INTEGRITY_ERROR';
    const message = getQrResolutionShopperMessage(code);

    expect(message.title).not.toContain(code);
    expect(message.description).not.toContain(code);
  });
});
