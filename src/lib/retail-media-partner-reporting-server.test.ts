import { getDb } from './firebase-admin';
import { verifyRetailMediaPartnerAccess } from './retail-media-auth-server';
import { getPartnerRetailMediaReport } from './retail-media-partner-reporting-server';

jest.mock('./firebase-admin', () => ({
  getDb: jest.fn(),
}));

jest.mock('./retail-media-auth-server', () => ({
  verifyRetailMediaPartnerAccess: jest.fn(),
}));

const mockGetDb = getDb as jest.Mock;
const mockVerifyPartnerAccess =
  verifyRetailMediaPartnerAccess as jest.Mock;

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

function sponsoredEvent(
  eventType: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    eventId: `event_${eventType}`,
    presentationId: 'presentation_1',
    eventType,
    retailerId: 'retailer_a',
    campaignId: 'campaign_1',
    activationId: 'activation_nike',
    deploymentId: 'deployment_1',
    qrCodeId: 'qr_nike',
    partnerId: 'partner_nike',
    creativeId: 'creative_nike',
    format: 'VIDEO',
    configurationVersion: 1,
    environment: 'PRODUCTION',
    timestamp,
    ...overrides,
  };
}

function firestore(
  docs: Array<{ id: string; data: Record<string, unknown> }>
) {
  const get = jest.fn().mockResolvedValue({
    docs: docs.map(item => ({
      id: item.id,
      data: () => item.data,
    })),
  });

  const partnerWhere = jest.fn().mockReturnValue({ get });
  const retailerWhere = jest.fn().mockReturnValue({
    where: partnerWhere,
  });
  const collection = jest.fn().mockReturnValue({
    where: retailerWhere,
  });

  return {
    db: { collection },
    collection,
    retailerWhere,
    partnerWhere,
    get,
  };
}

describe('getPartnerRetailMediaReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyPartnerAccess.mockResolvedValue({
      uid: 'nike_user',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
      membershipId: 'membership_nike_a',
    });
  });

  it('requires the canonical Partner reporting permission and requested scope', async () => {
    const store = firestore([]);
    mockGetDb.mockReturnValue(store.db);

    await getPartnerRetailMediaReport({
      idToken: 'token',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
    });

    expect(mockVerifyPartnerAccess).toHaveBeenCalledWith({
      idToken: 'token',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
      permission: 'viewRetailMedia',
      resource: {
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      },
    });
  });

  it('queries reporting data by BOTH authorized retailer and Partner scope', async () => {
    const store = firestore([
      {
        id: 'eligible_1',
        data: sponsoredEvent('ELIGIBLE'),
      },
      {
        id: 'impression_1',
        data: sponsoredEvent('IMPRESSION'),
      },
    ]);

    mockGetDb.mockReturnValue(store.db);

    const result = await getPartnerRetailMediaReport({
      idToken: 'token',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
    });

    expect(store.collection).toHaveBeenCalledWith(
      'sponsoredMediaEvents'
    );

    expect(store.retailerWhere).toHaveBeenCalledWith(
      'retailerId',
      '==',
      'retailer_a'
    );

    expect(store.partnerWhere).toHaveBeenCalledWith(
      'partnerId',
      '==',
      'partner_nike'
    );

    expect(result.retailerId).toBe('retailer_a');
    expect(result.partnerId).toBe('partner_nike');
    expect(result.metrics.eligible).toBe(1);
    expect(result.metrics.impressions).toBe(1);
  });

  it('does not query reporting data when Partner authorization is denied', async () => {
    mockVerifyPartnerAccess.mockRejectedValue(
      new Error(
        'ACCESS_DENIED: Retail Media Partner membership not found.'
      )
    );

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'nike-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_puma',
      })
    ).rejects.toThrow('ACCESS_DENIED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('uses authorized scope returned by the verifier rather than raw client scope', async () => {
    mockVerifyPartnerAccess.mockResolvedValue({
      uid: 'nike_user',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
      membershipId: 'membership_nike_a',
    });

    const store = firestore([]);
    mockGetDb.mockReturnValue(store.db);

    const result = await getPartnerRetailMediaReport({
      idToken: 'token',
      retailerId: 'requested_retailer',
      partnerId: 'requested_partner',
    });

    expect(store.retailerWhere).toHaveBeenCalledWith(
      'retailerId',
      '==',
      'retailer_a'
    );

    expect(store.partnerWhere).toHaveBeenCalledWith(
      'partnerId',
      '==',
      'partner_nike'
    );

    expect(result.retailerId).toBe('retailer_a');
    expect(result.partnerId).toBe('partner_nike');
  });

  it('fails closed on malformed canonical event data', async () => {
    const store = firestore([
      {
        id: 'malformed_event',
        data: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
          eventType: 'IMPRESSION',
        },
      },
    ]);

    mockGetDb.mockReturnValue(store.db);

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'SPONSORED_MEDIA_EVENT_INTEGRITY_ERROR: malformed_event'
    );
  });

  it('fails closed if returned event belongs to another Partner', async () => {
    const store = firestore([
      {
        id: 'puma_event',
        data: sponsoredEvent('IMPRESSION', {
          partnerId: 'partner_puma',
        }),
      },
    ]);

    mockGetDb.mockReturnValue(store.db);

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'SPONSORED_MEDIA_EVENT_SCOPE_MISMATCH: puma_event'
    );
  });

  it('fails closed if returned event belongs to another retailer', async () => {
    const store = firestore([
      {
        id: 'other_retailer_event',
        data: sponsoredEvent('IMPRESSION', {
          retailerId: 'retailer_b',
        }),
      },
    ]);

    mockGetDb.mockReturnValue(store.db);

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'SPONSORED_MEDIA_EVENT_SCOPE_MISMATCH: other_retailer_event'
    );
  });

  it('does not expose commerce or retailer financial metrics', async () => {
    const store = firestore([]);
    mockGetDb.mockReturnValue(store.db);

    const result = await getPartnerRetailMediaReport({
      idToken: 'token',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
    });

    expect(result.metrics).not.toHaveProperty('revenue');
    expect(result.metrics).not.toHaveProperty('turnover');
    expect(result.metrics).not.toHaveProperty('conversions');
    expect(result.metrics).not.toHaveProperty('margin');
    expect(result.metrics).not.toHaveProperty('profit');
    expect(result.metrics).not.toHaveProperty('roi');
  });
});
