/**
 * @fileOverview Server-only QR presentation artifact renderer.
 *
 * PRESENTATION BOUNDARY:
 * - Encodes exactly the data supplied by the caller.
 * - Uses qrcode for canonical QR matrix generation.
 * - Mirrors the canonical browser presentation semantics without JSDOM.
 * - Does not create or mutate Campaign, Activation, Deployment or QR identity.
 * - Produces a self-contained SVG data URL for Reprint and Deployment Pack.
 */

import QRCode from 'qrcode';

import type {
  QrPresentationDefaults,
  QrPresentationModuleStyle,
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

function rotate(
  element: string,
  x: number,
  y: number,
  size: number,
  radians: number,
): string {
  if (radians === 0) {
    return element;
  }

  const degrees = (180 * radians) / Math.PI;
  const cx = x + size / 2;
  const cy = y + size / 2;

  return `<g transform="rotate(${degrees},${cx},${cy})">${element}</g>`;
}

function square(
  x: number,
  y: number,
  size: number,
  fill: string,
): string {
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}"/>`;
}

function dot(
  x: number,
  y: number,
  size: number,
  fill: string,
): string {
  return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${fill}"/>`;
}

function sideRounded(
  x: number,
  y: number,
  size: number,
  fill: string,
  rotation: number,
): string {
  const path =
    `M ${x} ${y}` +
    `v ${size}` +
    `h ${size / 2}` +
    `a ${size / 2} ${size / 2}, 0, 0, 0, 0 ${-size}`;

  return rotate(
    `<path d="${path}" fill="${fill}"/>`,
    x,
    y,
    size,
    rotation,
  );
}

function cornerRounded(
  x: number,
  y: number,
  size: number,
  fill: string,
  rotation: number,
): string {
  const path =
    `M ${x} ${y}` +
    `v ${size}` +
    `h ${size}` +
    `v ${-size / 2}` +
    `a ${size / 2} ${size / 2}, 0, 0, 0, ${-size / 2} ${-size / 2}`;

  return rotate(
    `<path d="${path}" fill="${fill}"/>`,
    x,
    y,
    size,
    rotation,
  );
}

function cornerExtraRounded(
  x: number,
  y: number,
  size: number,
  fill: string,
  rotation: number,
): string {
  const path =
    `M ${x} ${y}` +
    `v ${size}` +
    `h ${size}` +
    `a ${size} ${size}, 0, 0, 0, ${-size} ${-size}`;

  return rotate(
    `<path d="${path}" fill="${fill}"/>`,
    x,
    y,
    size,
    rotation,
  );
}

function cornersRounded(
  x: number,
  y: number,
  size: number,
  fill: string,
  rotation: number,
): string {
  const path =
    `M ${x} ${y}` +
    `v ${size / 2}` +
    `a ${size / 2} ${size / 2}, 0, 0, 0, ${size / 2} ${size / 2}` +
    `h ${size / 2}` +
    `v ${-size / 2}` +
    `a ${size / 2} ${size / 2}, 0, 0, 0, ${-size / 2} ${-size / 2}`;

  return rotate(
    `<path d="${path}" fill="${fill}"/>`,
    x,
    y,
    size,
    rotation,
  );
}

type Neighbors = {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
};

function buildDataModule(
  x: number,
  y: number,
  size: number,
  style: QrPresentationModuleStyle,
  fill: string,
  neighbors: Neighbors,
): string {
  if (style === 'square') {
    return square(x, y, size, fill);
  }

  if (style === 'dots') {
    return dot(x, y, size, fill);
  }

  const left = +neighbors.left;
  const right = +neighbors.right;
  const top = +neighbors.top;
  const bottom = +neighbors.bottom;
  const count = left + right + top + bottom;

  if (style === 'rounded' || style === 'extra-rounded') {
    if (count === 0) {
      return dot(x, y, size, fill);
    }

    if (
      count > 2 ||
      (neighbors.left && neighbors.right) ||
      (neighbors.top && neighbors.bottom)
    ) {
      return square(x, y, size, fill);
    }

    if (count === 2) {
      let rotation = 0;

      if (neighbors.left && neighbors.top) {
        rotation = Math.PI / 2;
      } else if (neighbors.top && neighbors.right) {
        rotation = Math.PI;
      } else if (neighbors.right && neighbors.bottom) {
        rotation = -Math.PI / 2;
      }

      return style === 'extra-rounded'
        ? cornerExtraRounded(x, y, size, fill, rotation)
        : cornerRounded(x, y, size, fill, rotation);
    }

    let rotation = 0;

    if (neighbors.top) {
      rotation = Math.PI / 2;
    } else if (neighbors.right) {
      rotation = Math.PI;
    } else if (neighbors.bottom) {
      rotation = -Math.PI / 2;
    }

    return sideRounded(x, y, size, fill, rotation);
  }

  if (style === 'classy' || style === 'classy-rounded') {
    if (count === 0) {
      return cornersRounded(
        x,
        y,
        size,
        fill,
        Math.PI / 2,
      );
    }

    if (!neighbors.left && !neighbors.top) {
      return style === 'classy-rounded'
        ? cornerExtraRounded(
            x,
            y,
            size,
            fill,
            -Math.PI / 2,
          )
        : cornerRounded(
            x,
            y,
            size,
            fill,
            -Math.PI / 2,
          );
    }

    if (!neighbors.right && !neighbors.bottom) {
      return style === 'classy-rounded'
        ? cornerExtraRounded(
            x,
            y,
            size,
            fill,
            Math.PI / 2,
          )
        : cornerRounded(
            x,
            y,
            size,
            fill,
            Math.PI / 2,
          );
    }

    return square(x, y, size, fill);
  }

  return square(x, y, size, fill);
}

function isFinderRegion(
  row: number,
  col: number,
  matrixSize: number,
): boolean {
  return (
    (row < 7 && col < 7) ||
    (row < 7 && col >= matrixSize - 7) ||
    (row >= matrixSize - 7 && col < 7)
  );
}

function buildSquareFinderOuter(
  x: number,
  y: number,
  size: number,
  fill: string,
): string {
  const unit = size / 7;

  const path =
    `M ${x} ${y}` +
    `v ${size}` +
    `h ${size}` +
    `v ${-size}` +
    'z' +
    `M ${x + unit} ${y + unit}` +
    `h ${size - 2 * unit}` +
    `v ${size - 2 * unit}` +
    `h ${-size + 2 * unit}` +
    'z';

  return `<path d="${path}" fill="${fill}" fill-rule="evenodd" clip-rule="evenodd"/>`;
}

function buildRoundedFinderOuter(
  x: number,
  y: number,
  size: number,
  fill: string,
): string {
  const unit = size / 7;

  const path =
    `M ${x} ${y + 2.5 * unit}` +
    `v ${2 * unit}` +
    `a ${2.5 * unit} ${2.5 * unit}, 0, 0, 0, ${2.5 * unit} ${2.5 * unit}` +
    `h ${2 * unit}` +
    `a ${2.5 * unit} ${2.5 * unit}, 0, 0, 0, ${2.5 * unit} ${-2.5 * unit}` +
    `v ${-2 * unit}` +
    `a ${2.5 * unit} ${2.5 * unit}, 0, 0, 0, ${-2.5 * unit} ${-2.5 * unit}` +
    `h ${-2 * unit}` +
    `a ${2.5 * unit} ${2.5 * unit}, 0, 0, 0, ${-2.5 * unit} ${2.5 * unit}` +
    `M ${x + 2.5 * unit} ${y + unit}` +
    `h ${2 * unit}` +
    `a ${1.5 * unit} ${1.5 * unit}, 0, 0, 1, ${1.5 * unit} ${1.5 * unit}` +
    `v ${2 * unit}` +
    `a ${1.5 * unit} ${1.5 * unit}, 0, 0, 1, ${-1.5 * unit} ${1.5 * unit}` +
    `h ${-2 * unit}` +
    `a ${1.5 * unit} ${1.5 * unit}, 0, 0, 1, ${-1.5 * unit} ${-1.5 * unit}` +
    `v ${-2 * unit}` +
    `a ${1.5 * unit} ${1.5 * unit}, 0, 0, 1, ${1.5 * unit} ${-1.5 * unit}`;

  return `<path d="${path}" fill="${fill}" fill-rule="evenodd" clip-rule="evenodd"/>`;
}

function buildCircularFinderOuter(
  x: number,
  y: number,
  size: number,
  fill: string,
): string {
  const unit = size / 7;
  const cx = x + size / 2;
  const cy = y + size / 2;

  const path =
    `M ${cx} ${y}` +
    `a ${size / 2} ${size / 2} 0 1 0 0.1 0` +
    'z' +
    `m 0 ${unit}` +
    `a ${size / 2 - unit} ${size / 2 - unit} 0 1 1 -0.1 0` +
    'z';

  return `<path d="${path}" fill="${fill}" fill-rule="evenodd" clip-rule="evenodd"/>`;
}

function buildFinder(
  row: number,
  col: number,
  moduleSize: number,
  offset: number,
  defaults: QrPresentationDefaults,
): string {
  const x = offset + col * moduleSize;
  const y = offset + row * moduleSize;
  const outerSize = moduleSize * 7;

  let outer: string;

  if (defaults.eyeStyle === 'square') {
    outer = buildSquareFinderOuter(
      x,
      y,
      outerSize,
      escapeXmlAttribute(defaults.eyeColors.outer),
    );
  } else if (defaults.eyeStyle === 'rounded') {
    outer = buildRoundedFinderOuter(
      x,
      y,
      outerSize,
      escapeXmlAttribute(defaults.eyeColors.outer),
    );
  } else {
    outer = buildCircularFinderOuter(
      x,
      y,
      outerSize,
      escapeXmlAttribute(defaults.eyeColors.outer),
    );
  }

  const innerX = x + 2 * moduleSize;
  const innerY = y + 2 * moduleSize;
  const innerSize = 3 * moduleSize;
  const innerFill = escapeXmlAttribute(
    defaults.eyeColors.inner,
  );

  const inner =
    defaults.eyeStyle === 'square'
      ? square(
          innerX,
          innerY,
          innerSize,
          innerFill,
        )
      : dot(
          innerX,
          innerY,
          innerSize,
          innerFill,
        );

  return outer + inner;
}

function buildGradient(
  defaults: QrPresentationDefaults,
): { definition: string; fill: string } {
  if (!defaults.gradient.enabled) {
    return {
      definition: '',
      fill: escapeXmlAttribute(defaults.colorHex),
    };
  }

  const angle = (defaults.gradient.angle * Math.PI) / 180;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  const x1 = 50 - dx * 50;
  const y1 = 50 - dy * 50;
  const x2 = 50 + dx * 50;
  const y2 = 50 + dy * 50;

  return {
    definition:
      `<linearGradient id="qr-module-gradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">` +
      `<stop offset="0%" stop-color="${escapeXmlAttribute(defaults.gradient.from)}"/>` +
      `<stop offset="100%" stop-color="${escapeXmlAttribute(defaults.gradient.to)}"/>` +
      '</linearGradient>',
    fill: 'url(#qr-module-gradient)',
  };
}

function buildBackgroundLogoLayer(
  logoPath: string,
  opacity: number,
  size: number,
): string {
  const watermarkSize = Math.round(size * 0.58);
  const offset = Math.round(
    (size - watermarkSize) / 2,
  );

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
    !defaults.backgroundLogo.enabled ||
    defaults.backgroundLogo.logoPath == null
  ) {
    return baseSvg;
  }

  const match = baseSvg.match(
    SVG_BACKGROUND_RECT_PATTERN,
  );

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

  const composed =
    `<rect x="0" y="0" height="${height}" width="${width}"` +
    ` clip-path="url('#clip-path-background-color-0')"` +
    ` fill="${escapeXmlAttribute(fill)}"/>` +
    watermark;

  return baseSvg.replace(
    backgroundRect,
    composed,
  );
}

function buildCentralLogo(
  logoPath: string,
  logoSizeRatio: number,
  size: number,
): string {
  const logoSize = size * logoSizeRatio;
  const logoOffset = (size - logoSize) / 2;

  return [
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
    throw new Error(
      'QR presentation data is required.',
    );
  }

  const qr = QRCode.create(data, {
    errorCorrectionLevel: defaults.errorCorrection,
  });

  const matrixSize = qr.modules.size;
  const matrix = qr.modules.data;

  // Match buildQrPresentationOptions():
  // quietZone affects pixel margin, not QR matrix dimensions.
  const margin = Math.max(
    Math.round(size * 0.04),
    Math.round(
      size * 0.01 * defaults.quietZone,
    ),
  );

  // qr-code-styling uses an integral module size and
  // centres the resulting matrix inside the canvas.
  const moduleSize = Math.floor(
    (size - margin * 2) / matrixSize,
  );

  if (moduleSize <= 0) {
    throw new Error(
      'QR presentation size is too small for the encoded matrix.',
    );
  }

  const renderedMatrixSize =
    moduleSize * matrixSize;

  const offset =
    (size - renderedMatrixSize) / 2;

  const gradient = buildGradient(defaults);

  const hasLogo = defaults.logoPath != null;

  const logoSize = hasLogo
    ? size * defaults.logoSizeRatio
    : 0;

  // Mirrors hideBackgroundDots + image margin.
  const logoClearance =
    logoSize + (hasLogo ? 8 : 0);

  const logoStart =
    (size - logoClearance) / 2;

  const logoEnd =
    (size + logoClearance) / 2;

  function matrixIsDark(
    row: number,
    col: number,
  ): boolean {
    if (
      row < 0 ||
      col < 0 ||
      row >= matrixSize ||
      col >= matrixSize
    ) {
      return false;
    }

    return matrix[
      row * matrixSize + col
    ] !== 0;
  }

  function intersectsLogo(
    row: number,
    col: number,
  ): boolean {
    if (!hasLogo) {
      return false;
    }

    const x =
      offset + col * moduleSize;
    const y =
      offset + row * moduleSize;

    return (
      x < logoEnd &&
      x + moduleSize > logoStart &&
      y < logoEnd &&
      y + moduleSize > logoStart
    );
  }

  function renderableDark(
    row: number,
    col: number,
  ): boolean {
    return (
      matrixIsDark(row, col) &&
      !isFinderRegion(
        row,
        col,
        matrixSize,
      ) &&
      !intersectsLogo(row, col)
    );
  }

  const modules: string[] = [];

  for (
    let row = 0;
    row < matrixSize;
    row += 1
  ) {
    for (
      let col = 0;
      col < matrixSize;
      col += 1
    ) {
      if (!renderableDark(row, col)) {
        continue;
      }

      const x =
        offset + col * moduleSize;
      const y =
        offset + row * moduleSize;

      modules.push(
        buildDataModule(
          x,
          y,
          moduleSize,
          defaults.moduleStyle,
          gradient.fill,
          {
            left: renderableDark(
              row,
              col - 1,
            ),
            right: renderableDark(
              row,
              col + 1,
            ),
            top: renderableDark(
              row - 1,
              col,
            ),
            bottom: renderableDark(
              row + 1,
              col,
            ),
          },
        ),
      );
    }
  }

  const finders = [
    buildFinder(
      0,
      0,
      moduleSize,
      offset,
      defaults,
    ),
    buildFinder(
      0,
      matrixSize - 7,
      moduleSize,
      offset,
      defaults,
    ),
    buildFinder(
      matrixSize - 7,
      0,
      moduleSize,
      offset,
      defaults,
    ),
  ].join('');

  const centralLogo =
    defaults.logoPath != null
      ? buildCentralLogo(
          defaults.logoPath,
          defaults.logoSizeRatio,
          size,
        )
      : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    '<defs>',
    `<clipPath id="clip-path-background-color-0"><rect x="0" y="0" width="${size}" height="${size}"/></clipPath>`,
    gradient.definition,
    '</defs>',
    `<rect x="0" y="0" height="${size}" width="${size}" clip-path="url('#clip-path-background-color-0')" fill="${escapeXmlAttribute(defaults.bgColorHex)}"/>`,
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
  const baseSvg = buildQrPresentationSvg(
    data,
    defaults,
    size,
  );

  const finalSvg =
    composeQrPresentationSvg(
      baseSvg,
      defaults,
      size,
    );

  return `data:image/svg+xml;base64,${Buffer.from(
    finalSvg,
    'utf8',
  ).toString('base64')}`;
}
