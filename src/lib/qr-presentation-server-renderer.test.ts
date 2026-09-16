/** @jest-environment node */
import {
  composeQrPresentationSvg,
  renderQrPresentationArtifact,
} from './qr-presentation-server-renderer';
import type { QrPresentationDefaults } from './qr-presentation-renderer';

const defaults: QrPresentationDefaults = {
  colorHex: '#111111',
  bgColorHex: '#FFFFFF',
  errorCorrection: 'H',
  moduleStyle: 'rounded',
  gradient: {
    enabled: false,
    from: '#111111',
    to: '#333333',
    angle: 45,
  },
  eyeStyle: 'rounded',
  eyeColors: {
    outer: '#111111',
    inner: '#111111',
  },
  logoSizeRatio: 0.2,
  backgroundLogo: {
    enabled: false,
    opacity: 0.2,
  },
  quietZone: 4,
};

function decodeSvgDataUrl(dataUrl: string): string {
  const prefix = 'data:image/svg+xml;base64,';
  expect(dataUrl.startsWith(prefix)).toBe(true);
  return Buffer.from(dataUrl.slice(prefix.length), 'base64').toString('utf8');
}

describe('QR presentation server artifact renderer', () => {
  it('renders a valid server-side SVG data URL', async () => {
    const artifact = await renderQrPresentationArtifact(
      'https://example.com/objective-14-5',
      defaults,
      360,
    );

    const svg = decodeSvgDataUrl(artifact);

    expect(svg).toContain('<svg');
    expect(svg).toContain('width="360"');
    expect(svg).toContain('height="360"');
    expect(svg).toContain('#FFFFFF');
  });

  it('keeps presentation settings in the generated artifact', async () => {
    const artifact = await renderQrPresentationArtifact(
      'https://example.com/presentation-settings',
      {
        ...defaults,
        colorHex: '#123456',
        eyeColors: {
          outer: '#654321',
          inner: '#ABCDEF',
        },
      },
      360,
    );

    const svg = decodeSvgDataUrl(artifact);

    expect(svg).toContain('#123456');
    expect(svg).toContain('#654321');
    expect(svg).toContain('#ABCDEF');
  });

  it('adds the controlled retailer background logo only when enabled', () => {
    const baseSvg =
      '<?xml version="1.0"?><svg width="512" height="512">' +
      '<rect x="0" y="0" height="512" width="512" ' +
      "clip-path=\"url('#clip-path-background-color-0')\" fill=\"#FFFFFF\"/>" +
      '<rect x="0" y="0" height="512" width="512" fill="#000000"/>' +
      '</svg>';

    const composed = composeQrPresentationSvg(
      baseSvg,
      {
        ...defaults,
        backgroundLogo: {
          enabled: true,
          logoPath: 'https://example.com/retailer-logo.svg',
          opacity: 0.24,
        },
      },
      512,
    );

    expect(composed).toContain('href="https://example.com/retailer-logo.svg"');
    expect(composed).toContain('opacity="0.24"');
    expect(composed.indexOf('fill="#FFFFFF"')).toBeLessThan(
      composed.indexOf('retailer-logo.svg'),
    );
    expect(composed.indexOf('retailer-logo.svg')).toBeLessThan(
      composed.lastIndexOf('fill="#000000"'),
    );
  });

  it('does not add a background logo when presentation disables it', () => {
    const baseSvg =
      '<?xml version="1.0"?><svg width="512" height="512">' +
      '<rect x="0" y="0" height="512" width="512" ' +
      "clip-path=\"url('#clip-path-background-color-0')\" fill=\"#FFFFFF\"/>" +
      '</svg>';

    const composed = composeQrPresentationSvg(baseSvg, defaults, 512);

    expect(composed).toBe(baseSvg);
    expect(composed).not.toContain('<image');
  });

  it('escapes retailer logo URLs before SVG composition', () => {
    const baseSvg =
      '<?xml version="1.0"?><svg width="512" height="512">' +
      '<rect x="0" y="0" height="512" width="512" ' +
      "clip-path=\"url('#clip-path-background-color-0')\" fill=\"#FFFFFF\"/>" +
      '</svg>';

    const composed = composeQrPresentationSvg(
      baseSvg,
      {
        ...defaults,
        backgroundLogo: {
          enabled: true,
          logoPath: 'https://example.com/logo.svg?a=1&b="two"',
          opacity: 0.2,
        },
      },
      512,
    );

    expect(composed).toContain(
      'href="https://example.com/logo.svg?a=1&amp;b=&quot;two&quot;"',
    );
  });

  it('rejects empty encoded data through the shared presentation boundary', async () => {
    await expect(
      renderQrPresentationArtifact('   ', defaults, 360),
    ).rejects.toThrow('QR presentation data is required.');
  });
});
