import { getDb } from './firebase-admin';
import { resolveProductionQr } from './qr-resolution';
import { resolveSponsoredMediaForProductionQr } from './sponsored-media-resolution';

jest.mock('./firebase-admin', () => ({
  getDb: jest.fn(),
}));

jest.mock('./qr-resolution', () => ({
  resolveProductionQr: jest.fn(),
}));

const mockGetDb = getDb as jest.Mock;
const mockResolveProductionQr = resolveProductionQr as jest.Mock;

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

function resolvedQr(
  sponsoredMedia: Record<string, unknown> | undefined = {
    partnerId: 'partner_nike',
    creativeId: 'creative_nike',
    format: 'VIDEO',
    sponsorName: 'Nike',
    mediaUrl: 'https://example.com/nike.mp4',
    headline: 'Nike Air',
    destinationUrl: 'https://example.com/nike',
  }
) {
  return {
    qr: {
      qrCodeId: 'qr_nike',
      retailerId: 'retailer_a',
      campaignId: 'campaign_1',
      activationId: 'activation_1',
      deploymentId: 'deployment_1',
      configurationVersion: 3,
      environment: 'PRODUCTION',
    },
    activation: {
      experienceConfig: {
        ...(sponsoredMedia ? { sponsoredMedia } : {}),
      },
    },
    campaign: {},
    deployment: {},
  };
}

function partner(overrides: Record<string, unknown> = {}) {
  return {
    partnerId: 'partner_nike',
    retailerId: 'retailer_a',
    name: 'Nike',
    status: 'ACTIVE',
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'retailer_admin',
    updatedBy: 'retailer_admin',
    ...overrides,
  };
}

function creative(overrides: Record<string, unknown> = {}) {
  return {
    creativeId: 'creative_nike',
    retailerId: 'retailer_a',
    partnerId: 'partner_nike',
    format: 'VIDEO',
    mediaUrl: 'https://example.com/nike.mp4',
    headline: 'Nike Air',
    destinationUrl: 'https://example.com/nike',
    status: 'ACTIVE',
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'retailer_admin',
    updatedBy: 'retailer_admin',
    ...overrides,
  };
}

function firestore(
  partnerData: Record<string, unknown> | undefined = partner(),
  creativeData: Record<string, unknown> | undefined = creative()
) {
  return {
    collection: jest.fn((name: string) => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(
          name === 'retailMediaPartners'
            ? {
                exists: partnerData !== undefined,
                data: () => partnerData,
              }
            : {
                exists: creativeData !== undefined,
                data: () => creativeData,
              }
        ),
      })),
    })),
  };
}

describe('resolveSponsoredMediaForProductionQr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveProductionQr.mockResolvedValue(resolvedQr());
  });

  it('resolves canonical QR, Partner and Creative identity', async () => {
    mockGetDb.mockReturnValue(firestore());

    const result = await resolveSponsoredMediaForProductionQr('qr_nike');

    expect(mockResolveProductionQr).toHaveBeenCalledWith('qr_nike');
    expect(result.qrContext.qr.retailerId).toBe('retailer_a');
    expect(result.partner.partnerId).toBe('partner_nike');
    expect(result.creative.creativeId).toBe('creative_nike');
  });

  it('rejects legacy sponsored media without Partner and Creative identity', async () => {
    mockGetDb.mockReturnValue(firestore());

    mockResolveProductionQr.mockResolvedValue(
      resolvedQr({
        format: 'VIDEO',
        sponsorName: 'Legacy Sponsor',
        mediaUrl: 'https://example.com/legacy.mp4',
      })
    );

    await expect(
      resolveSponsoredMediaForProductionQr('qr_legacy')
    ).rejects.toThrow('SPONSORED_MEDIA_NOT_MEASURABLE');
  });

  it('rejects cross-retailer Partner association', async () => {
    mockGetDb.mockReturnValue(
      firestore(partner({ retailerId: 'retailer_b' }))
    );

    await expect(
      resolveSponsoredMediaForProductionQr('qr_nike')
    ).rejects.toThrow('RETAIL_MEDIA_PARTNER_INTEGRITY_ERROR');
  });

  it('rejects cross-Partner Creative association', async () => {
    mockGetDb.mockReturnValue(
      firestore(partner(), creative({ partnerId: 'partner_puma' }))
    );

    await expect(
      resolveSponsoredMediaForProductionQr('qr_nike')
    ).rejects.toThrow('SPONSORED_CREATIVE_INTEGRITY_ERROR');
  });

  it('rejects inactive canonical resources', async () => {
    mockGetDb.mockReturnValue(
      firestore(partner(), creative({ status: 'RETIRED' }))
    );

    await expect(
      resolveSponsoredMediaForProductionQr('qr_nike')
    ).rejects.toThrow('SPONSORED_CREATIVE_INACTIVE');
  });

  it('rejects Creative presentation mismatch', async () => {
    mockGetDb.mockReturnValue(
      firestore(
        partner(),
        creative({ mediaUrl: 'https://example.com/wrong.mp4' })
      )
    );

    await expect(
      resolveSponsoredMediaForProductionQr('qr_nike')
    ).rejects.toThrow('SPONSORED_CREATIVE_PRESENTATION_MISMATCH');
  });

  it('rejects a sponsored creative headline mismatch', async () => {
    mockGetDb.mockReturnValue(
      firestore(
        partner(),
        creative({ headline: 'Different headline' })
      )
    );

    await expect(
      resolveSponsoredMediaForProductionQr('qr_nike')
    ).rejects.toThrow('SPONSORED_CREATIVE_PRESENTATION_MISMATCH');
  });

  it('rejects a sponsored creative destinationUrl mismatch', async () => {
    mockGetDb.mockReturnValue(
      firestore(
        partner(),
        creative({ destinationUrl: 'https://example.com/different' })
      )
    );

    await expect(
      resolveSponsoredMediaForProductionQr('qr_nike')
    ).rejects.toThrow('SPONSORED_CREATIVE_PRESENTATION_MISMATCH');
  });

});
