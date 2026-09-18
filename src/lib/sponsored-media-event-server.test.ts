import { admin, getDb } from './firebase-admin';
import { resolveProductionQr } from './qr-resolution';
import {
  recordSponsoredMediaEvent,
} from './sponsored-media-event-server';

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

function validEligibleEvent(
  overrides: Record<string, unknown> = {}
) {
  return {
    eventId: 'eligible-event-id-replaced-by-harness',
    presentationId: 'smp_test_presentation',
    eventType: 'ELIGIBLE',
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
    timestamp,
    ...overrides,
  };
}

function firestore(
  partner: Record<string, unknown> | undefined = validPartner(),
  creative: Record<string, unknown> | undefined = validCreative(),
  eligible: Record<string, unknown> | null = validEligibleEvent(),
  existingObservedEvent?: Record<string, unknown>
) {
  const create = jest.fn();
  const eventRefs = new Map<string, { id: string }>();

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
        doc: jest.fn((id: string) => {
          const ref = { id };
          eventRefs.set(id, ref);
          return ref;
        }),
      };
    }

    throw new Error(`Unexpected collection: ${name}`);
  });

  const transaction = {
    get: jest.fn(async (ref: { id: string }) => {
      if (ref.id.startsWith('sme_eligible_')) {
        const eligibleWithActualId =
          eligible === null
            ? undefined
            : {
                ...eligible,
                eventId: ref.id,
              };

        return {
          exists: eligibleWithActualId !== undefined,
          data: () => eligibleWithActualId,
        };
      }

      if (ref.id.startsWith('sme_event_')) {
        return {
          exists: existingObservedEvent !== undefined,
          data: () => existingObservedEvent,
        };
      }

      throw new Error(`Unexpected event ref: ${ref.id}`);
    }),
    create,
  };

  const runTransaction = jest.fn(
    async (callback: (tx: any) => unknown) =>
      callback(transaction)
  );

  return {
    db: {
      collection,
      runTransaction,
    },
    create,
    transaction,
    runTransaction,
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
      presentationId: 'smp_test_presentation',
    });

    expect(result.eventId).toMatch(/^sme_/);
    expect(mockResolveProductionQr).toHaveBeenCalledWith('qr_nike');

    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^sme_event_[a-f0-9]{64}$/),
      }),
      expect.objectContaining({
        eventType: 'IMPRESSION',
        presentationId: 'smp_test_presentation',
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
        presentationId: 'smp_test_presentation',
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
        presentationId: 'smp_test_presentation',
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
        presentationId: 'smp_test_presentation',
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
        presentationId: 'smp_test_presentation',
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
        presentationId: 'smp_test_presentation',
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
        presentationId: 'smp_test_presentation',
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
      presentationId: 'smp_test_presentation',
      playbackOrdinal: 1,
    });

    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^sme_event_[a-f0-9]{64}$/),
      }),
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
        presentationId: 'smp_test_presentation',
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
      presentationId: 'smp_test_presentation',
    });

    const event = store.create.mock.calls[0][1];

    expect(event).not.toHaveProperty('sessionId');
    expect(event).not.toHaveProperty('shopperId');
    expect(event).not.toHaveProperty('shopperUid');
    expect(event).not.toHaveProperty('uid');
  });

  it('rejects a presentationId that was never established server-side', async () => {
    const store = firestore(
      validPartner(),
      validCreative(),
      null
    );
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'IMPRESSION',
        presentationId: 'smp_forged_presentation',
      })
    ).rejects.toThrow('SPONSORED_MEDIA_PRESENTATION_NOT_ESTABLISHED');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('rejects an established presentation whose canonical context no longer matches', async () => {
    const store = firestore(
      validPartner(),
      validCreative(),
      validEligibleEvent({
        campaignId: 'campaign_other',
      })
    );
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'IMPRESSION',
        presentationId: 'smp_test_presentation',
      })
    ).rejects.toThrow('SPONSORED_MEDIA_PRESENTATION_CONTEXT_MISMATCH');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('returns the same deterministic eventId without creating a duplicate measurement', async () => {
    const firstStore = firestore();
    mockGetDb.mockReturnValue(firstStore.db);

    const first = await recordSponsoredMediaEvent({
      qrId: 'qr_nike',
      eventType: 'IMPRESSION',
      presentationId: 'smp_test_presentation',
    });

    expect(firstStore.create).toHaveBeenCalledTimes(1);

    const firstEvent = firstStore.create.mock.calls[0][1];

    const retryStore = firestore(
      validPartner(),
      validCreative(),
      validEligibleEvent(),
      firstEvent
    );
    mockGetDb.mockReturnValue(retryStore.db);

    const retry = await recordSponsoredMediaEvent({
      qrId: 'qr_nike',
      eventType: 'IMPRESSION',
      presentationId: 'smp_test_presentation',
    });

    expect(retry.eventId).toBe(first.eventId);
    expect(retryStore.create).not.toHaveBeenCalled();
  });

  it('rejects REPLAYED for the initial playback ordinal', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    await expect(
      recordSponsoredMediaEvent({
        qrId: 'qr_nike',
        eventType: 'REPLAYED',
        presentationId: 'smp_test_presentation',
        playbackOrdinal: 1,
      })
    ).rejects.toThrow('INVALID_REPLAY_PLAYBACK_ORDINAL');

    expect(store.create).not.toHaveBeenCalled();
  });

  it('records REPLAYED for a deliberate subsequent playback', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    await recordSponsoredMediaEvent({
      qrId: 'qr_nike',
      eventType: 'REPLAYED',
      presentationId: 'smp_test_presentation',
      playbackOrdinal: 2,
    });

    expect(store.create).toHaveBeenCalledTimes(1);
    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^sme_event_[a-f0-9]{64}$/),
      }),
      expect.objectContaining({
        eventType: 'REPLAYED',
        presentationId: 'smp_test_presentation',
        playbackOrdinal: 2,
      })
    );
  });
});
