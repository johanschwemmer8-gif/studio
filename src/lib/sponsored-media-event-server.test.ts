import { admin, getDb } from './firebase-admin';
import { resolveProductionQr } from './qr-resolution';
import { recordSponsoredMediaEvent } from './sponsored-media-event-server';

jest.mock('./firebase-admin', () => ({
  admin: {
    firestore: {
      Timestamp: {
        now: jest.fn(),
      },
    },
  },
  getDb: jest.fn(),
}));

jest.mock('./qr-resolution', () => ({
  resolveProductionQr: jest.fn(),
}));

const mockGetDb = getDb as jest.Mock;
const mockResolveProductionQr = resolveProductionQr as jest.Mock;
const mockTimestampNow = admin.firestore.Timestamp.now as jest.Mock;

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

function resolvedQr(
  sponsoredMedia: Record<string, unknown> | undefined = {
    partnerId: 'partner_nike',
    creativeId: 'creative_nike_video',
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

function validPartner(overrides: Record<string, unknown> = {}) {
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

function validCreative(overrides: Record<string, unknown> = {}) {
  return {
    creativeId: 'creative_nike_video',
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
  partner: Record<string, unknown> | undefined = validPartner(),
  creative: Record<string, unknown> | undefined = validCreative()
) {
  const create = jest.fn().mockResolvedValue(undefined);

  const collection = jest.fn((name: string) => {
    if (name === 'retailMediaPartners') {
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: partner !== undefined,
            data: () => partner,
          }),
        })),
      };
    }

    if (name === 'sponsoredCreatives') {
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: creative !== undefined,
            data: () => creative,
          }),
        })),
      };
    }

    if (name === 'sponsoredMediaEvents') {
      return {
        doc: jest.fn(() => ({
          create,
        })),
      };
    }

    throw new Error(`Unexpected collection: ${name}`);
  });

  return {
    db: { collection },
    create,
  };
}

describe('recordSponsoredMediaEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTimestampNow.mockReturnValue(timestamp);
    mockResolveProductionQr.mockResolvedValue(resolvedQr());
  });

  it('records an impression using server-resolved canonical identity', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    const result = await recordSponsoredMediaEvent({
      qrId: 'qr_nike',
      eventType: 'IMPRESSION',
      presentationId: 'presentation_1',
    });

    expect(result.eventId).toMatch(/^sme_/);
    expect(mockResolveProductionQr).toHaveBeenCalledWith('qr_nike');

    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'IMPRESSION',
        presentationId: 'presentation_1',
        retailerId: 'retailer_a',
        campaignId: 'campaign_1',
        activationId: 'activation_1',
        deploymentId: 'deployment_1',
        qrCodeId: 'qr_nike',
        partnerId: 'partner_nike',
        creativeId: 'creative_nike_video',
        format: 'VIDEO',
        configurationVersion: 3,
        environment: 'PRODUCTION',
      })
    );
  });

  it('rejects client attempts to submit ELIGIBLE', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'ELIGIBLE' as never,
        presentationId: 'presentation_1',
      })
    ).rejects.toThrow();

    expect(store.create).not.toHaveBeenCalled();
  });

  it('does not measure legacy 15A sponsored media without canonical IDs', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    mockResolveProductionQr.mockResolvedValue(
      resolvedQr({
        format: 'VIDEO',
        sponsorName: 'Sunlight',
        mediaUrl: 'https://example.com/sunlight.mp4',
      })
    );

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_legacy',
        eventType: 'IMPRESSION',
        presentationId: 'presentation_legacy',
      })
    ).rejects.toThrow('SPONSORED_MEDIA_NOT_MEASURABLE');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('rejects an inactive Retail Media Partner', async () => {
    const store = firestore(validPartner({ status: 'INACTIVE' }));
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'IMPRESSION',
        presentationId: 'presentation_1',
      })
    ).rejects.toThrow('RETAIL_MEDIA_PARTNER_INACTIVE');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('rejects a Creative belonging to another Partner', async () => {
    const store = firestore(
      validPartner(),
      validCreative({ partnerId: 'partner_puma' })
    );
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'IMPRESSION',
        presentationId: 'presentation_1',
      })
    ).rejects.toThrow('SPONSORED_CREATIVE_INTEGRITY_ERROR');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('rejects an inactive Sponsored Creative', async () => {
    const store = firestore(
      validPartner(),
      validCreative({ status: 'RETIRED' })
    );
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'IMPRESSION',
        presentationId: 'presentation_1',
      })
    ).rejects.toThrow('SPONSORED_CREATIVE_INACTIVE');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('rejects presentation content that does not match the canonical Creative', async () => {
    const store = firestore(
      validPartner(),
      validCreative({ mediaUrl: 'https://example.com/different.mp4' })
    );
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'IMPRESSION',
        presentationId: 'presentation_1',
      })
    ).rejects.toThrow('SPONSORED_CREATIVE_PRESENTATION_MISMATCH');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('requires playbackOrdinal for video playback events', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'STARTED',
        presentationId: 'presentation_1',
      })
    ).rejects.toThrow('PLAYBACK_ORDINAL_REQUIRED');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('records a valid video completion with playback identity', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    await recordSponsoredMediaEvent({
      qrId: 'qr_nike',
      eventType: 'COMPLETED',
      presentationId: 'presentation_1',
      playbackOrdinal: 1,
    });

    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'COMPLETED',
        playbackOrdinal: 1,
      })
    );
  });

  it('rejects video-only events for a Brand Strip', async () => {
    mockResolveProductionQr.mockResolvedValue(
      resolvedQr({
        partnerId: 'partner_nike',
        creativeId: 'creative_nike_strip',
        format: 'BRAND_STRIP',
        sponsorName: 'Nike',
        mediaUrl: 'https://example.com/nike-strip.png',
      })
    );

    const store = firestore(
      validPartner(),
      validCreative({
        creativeId: 'creative_nike_strip',
        format: 'BRAND_STRIP',
        mediaUrl: 'https://example.com/nike-strip.png',
        headline: undefined,
        destinationUrl: undefined,
      })
    );
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'REPLAYED',
        presentationId: 'presentation_1',
        playbackOrdinal: 2,
      })
    ).rejects.toThrow('INVALID_SPONSORED_MEDIA_EVENT');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('does not create a shopper session or store shopper identity', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    await recordSponsoredMediaEvent({
      qrId: 'qr_nike',
      eventType: 'DISMISSED',
      presentationId: 'presentation_1',
    });

    const event = store.create.mock.calls[0][0];

    expect(event).not.toHaveProperty('sessionId');
    expect(event).not.toHaveProperty('shopperId');
    expect(event).not.toHaveProperty('shopperUid');
    expect(event).not.toHaveProperty('uid');
  });
});
