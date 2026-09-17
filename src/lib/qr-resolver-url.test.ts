import { buildProductionQrTrackingUrl } from './qr-resolver-url';

describe('buildProductionQrTrackingUrl', () => {
  test('builds the canonical production tracking URL', () => {
    expect(
      buildProductionQrTrackingUrl(
        'https://studio-1--interact-aoe-kidkn.us-east4.hosted.app',
        'qr-123'
      )
    ).toBe(
      'https://studio-1--interact-aoe-kidkn.us-east4.hosted.app/resolve/qr-123'
    );
  });

  test('normalizes a trailing slash', () => {
    expect(
      buildProductionQrTrackingUrl(
        'https://example.com/',
        'qr-123'
      )
    ).toBe('https://example.com/resolve/qr-123');
  });

  test('rejects missing configuration', () => {
    expect(() =>
      buildProductionQrTrackingUrl(undefined, 'qr-123')
    ).toThrow('QR_RESOLVER_BASE_URL is required');
  });

  test('rejects localhost', () => {
    expect(() =>
      buildProductionQrTrackingUrl('http://localhost:9002', 'qr-123')
    ).toThrow();
  });

  test('rejects loopback IP', () => {
    expect(() =>
      buildProductionQrTrackingUrl('http://127.0.0.1:9002', 'qr-123')
    ).toThrow();
  });

  test('rejects a public non-HTTPS URL', () => {
    expect(() =>
      buildProductionQrTrackingUrl('http://example.com', 'qr-123')
    ).toThrow('must use HTTPS');
  });

  test('rejects malformed configuration', () => {
    expect(() =>
      buildProductionQrTrackingUrl('not-a-url', 'qr-123')
    ).toThrow('must be a valid URL');
  });

  test('rejects a configured path', () => {
    expect(() =>
      buildProductionQrTrackingUrl(
        'https://example.com/something',
        'qr-123'
      )
    ).toThrow('must be an origin');
  });

  test('rejects an empty QR identity', () => {
    expect(() =>
      buildProductionQrTrackingUrl('https://example.com', '')
    ).toThrow('qrCodeId is required');
  });
});
