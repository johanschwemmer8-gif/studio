/**
 * @fileOverview Server-only QR presentation artifact renderer.
 *
 * PRESENTATION BOUNDARY:
 * - Encodes exactly the data supplied by the caller.
 * - Applies only canonical QR presentation defaults.
 * - Does not create or mutate Campaign, Activation, Deployment or QR identity.
 * - Produces a single SVG data URL suitable for Deployment Pack artifacts.
 */

import QRCodeStyling from 'qr-code-styling';
import { JSDOM } from 'jsdom';

import {
  buildQrPresentationOptions,
  type QrPresentationDefaults,
} from '@/lib/qr-presentation-renderer';

const SVG_BACKGROUND_RECT_PATTERN =
  /<rect x="0" y="0" height="([^"]+)" width="([^"]+)" clip-path="url\('#clip-path-background-color-0'\)" fill="([^"]+)"\/>/;

function escapeXmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildBackgroundLogoLayer(
  logoPath: string,
  opacity: number,
  size: number,
): string {
  const watermarkSize = Math.round(size * 0.58);
  const offset = Math.round((size - watermarkSize) / 2);

  return [
    '<image',
    ` href="${escapeXmlAttribute(logoPath)}"`,
    ` x="${offset}"`,
    ` y="${offset}"`,
    ` width="${watermarkSize}"`,
    ` height="${watermarkSize}"`,
    ' preserveAspectRatio="xMidYMid meet"',
    ` opacity="${opacity}"`,
    '/>',
  ].join('');
}

export function composeQrPresentationSvg(
  baseSvg: string,
  defaults: QrPresentationDefaults,
  size: number,
): string {
  if (
    defaults.backgroundLogo.enabled !== true ||
    defaults.backgroundLogo.logoPath == null
  ) {
    return baseSvg;
  }

  const match = baseSvg.match(SVG_BACKGROUND_RECT_PATTERN);

  if (match == null) {
    throw new Error(
      'QR presentation SVG background boundary could not be located.',
    );
  }

  const [, height, width, fill] = match;
  const backgroundRect = match[0];
  const watermark = buildBackgroundLogoLayer(
    defaults.backgroundLogo.logoPath,
    defaults.backgroundLogo.opacity,
    size,
  );

  const composedBackground = [
    `<rect x="0" y="0" height="${height}" width="${width}"`,
    ` clip-path="url('#clip-path-background-color-0')"`,
    ` fill="${escapeXmlAttribute(fill)}"/>`,
    watermark,
  ].join('');

  return baseSvg.replace(backgroundRect, composedBackground);
}

export async function renderQrPresentationArtifact(
  data: string,
  defaults: QrPresentationDefaults,
  size = 512,
): Promise<string> {
  const options = buildQrPresentationOptions(data, defaults, size);

  const qr = new QRCodeStyling({
    ...options,
    jsdom: JSDOM,
  });

  const rawSvg = await qr.getRawData('svg');

  if (rawSvg == null) {
    throw new Error('QR presentation renderer returned no SVG artifact.');
  }

  const baseSvg = Buffer.isBuffer(rawSvg)
    ? rawSvg.toString('utf8')
    : await rawSvg.text();

  const finalSvg = composeQrPresentationSvg(baseSvg, defaults, size);

  return `data:image/svg+xml;base64,${Buffer.from(
    finalSvg,
    'utf8',
  ).toString('base64')}`;
}
