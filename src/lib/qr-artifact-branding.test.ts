import {
  createEmbeddedBrandingDataUrl,
  loadEmbeddedQrBrandingAsset,
  prepareQrTemplateDefaultsForArtifact,
  MAX_BRANDING_ASSET_BYTES,
  parseQrBrandingAssetUrl,
} from './qr-artifact-branding';
import { admin } from './firebase-admin';
import { QrTemplateDefaultsSchema } from './schemas/qr-templates';

jest.mock('./firebase-admin', () => ({
  admin: {
    storage: jest.fn(),
  },
}));

const mockStorage = admin.storage as jest.Mock;

const bucket = 'interact-aoe-kidkn.firebasestorage.app';
const retailerId = 'retailer-1';

function logoUrl(path: string, targetBucket = bucket): string {
  return `https://firebasestorage.googleapis.com/v0/b/${targetBucket}/o/${encodeURIComponent(path)}?alt=media&token=test`;
}

describe('parseQrBrandingAssetUrl', () => {
  it('accepts an asset in the authorised retailer QR-template namespace', () => {
    expect(
      parseQrBrandingAssetUrl(
        logoUrl('retailer-assets/retailer-1/qr-templates/logo.png'),
        bucket,
        retailerId
      )
    ).toEqual({
      bucket,
      objectPath: 'retailer-assets/retailer-1/qr-templates/logo.png',
    });
  });

  it('rejects another retailer namespace', () => {
    expect(() =>
      parseQrBrandingAssetUrl(
        logoUrl('retailer-assets/retailer-2/qr-templates/logo.png'),
        bucket,
        retailerId
      )
    ).toThrow('outside the authorised retailer namespace');
  });

  it('rejects another Storage bucket', () => {
    expect(() =>
      parseQrBrandingAssetUrl(
        logoUrl(
          'retailer-assets/retailer-1/qr-templates/logo.png',
          'other.firebasestorage.app'
        ),
        bucket,
        retailerId
      )
    ).toThrow('unexpected Storage bucket');
  });

  it('rejects a non-Firebase host', () => {
    const url = 'https://example.com/v0/b/test/o/logo.png';
    expect(() => parseQrBrandingAssetUrl(url, bucket, retailerId))
      .toThrow('not a trusted Firebase Storage URL');
  });

  it('rejects a non-HTTPS URL', () => {
    const url = logoUrl('retailer-assets/retailer-1/qr-templates/logo.png')
      .replace('https:', 'http:');
    expect(() => parseQrBrandingAssetUrl(url, bucket, retailerId))
      .toThrow('must use HTTPS');
  });

  it('rejects an asset outside the QR-template namespace', () => {
    expect(() =>
      parseQrBrandingAssetUrl(
        logoUrl('retailer-assets/retailer-1/other/logo.png'),
        bucket,
        retailerId
      )
    ).toThrow('outside the authorised retailer namespace');
  });

  it('rejects an incomplete QR-template object path', () => {
    expect(() =>
      parseQrBrandingAssetUrl(
        logoUrl('retailer-assets/retailer-1/qr-templates/'),
        bucket,
        retailerId
      )
    ).toThrow('object path is incomplete');
  });


});


describe('createEmbeddedBrandingDataUrl', () => {
  it('embeds PNG bytes as a base64 data URL', () => {
    expect(createEmbeddedBrandingDataUrl(Buffer.from('logo'), 'image/png'))
      .toBe('data:image/png;base64,bG9nbw==');
  });

  it('accepts JPEG and WebP image types', () => {
    expect(createEmbeddedBrandingDataUrl(Buffer.from('x'), ' IMAGE/JPEG '))
      .toBe('data:image/jpeg;base64,eA==');
    expect(createEmbeddedBrandingDataUrl(Buffer.from('x'), 'image/webp'))
      .toBe('data:image/webp;base64,eA==');
  });

  it('rejects unsupported image types', () => {
    expect(() => createEmbeddedBrandingDataUrl(Buffer.from('x'), 'image/gif'))
      .toThrow('unsupported image type');
  });

  it('rejects SVG until a safe SVG sanitisation path exists', () => {
    expect(() => createEmbeddedBrandingDataUrl(Buffer.from('<svg/>'), 'image/svg+xml'))
      .toThrow('unsupported image type');
  });

  it('rejects an empty asset', () => {
    expect(() => createEmbeddedBrandingDataUrl(Buffer.alloc(0), 'image/png'))
      .toThrow('asset is empty');
  });

  it('rejects an asset larger than the server-side limit', () => {
    const oversized = Buffer.alloc(MAX_BRANDING_ASSET_BYTES + 1);
    expect(() => createEmbeddedBrandingDataUrl(oversized, 'image/png'))
      .toThrow('exceeds the maximum allowed size');
  });
});

describe('loadEmbeddedQrBrandingAsset', () => {
  const objectPath = 'retailer-assets/retailer-1/qr-templates/logo.png';

  function mockFile(
    metadata: Record<string, unknown>,
    bytes = Buffer.from('logo')
  ) {
    const getMetadata = jest.fn().mockResolvedValue([metadata]);
    const download = jest.fn().mockResolvedValue([bytes]);
    const file = jest.fn().mockReturnValue({ getMetadata, download });
    const bucketFn = jest.fn().mockReturnValue({ file });

    mockStorage.mockReturnValue({ bucket: bucketFn });

    return { bucketFn, file, getMetadata, download };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the validated retailer asset and returns an embedded data URL', async () => {
    const mocks = mockFile({
      contentType: 'image/png',
      size: '4',
    });

    await expect(
      loadEmbeddedQrBrandingAsset(logoUrl(objectPath), bucket, retailerId)
    ).resolves.toBe('data:image/png;base64,bG9nbw==');

    expect(mocks.bucketFn).toHaveBeenCalledWith(bucket);
    expect(mocks.file).toHaveBeenCalledWith(objectPath);
    expect(mocks.download).toHaveBeenCalledTimes(1);
  });

  it('rejects unsupported Storage MIME metadata', async () => {
    mockFile({
      contentType: 'image/gif',
      size: '4',
    });

    await expect(
      loadEmbeddedQrBrandingAsset(logoUrl(objectPath), bucket, retailerId)
    ).rejects.toThrow('unsupported image type');
  });

  it('rejects oversized metadata before downloading the asset', async () => {
    const mocks = mockFile({
      contentType: 'image/png',
      size: String(MAX_BRANDING_ASSET_BYTES + 1),
    });

    await expect(
      loadEmbeddedQrBrandingAsset(logoUrl(objectPath), bucket, retailerId)
    ).rejects.toThrow('exceeds the maximum allowed size');

    expect(mocks.download).not.toHaveBeenCalled();
  });

  it('still rejects a cross-retailer URL before Storage access', async () => {
    const crossRetailerUrl = logoUrl(
      'retailer-assets/retailer-2/qr-templates/logo.png'
    );

    await expect(
      loadEmbeddedQrBrandingAsset(crossRetailerUrl, bucket, retailerId)
    ).rejects.toThrow('outside the authorised retailer namespace');

    expect(mockStorage).not.toHaveBeenCalled();
  });
});


describe('prepareQrTemplateDefaultsForArtifact', () => {
  const objectPath = 'retailer-assets/retailer-1/qr-templates/logo.png';
  const sourceLogoUrl = logoUrl(objectPath);

  function mockBrandingAsset() {
    const getMetadata = jest.fn().mockResolvedValue([{
      contentType: 'image/png',
      size: '4',
    }]);
    const download = jest.fn().mockResolvedValue([Buffer.from('logo')]);
    const file = jest.fn().mockReturnValue({ getMetadata, download });
    const bucketFn = jest.fn().mockReturnValue({ file });

    mockStorage.mockReturnValue({ bucket: bucketFn });

    return { bucketFn, file, getMetadata, download };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('embeds the central retailer logo', async () => {
    mockBrandingAsset();
    const defaults = QrTemplateDefaultsSchema.parse({
      logoPath: sourceLogoUrl,
    });

    const prepared = await prepareQrTemplateDefaultsForArtifact(
      defaults,
      bucket,
      retailerId
    );

    expect(prepared.logoPath).toBe('data:image/png;base64,bG9nbw==');
  });

  it('embeds an enabled retailer background watermark', async () => {
    mockBrandingAsset();
    const defaults = QrTemplateDefaultsSchema.parse({
      backgroundLogo: {
        enabled: true,
        logoPath: sourceLogoUrl,
        opacity: 0.2,
      },
    });

    const prepared = await prepareQrTemplateDefaultsForArtifact(
      defaults,
      bucket,
      retailerId
    );

    expect(prepared.backgroundLogo.logoPath)
      .toBe('data:image/png;base64,bG9nbw==');
  });

  it('retrieves a shared central logo and watermark asset only once', async () => {
    const mocks = mockBrandingAsset();
    const defaults = QrTemplateDefaultsSchema.parse({
      logoPath: sourceLogoUrl,
      backgroundLogo: {
        enabled: true,
        logoPath: sourceLogoUrl,
        opacity: 0.2,
      },
    });

    await prepareQrTemplateDefaultsForArtifact(
      defaults,
      bucket,
      retailerId
    );

    expect(mocks.download).toHaveBeenCalledTimes(1);
  });

  it('does not mutate the canonical template defaults', async () => {
    mockBrandingAsset();
    const defaults = QrTemplateDefaultsSchema.parse({
      logoPath: sourceLogoUrl,
      backgroundLogo: {
        enabled: true,
        logoPath: sourceLogoUrl,
        opacity: 0.2,
      },
    });
    const original = JSON.parse(JSON.stringify(defaults));

    await prepareQrTemplateDefaultsForArtifact(
      defaults,
      bucket,
      retailerId
    );

    expect(defaults).toEqual(original);
  });

  it('fails closed when background branding is enabled without an asset', async () => {
    const defaults = QrTemplateDefaultsSchema.parse({
      backgroundLogo: {
        enabled: true,
        opacity: 0.2,
      },
    });

    await expect(
      prepareQrTemplateDefaultsForArtifact(defaults, bucket, retailerId)
    ).rejects.toThrow('requires a retailer logo asset');

    expect(mockStorage).not.toHaveBeenCalled();
  });
});
