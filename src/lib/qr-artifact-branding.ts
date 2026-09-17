import type { QrTemplateDefaults } from '@/lib/schemas/qr-templates';
import { admin } from '@/lib/firebase-admin';

const MAX_BRANDING_ASSET_BYTES = 5 * 1024 * 1024;
const QR_TEMPLATE_ASSET_PREFIX = 'retailer-assets';

export interface QrBrandingAssetReference {
  bucket: string;
  objectPath: string;
}

export function parseQrBrandingAssetUrl(
  logoUrl: string,
  expectedBucket: string,
  retailerId: string
): QrBrandingAssetReference {
  if (!logoUrl || !expectedBucket || !retailerId) {
    throw new Error('QR branding asset reference is incomplete.');
  }

  let url: URL;

  try {
    url = new URL(logoUrl);
  } catch {
    throw new Error('QR branding asset URL is invalid.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('QR branding asset URL must use HTTPS.');
  }

  if (url.hostname !== 'firebasestorage.googleapis.com') {
    throw new Error('QR branding asset URL is not a trusted Firebase Storage URL.');
  }

  const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);

  if (!match) {
    throw new Error('QR branding asset URL has an invalid Firebase Storage path.');
  }

  const bucket = decodeURIComponent(match[1]);
  const objectPath = decodeURIComponent(match[2]);

  if (bucket !== expectedBucket) {
    throw new Error('QR branding asset belongs to an unexpected Storage bucket.');
  }

  const expectedPrefix =
    `${QR_TEMPLATE_ASSET_PREFIX}/${retailerId}/qr-templates/`;

  if (!objectPath.startsWith(expectedPrefix)) {
    throw new Error('QR branding asset is outside the authorised retailer namespace.');
  }

  if (objectPath.length <= expectedPrefix.length) {
    throw new Error('QR branding asset object path is incomplete.');
  }

  return { bucket, objectPath };
}

export { MAX_BRANDING_ASSET_BYTES };
export type { QrTemplateDefaults };

const EMBEDDABLE_BRANDING_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export function createEmbeddedBrandingDataUrl(
  bytes: Buffer,
  contentType: string
): string {
  const mimeType = contentType.trim().toLowerCase();

  if (!EMBEDDABLE_BRANDING_MIME_TYPES.has(mimeType)) {
    throw new Error('QR branding asset has an unsupported image type.');
  }

  if (bytes.length === 0) {
    throw new Error('QR branding asset is empty.');
  }

  if (bytes.length > MAX_BRANDING_ASSET_BYTES) {
    throw new Error('QR branding asset exceeds the maximum allowed size.');
  }

  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

export async function loadEmbeddedQrBrandingAsset(
  logoUrl: string,
  expectedBucket: string,
  retailerId: string
): Promise<string> {
  const { bucket, objectPath } = parseQrBrandingAssetUrl(
    logoUrl,
    expectedBucket,
    retailerId
  );

  const file = admin.storage().bucket(bucket).file(objectPath);
  const [metadata] = await file.getMetadata();

  const contentType =
    typeof metadata.contentType === 'string' ? metadata.contentType : '';

  const metadataSize = Number(metadata.size);

  if (Number.isFinite(metadataSize) && metadataSize > MAX_BRANDING_ASSET_BYTES) {
    throw new Error('QR branding asset exceeds the maximum allowed size.');
  }

  const [bytes] = await file.download();

  return createEmbeddedBrandingDataUrl(bytes, contentType);
}

export async function prepareQrTemplateDefaultsForArtifact(
  defaults: QrTemplateDefaults,
  expectedBucket: string,
  retailerId: string
): Promise<QrTemplateDefaults> {
  const prepared: QrTemplateDefaults = {
    ...defaults,
    gradient: { ...defaults.gradient },
    eyeColors: { ...defaults.eyeColors },
    backgroundLogo: { ...defaults.backgroundLogo },
  };

  const embeddedAssets = new Map<string, string>();

  const embed = async (logoUrl: string): Promise<string> => {
    const cached = embeddedAssets.get(logoUrl);

    if (cached) {
      return cached;
    }

    const embedded = await loadEmbeddedQrBrandingAsset(
      logoUrl,
      expectedBucket,
      retailerId
    );

    embeddedAssets.set(logoUrl, embedded);
    return embedded;
  };

  if (defaults.logoPath) {
    prepared.logoPath = await embed(defaults.logoPath);
  }

  if (defaults.backgroundLogo.enabled) {
    if (!defaults.backgroundLogo.logoPath) {
      throw new Error(
        'Enabled QR background branding requires a retailer logo asset.'
      );
    }

    prepared.backgroundLogo.logoPath = await embed(
      defaults.backgroundLogo.logoPath
    );
  }

  return prepared;
}
