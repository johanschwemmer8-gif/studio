import { buildQrPresentationOptions, type QrPresentationDefaults } from './qr-presentation-renderer';

const defaults: QrPresentationDefaults = {
  colorHex: '#112233',
  bgColorHex: '#FFFFFF',
  errorCorrection: 'M',
  moduleStyle: 'square',
  gradient: { enabled: false, from: '#112233', to: '#445566', angle: 0 },
  eyeStyle: 'square',
  eyeColors: { outer: '#111111', inner: '#222222' },
  logoPath: 'https://example.com/logo.png',
  logoSizeRatio: 0.2,
  backgroundLogo: {
    enabled: false,
    logoPath: 'https://example.com/logo.png',
    opacity: 0.2,
  },
  quietZone: 4,
};

describe('QR presentation renderer adapter', () => {
  it('maps the canonical presentation contract without changing encoded data', () => {
    const result = buildQrPresentationOptions('https://example.com/resolve/qr-1', defaults);

    expect(result.data).toBe('https://example.com/resolve/qr-1');
    expect(result.type).toBe('svg');
    expect(result.dotsOptions).toEqual({ type: 'square', color: '#112233' });
    expect(result.backgroundOptions.color).toBe('#FFFFFF');
    expect(result.qrOptions.errorCorrectionLevel).toBe('M');
    expect(result.margin).toBe(14);
    expect(result.image).toBe('https://example.com/logo.png');
    expect(result.imageOptions.imageSize).toBe(0.2);
  });

  it.each([
    'square',
    'rounded',
    'dots',
    'classy',
    'classy-rounded',
    'extra-rounded',
  ] as const)('preserves canonical module style %s', (moduleStyle) => {
    expect(
      buildQrPresentationOptions('preview', { ...defaults, moduleStyle }).dotsOptions.type,
    ).toBe(moduleStyle);
  });

  it('maps rounded eye semantics behind the adapter boundary', () => {
    const result = buildQrPresentationOptions('preview', {
      ...defaults,
      eyeStyle: 'rounded',
    });

    expect(result.cornersSquareOptions.type).toBe('extra-rounded');
    expect(result.cornersDotOptions.type).toBe('dot');
  });

  it('maps leaf eye semantics behind the adapter boundary', () => {
    const result = buildQrPresentationOptions('preview', {
      ...defaults,
      eyeStyle: 'leaf',
    });

    expect(result.cornersSquareOptions.type).toBe('classy');
    expect(result.cornersDotOptions.type).toBe('classy');
  });

  it('converts canonical gradient degrees to renderer radians', () => {
    const result = buildQrPresentationOptions('preview', {
      ...defaults,
      gradient: { enabled: true, from: '#123456', to: '#ABCDEF', angle: 180 },
    });

    expect(result.dotsOptions.color).toBeUndefined();
    expect(result.dotsOptions.gradient).toEqual({
      type: 'linear',
      rotation: Math.PI,
      colorStops: [
        { offset: 0, color: '#123456' },
        { offset: 1, color: '#ABCDEF' },
      ],
    });
  });

  it('keeps the QR renderer background opaque when a background logo is enabled', () => {
    const options = buildQrPresentationOptions(
      'https://example.com',
      { ...defaults,
        backgroundLogo: {
          enabled: true,
          logoPath: 'https://example.com/logo.png',
          opacity: 0.2,
        },
      },
    );

    expect(options.backgroundOptions).toEqual({ color: '#FFFFFF' });
  });

  it('keeps the configured background colour without a background logo asset', () => {
    const options = buildQrPresentationOptions(
      'https://example.com',
      { ...defaults, bgColorHex: '#F0F0F0' },
    );

    expect(options.backgroundOptions).toEqual({ color: '#F0F0F0' });
  });

  it('converts the canonical four-module quiet zone to a safe pixel margin', () => {
    const options = buildQrPresentationOptions(
      'https://example.com',
      { ...defaults, quietZone: 4 },
      360,
    );

    expect(options.margin).toBe(14);
  });

  it('scales larger canonical quiet zones proportionally', () => {
    const options = buildQrPresentationOptions(
      'https://example.com',
      { ...defaults, quietZone: 8 },
      360,
    );

    expect(options.margin).toBe(29);
  });


  it('rejects empty encoded data', () => {
    expect(() => buildQrPresentationOptions('   ', defaults)).toThrow(
      'QR presentation data is required.',
    );
  });
});
