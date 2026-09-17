/**
 * @fileOverview Server-only QR presentation artifact renderer.
 *
 * PRESENTATION BOUNDARY:
 * - Encodes exactly the data supplied by the caller.
 * - Uses qrcode for canonical QR matrix generation.
 * - Applies canonical iNteract QR presentation defaults deterministically.
 * - Does not create or mutate Campaign, Activation, Deployment or QR identity.
 * - Produces a single self-contained SVG data URL suitable for operational
 *   QR artifacts including Reprint and Deployment Pack.
 */

import QRCode from 'qrcode';

import type { QrPresentationDefaults } from '@/lib/qr-presentation-renderer';

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

function isFinderRegion(
  row: number,
  col: number,
  matrixSize: number,
): boolean {
  const topLeft = row < 7 && col < 7;
  const topRight = row < 7 && col >= matrixSize - 7;
  const bottomLeft = row >= matrixSize - 7 && col < 7;

  return topLeft || topRight || bottomLeft;
}

function buildModuleShape(
  x: number,
  y: number,
  moduleSize: number,
  style: QrPresentationDefaults['moduleStyle'],
  fill: string,
): string {
  const inset =
    style === 'dots'
      ? moduleSize * 0.12
      : style === 'rounded' ||
          style === 'classy' ||
          style === 'classy-rounded' ||
          style === 'extra-rounded'
        ? moduleSize * 0.04
        : 0;

  const dimension = moduleSize - inset * 2;
  const px = x + inset;
  const py = y + inset;

  if (style === 'dots') {
    const radius = dimension / 2;

    return [
      '<circle',
      ` cx="${px + radius}"`,
      ` cy="${py + radius}"`,
      ` r="${radius}"`,
      ` fill="${fill}"`,
      '/>',
    ].join('');
  }

  let radius = 0;

  switch (style) {
    case 'rounded':
      radius = moduleSize * 0.22;
      break;
    case 'classy':
      radius = moduleSize * 0.14;
      break;
    case 'classy-rounded':
      radius = moduleSize * 0.28;
      break;
    case 'extra-rounded':
      radius = moduleSize * 0.42;
      break;
    default:
      radius = 0;
  }

  return [
    '<rect',
    ` x="${px}"`,
    ` y="${py}"`,
    ` width="${dimension}"`,
    ` height="${dimension}"`,
    radius > 0 ? ` rx="${radius}" ry="${radius}"` : '',
    ` fill="${fill}"`,
    '/>',
  ].join('');
}

function buildFinderPattern(
  row: number,
  col: number,
  moduleSize: number,
  quietZone: number,
  defaults: QrPresentationDefaults,
): string {
  const x = (quietZone + col) * moduleSize;
  const y = (quietZone + row) * moduleSize;
  const outerSize = 7 * moduleSize;
  const middleInset = moduleSize;
  const innerInset = 2 * moduleSize;
  const middleSize = 5 * moduleSize;
  const innerSize = 3 * moduleSize;

  let outerRadius = 0;
  let innerRadius = 0;

  if (defaults.eyeStyle === 'rounded') {
    outerRadius = moduleSize * 1.25;
    innerRadius = moduleSize * 0.75;
  } else if (defaults.eyeStyle === 'leaf') {
    outerRadius = moduleSize * 1.8;
    innerRadius = moduleSize * 1.1;
  }

  return [
    '<rect',
    ` x="${x}"`,
    ` y="${y}"`,
    ` width="${outerSize}"`,
    ` height="${outerSize}"`,
    outerRadius > 0
      ? ` rx="${outerRadius}" ry="${outerRadius}"`
      : '',
    ` fill="${escapeXmlAttribute(defaults.eyeColors.outer)}"`,
    '/>',
    '<rect',
    ` x="${x + middleInset}"`,
    ` y="${y + middleInset}"`,
    ` width="${middleSize}"`,
    ` height="${middleSize}"`,
    outerRadius > 0
      ? ` rx="${Math.max(0, outerRadius - moduleSize * 0.35)}" ry="${Math.max(
          0,
          outerRadius - moduleSize * 0.35,
        )}"`
      : '',
    ` fill="${escapeXmlAttribute(defaults.bgColorHex)}"`,
    '/>',
    '<rect',
    ` x="${x + innerInset}"`,
    ` y="${y + innerInset}"`,
    ` width="${innerSize}"`,
    ` height="${innerSize}"`,
    innerRadius > 0
      ? ` rx="${innerRadius}" ry="${innerRadius}"`
      : '',
    ` fill="${escapeXmlAttribute(defaults.eyeColors.inner)}"`,
    '/>',
  ].join('');
}

function buildGradientDefinition(
  defaults: QrPresentationDefaults,
): {
  definition: string;
  fill: string;
} {
  if (defaults.gradient.enabled !== true) {
    return {
      definition: '',
      fill: escapeXmlAttribute(defaults.colorHex),
    };
  }

  const angleRadians = (defaults.gradient.angle * Math.PI) / 180;
  const x = Math.cos(angleRadians);
  const y = Math.sin(angleRadians);

  const x1 = 50 - x * 50;
  const y1 = 50 - y * 50;
  const x2 = 50 + x * 50;
  const y2 = 50 + y * 50;

  return {
    definition: [
      '<linearGradient',
      ' id="qr-module-gradient"',
      ` x1="${x1}%"`,
      ` y1="${y1}%"`,
      ` x2="${x2}%"`,
      ` y2="${y2}%"`,
      '>',
      `<stop offset="0%" stop-color="${escapeXmlAttribute(
        defaults.gradient.from,
      )}"/>`,
      `<stop offset="100%" stop-color="${escapeXmlAttribute(
        defaults.gradient.to,
      )}"/>`,
      '</linearGradient>',
    ].join(''),
    fill: 'url(#qr-module-gradient)',
  };
}

function intersectsLogoClearance(
  row: number,
  col: number,
  matrixSize: number,
  logoSizeRatio: number,
): boolean {
  const logoModules = Math.max(
    3,
    Math.ceil(matrixSize * logoSizeRatio),
  );

  const clearanceModules = logoModules + 2;
  const start = Math.floor((matrixSize - clearanceModules) / 2);
  const end = start + clearanceModules;

  return (
    row >= start &&
    row < end &&
    col >= start &&
    col < end
  );
}

function buildCentralLogoLayer(
  logoPath: string,
  logoSizeRatio: number,
  size: number,
): string {
  const logoSize = size * logoSizeRatio;
  const padding = Math.max(4, size * 0.012);
  const backgroundSize = logoSize + padding * 2;
  const backgroundOffset = (size - backgroundSize) / 2;
  const logoOffset = (size - logoSize) / 2;
  const radius = Math.max(4, size * 0.012);

  return [
    '<rect',
    ` x="${backgroundOffset}"`,
    ` y="${backgroundOffset}"`,
    ` width="${backgroundSize}"`,
    ` height="${backgroundSize}"`,
    ` rx="${radius}" ry="${radius}"`,
    ' fill="#FFFFFF"',
    '/>',
    '<image',
    ` href="${escapeXmlAttribute(logoPath)}"`,
    ` x="${logoOffset}"`,
    ` y="${logoOffset}"`,
    ` width="${logoSize}"`,
    ` height="${logoSize}"`,
    ' preserveAspectRatio="xMidYMid meet"',
    '/>',
  ].join('');
}

function buildQrPresentationSvg(
  data: string,
  defaults: QrPresentationDefaults,
  size: number,
): string {
  if (!data.trim()) {
    throw new Error('QR presentation data is required.');
  }

  const qr = QRCode.create(data, {
    errorCorrectionLevel: defaults.errorCorrection,
  });

  const matrixSize = qr.modules.size;
  const matrix = qr.modules.data;
  const quietZone = defaults.quietZone;
  const totalModules = matrixSize + quietZone * 2;
  const moduleSize = size / totalModules;

  const gradient = buildGradientDefinition(defaults);

  const defs = [
    '<defs>',
    `<clipPath id="clip-path-background-color-0"><rect x="0" y="0" width="${size}" height="${size}"/></clipPath>`,
    gradient.definition,
    '</defs>',
  ].join('');

  const background = [
    '<rect x="0" y="0"',
    ` height="${size}"`,
    ` width="${size}"`,
    ` clip-path="url('#clip-path-background-color-0')"`,
    ` fill="${escapeXmlAttribute(defaults.bgColorHex)}"/>`,
  ].join('');

  const modules: string[] = [];

  for (let row = 0; row < matrixSize; row += 1) {
    for (let col = 0; col < matrixSize; col += 1) {
      const index = row * matrixSize + col;

      if (matrix[index] === 0) {
        continue;
      }

      if (isFinderRegion(row, col, matrixSize)) {
        continue;
      }

      if (
        defaults.logoPath != null &&
        intersectsLogoClearance(
          row,
          col,
          matrixSize,
          defaults.logoSizeRatio,
        )
      ) {
        continue;
      }

      const x = (quietZone + col) * moduleSize;
      const y = (quietZone + row) * moduleSize;

      modules.push(
        buildModuleShape(
          x,
          y,
          moduleSize,
          defaults.moduleStyle,
          gradient.fill,
        ),
      );
    }
  }

  const finders = [
    buildFinderPattern(0, 0, moduleSize, quietZone, defaults),
    buildFinderPattern(
      0,
      matrixSize - 7,
      moduleSize,
      quietZone,
      defaults,
    ),
    buildFinderPattern(
      matrixSize - 7,
      0,
      moduleSize,
      quietZone,
      defaults,
    ),
  ].join('');

  const centralLogo =
    defaults.logoPath != null
      ? buildCentralLogoLayer(
          defaults.logoPath,
          defaults.logoSizeRatio,
          size,
        )
      : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    defs,
    background,
    modules.join(''),
    finders,
    centralLogo,
    '</svg>',
  ].join('');
}

export async function renderQrPresentationArtifact(
  data: string,
  defaults: QrPresentationDefaults,
  size = 512,
): Promise<string> {
  const baseSvg = buildQrPresentationSvg(data, defaults, size);
  const finalSvg = composeQrPresentationSvg(baseSvg, defaults, size);

  return `data:image/svg+xml;base64,${Buffer.from(
    finalSvg,
    'utf8',
  ).toString('base64')}`;
}
