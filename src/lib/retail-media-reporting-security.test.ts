import { admin, getDb } from './firebase-admin';
import { getPartnerRetailMediaReport } from './retail-media-partner-reporting-server';

jest.mock('./firebase-admin', () => ({
  admin: {
    auth: jest.fn(),
  },
  getDb: jest.fn(),
}));

const mockGetDb = getDb as jest.Mock;
const mockAdmin = admin as unknown as {
  auth: jest.Mock;
};

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

function membership(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    membershipId: 'membership_nike_retailer_a',
    uid: 'nike_user',
    retailerId: 'retailer_a',
    partnerId: 'partner_nike',
    status: 'ACTIVE',
    permissions: {
      viewRetailMedia: true,
      exportRetailMedia: false,
    },
    createdAt: timestamp,
    createdBy: 'retailer_admin',
    updatedAt: timestamp,
    updatedBy: 'retailer_admin',
    ...overrides,
  };
}

function partner(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    partnerId: 'partner_nike',
    retailerId: 'retailer_a',
    name: 'Nike',
    status: 'ACTIVE',
    createdAt: timestamp,
    createdBy: 'retailer_admin',
    updatedAt: timestamp,
    updatedBy: 'retailer_admin',
    ...overrides,
  };
}

function sponsoredEvent(
  eventType: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    eventId: `event_${eventType}`,
    presentationId: 'presentation_nike_1',
    eventType,
    retailerId: 'retailer_a',
    campaignId: 'campaign_1',
    activationId: 'activation_nike',
    deploymentId: 'deployment_nike',
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

function verifiedNikeToken(): void {
  mockAdmin.auth.mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'nike_user',
    }),
  });
}

function integratedFirestore(options: {
  memberships?: Array<Record<string, unknown>>;
  partnerData?: Record<string, unknown> | null;
  events?: Array<Record<string, unknown>>;
} = {}) {
  const memberships =
    options.memberships === undefined
      ? [membership()]
      : options.memberships;

  const partnerData =
    options.partnerData === undefined
      ? partner()
      : options.partnerData;

  const events = options.events ?? [];

  const membershipGet = jest.fn().mockResolvedValue({
    empty: memberships.length === 0,
    docs: memberships.map(data => ({
      data: () => data,
    })),
  });

  const membershipThirdWhere = jest.fn(() => ({
    get: membershipGet,
  }));

  const membershipSecondWhere = jest.fn(() => ({
    where: membershipThirdWhere,
  }));

  const membershipFirstWhere = jest.fn(() => ({
    where: membershipSecondWhere,
  }));

  const partnerGet = jest.fn().mockResolvedValue({
    exists: partnerData !== null,
    data: () => partnerData ?? undefined,
  });

  const reportingGet = jest.fn().mockResolvedValue({
    docs: events.map((data, index) => ({
      id: `report_event_${index}`,
      data: () => data,
    })),
  });

  const reportingPartnerWhere = jest.fn(() => ({
    get: reportingGet,
  }));

  const reportingRetailerWhere = jest.fn(() => ({
    where: reportingPartnerWhere,
  }));

  const reportingCollection = {
    where: reportingRetailerWhere,
  };

  const collection = jest.fn((collectionName: string) => {
    if (collectionName === 'retailMediaPartnerMemberships') {
      return {
        where: membershipFirstWhere,
      };
    }

    if (collectionName === 'retailMediaPartners') {
      return {
        doc: jest.fn(() => ({
          get: partnerGet,
        })),
      };
    }

    if (collectionName === 'sponsoredMediaEvents') {
      return reportingCollection;
    }

    throw new Error(`Unexpected collection: ${collectionName}`);
  });

  mockGetDb.mockReturnValue({
    collection,
  });

  return {
    collection,
    reportingRetailerWhere,
    reportingPartnerWhere,
    reportingGet,
  };
}

describe('Retail Media reporting security integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifiedNikeToken();
  });

  it('allows Nike at Retailer A to retrieve only Nike-scoped reporting', async () => {
    const store = integratedFirestore({
      events: [
        sponsoredEvent('ELIGIBLE'),
        sponsoredEvent('IMPRESSION'),
      ],
    });

    const result = await getPartnerRetailMediaReport({
      idToken: 'nike-token',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
    });

    expect(store.reportingRetailerWhere).toHaveBeenCalledWith(
      'retailerId',
      '==',
      'retailer_a'
    );

    expect(store.reportingPartnerWhere).toHaveBeenCalledWith(
      'partnerId',
      '==',
      'partner_nike'
    );

    expect(result.retailerId).toBe('retailer_a');
    expect(result.partnerId).toBe('partner_nike');
    expect(result.metrics.eligible).toBe(1);
    expect(result.metrics.impressions).toBe(1);
  });

  it('DENIES Nike credentials requesting Puma reporting before sponsored-media reporting is queried', async () => {
    const store = integratedFirestore({
      memberships: [],
    });

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'nike-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_puma',
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner membership not found.'
    );

    expect(store.collection).not.toHaveBeenCalledWith(
      'sponsoredMediaEvents'
    );
    expect(store.reportingGet).not.toHaveBeenCalled();
  });

  it('DENIES Nike at Retailer A requesting Retailer B reporting before sponsored-media reporting is queried', async () => {
    const store = integratedFirestore({
      memberships: [],
    });

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'nike-token',
        retailerId: 'retailer_b',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner membership not found.'
    );

    expect(store.collection).not.toHaveBeenCalledWith(
      'sponsoredMediaEvents'
    );
    expect(store.reportingGet).not.toHaveBeenCalled();
  });

  it('DENIES an inactive Partner membership before reporting data is queried', async () => {
    const store = integratedFirestore({
      memberships: [
        membership({
          status: 'INACTIVE',
        }),
      ],
    });

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'nike-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner membership is inactive.'
    );

    expect(store.collection).not.toHaveBeenCalledWith(
      'sponsoredMediaEvents'
    );
    expect(store.reportingGet).not.toHaveBeenCalled();
  });

  it('DENIES an inactive Partner before reporting data is queried', async () => {
    const store = integratedFirestore({
      partnerData: partner({
        status: 'INACTIVE',
      }),
    });

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'nike-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner is inactive.'
    );

    expect(store.collection).not.toHaveBeenCalledWith(
      'sponsoredMediaEvents'
    );
    expect(store.reportingGet).not.toHaveBeenCalled();
  });

  it('DENIES missing viewRetailMedia permission before reporting data is queried', async () => {
    const store = integratedFirestore({
      memberships: [
        membership({
          permissions: {
            viewRetailMedia: false,
            exportRetailMedia: false,
          },
        }),
      ],
    });

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'nike-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner permission is not granted.'
    );

    expect(store.collection).not.toHaveBeenCalledWith(
      'sponsoredMediaEvents'
    );
    expect(store.reportingGet).not.toHaveBeenCalled();
  });

  it('fails closed if a reporting query returns a competing Partner event', async () => {
    integratedFirestore({
      events: [
        sponsoredEvent('IMPRESSION', {
          partnerId: 'partner_puma',
          activationId: 'activation_puma',
          qrCodeId: 'qr_puma',
          creativeId: 'creative_puma',
        }),
      ],
    });

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'nike-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'SPONSORED_MEDIA_EVENT_SCOPE_MISMATCH'
    );
  });

  it('fails closed if a reporting query returns another retailer event', async () => {
    integratedFirestore({
      events: [
        sponsoredEvent('IMPRESSION', {
          retailerId: 'retailer_b',
        }),
      ],
    });

    await expect(
      getPartnerRetailMediaReport({
        idToken: 'nike-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
      })
    ).rejects.toThrow(
      'SPONSORED_MEDIA_EVENT_SCOPE_MISMATCH'
    );
  });
});
