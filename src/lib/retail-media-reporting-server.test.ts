import { getDb } from './firebase-admin';
import { verifyAuth } from './auth-server';
import { getRetailerRetailMediaReport } from './retail-media-reporting-server';

jest.mock('./firebase-admin', () => ({
  getDb: jest.fn(),
}));

jest.mock('./auth-server', () => ({
  verifyAuth: jest.fn(),
}));

const mockGetDb = getDb as jest.Mock;
const mockVerifyAuth = verifyAuth as jest.Mock;

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

function authorizedContext(
  overrides: Record<string, unknown> = {}
) {
  return {
    uid: 'retailer_user',
    retailerId: 'retailer_a',
    role: 'networkAdmin',
    scope: {
      level: 'network',
      networkId: 'network_a',
    },
    permissions: {
      dashboard: true,
      roi: false,
      visualsReporting: true,
      realTime: true,
      abTesting: false,
      systemIntegration: false,
      retailMediaNetwork: true,
      manageUsers: false,
      manageOrganization: false,
      approve: false,
      export: false,
    },
    isActive: true,
    ...overrides,
  };
}

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
    activationId: 'activation_1',
    deploymentId: 'deployment_1',
    qrCodeId: 'qr_1',
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

  const where = jest.fn().mockReturnValue({ get });
  const collection = jest.fn().mockReturnValue({ where });

  return {
    db: { collection },
    collection,
    where,
    get,
  };
}

describe('getRetailerRetailMediaReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAuth.mockResolvedValue(authorizedContext());
  });

  it('queries canonical events using only the authoritative retailer scope', async () => {
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

    const result = await getRetailerRetailMediaReport({
      idToken: 'token',
    });

    expect(store.collection).toHaveBeenCalledWith(
      'sponsoredMediaEvents'
    );

    expect(store.where).toHaveBeenCalledWith(
      'retailerId',
      '==',
      'retailer_a'
    );

    expect(result.retailerId).toBe('retailer_a');
    expect(result.metrics.eligible).toBe(1);
    expect(result.metrics.impressions).toBe(1);
    expect(result.metrics.deliveryRate).toBe(1);
  });

  it('denies an authentication failure before querying reporting data', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication failed.',
    });

    await expect(
      getRetailerRetailMediaReport({ idToken: 'bad-token' })
    ).rejects.toThrow('AUTHENTICATION_FAILED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('denies an inactive retailer user', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({ isActive: false })
    );

    await expect(
      getRetailerRetailMediaReport({ idToken: 'token' })
    ).rejects.toThrow('ACCESS_DENIED: Retailer user is inactive.');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('fails closed when authoritative retailer scope is missing', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({ retailerId: undefined })
    );

    await expect(
      getRetailerRetailMediaReport({ idToken: 'token' })
    ).rejects.toThrow(
      'ACCESS_DENIED: Authoritative retailer scope is missing.'
    );

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('requires Retail Media Network permission', async () => {
    mockVerifyAuth.mockResolvedValue(
      authorizedContext({
        permissions: {
          ...authorizedContext().permissions,
          retailMediaNetwork: false,
        },
      })
    );

    await expect(
      getRetailerRetailMediaReport({ idToken: 'token' })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Network permission is required.'
    );

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('fails closed on malformed canonical event data', async () => {
    const store = firestore([
      {
        id: 'malformed_event',
        data: {
          retailerId: 'retailer_a',
          eventType: 'IMPRESSION',
        },
      },
    ]);

    mockGetDb.mockReturnValue(store.db);

    await expect(
      getRetailerRetailMediaReport({ idToken: 'token' })
    ).rejects.toThrow(
      'SPONSORED_MEDIA_EVENT_INTEGRITY_ERROR: malformed_event'
    );
  });

  it('fails closed if returned event scope contradicts the authorized retailer', async () => {
    const store = firestore([
      {
        id: 'wrong_retailer_event',
        data: sponsoredEvent('IMPRESSION', {
          retailerId: 'retailer_b',
        }),
      },
    ]);

    mockGetDb.mockReturnValue(store.db);

    await expect(
      getRetailerRetailMediaReport({ idToken: 'token' })
    ).rejects.toThrow(
      'SPONSORED_MEDIA_EVENT_SCOPE_MISMATCH: wrong_retailer_event'
    );
  });

  it('does not return financial or commerce metrics', async () => {
    const store = firestore([]);
    mockGetDb.mockReturnValue(store.db);

    const result = await getRetailerRetailMediaReport({
      idToken: 'token',
    });

    expect(result.metrics).not.toHaveProperty('revenue');
    expect(result.metrics).not.toHaveProperty('turnover');
    expect(result.metrics).not.toHaveProperty('conversions');
    expect(result.metrics).not.toHaveProperty('margin');
    expect(result.metrics).not.toHaveProperty('roi');
  });
});
