/**
 * @fileOverview Browser-side QR presentation adapter.
 *
 * PRESENTATION BOUNDARY:
 * - Accepts only data-to-encode plus canonical QR presentation defaults.
 * - Does not create or mutate Campaign, Activation, Deployment or QR identity.
 * - Keeps qr-code-styling vocabulary behind an iNteract-owned mapping.
 */

export type QrPresentationModuleStyle =
  | 'square'
  | 'rounded'
  | 'dots'
  | 'classy'
  | 'classy-rounded'
  | 'extra-rounded';

export type QrPresentationEyeStyle = 'square' | 'rounded' | 'leaf';
export type QrPresentationErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export type QrPresentationDefaults = {
  colorHex: string;
  bgColorHex: string;
  errorCorrection: QrPresentationErrorCorrection;
  moduleStyle: QrPresentationModuleStyle;
  gradient: {
    enabled: boolean;
    from: string;
    to: string;
    angle: number;
  };
  eyeStyle: QrPresentationEyeStyle;
  eyeColors: {
    outer: string;
    inner: string;
  };
  logoPath?: string;
  logoSizeRatio: number;
  backgroundLogo: {
    enabled: boolean;
    logoPath?: string;
    opacity: number;
  };
  quietZone: number;
};

type RichGradient = {
  type: 'linear';
  rotation: number;
  colorStops: Array<{ offset: number; color: string }>;
};

export type RichQrPresentationOptions = {
  type: 'svg';
  shape: 'square';
  width: number;
  height: number;
  margin: number;
  data: string;
  image?: string;
  qrOptions: {
    errorCorrectionLevel: QrPresentationErrorCorrection;
  };
  imageOptions: {
    hideBackgroundDots: boolean;
    imageSize: number;
    crossOrigin: 'anonymous';
    margin: number;
  };
  dotsOptions: {
    type: QrPresentationModuleStyle;
    color?: string;
    gradient?: RichGradient;
  };
  cornersSquareOptions: {
    type: 'square' | 'extra-rounded' | 'classy';
    color: string;
  };
  cornersDotOptions: {
    type: 'square' | 'dot' | 'classy';
    color: string;
  };
  backgroundOptions: {
    color: string;
  };
};

const EYE_STYLE_MAP: Record<
  QrPresentationEyeStyle,
  {
    outer: RichQrPresentationOptions['cornersSquareOptions']['type'];
    inner: RichQrPresentationOptions['cornersDotOptions']['type'];
  }
> = {
  square: { outer: 'square', inner: 'square' },
  rounded: { outer: 'extra-rounded', inner: 'dot' },
  leaf: { outer: 'classy', inner: 'classy' },
};

export function buildQrPresentationOptions(
  data: string,
  defaults: QrPresentationDefaults,
  size = 360,
): RichQrPresentationOptions {
  if (!data.trim()) {
    throw new Error('QR presentation data is required.');
  }

  const eye = EYE_STYLE_MAP[defaults.eyeStyle];
  const gradient: RichGradient | undefined = defaults.gradient.enabled
    ? {
        type: 'linear',
        rotation: (defaults.gradient.angle * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: defaults.gradient.from },
          { offset: 1, color: defaults.gradient.to },
        ],
      }
    : undefined;


  return {
    type: 'svg',
    shape: 'square',
    width: size,
    height: size,
    // Canonical quietZone is expressed in QR modules. qr-code-styling
    // expects its outer margin in pixels, so scale the canonical minimum
    // against the rendered artifact size. Four modules is the minimum
    // safety baseline; larger canonical values increase the margin.
    margin: Math.max(
      Math.round(size * 0.04),
      Math.round(size * 0.01 * defaults.quietZone),
    ),
    data,
    image: defaults.logoPath || undefined,
    qrOptions: {
      errorCorrectionLevel: defaults.errorCorrection,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: defaults.logoSizeRatio,
      crossOrigin: 'anonymous',
      margin: 4,
    },
    dotsOptions: {
      type: defaults.moduleStyle,
      ...(gradient ? { gradient } : { color: defaults.colorHex }),
    },
    cornersSquareOptions: {
      type: eye.outer,
      color: defaults.eyeColors.outer,
    },
    cornersDotOptions: {
      type: eye.inner,
      color: defaults.eyeColors.inner,
    },
    // When a controlled background watermark is enabled, the SVG background is
    // transparent so the retailer-owned mark can sit behind the modules. The
    // preview/artifact composition layer supplies bgColorHex behind both layers.
    backgroundOptions: {
      color: defaults.bgColorHex,
    },
  };
}
