import {
  createSponsoredCreative,
  listSponsoredCreatives,
} from './sponsored-creative-server';
import { verifyAuth } from './auth-server';
import { getDb } from './firebase-admin';

jest.mock('./auth-server', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('./firebase-admin', () => ({
  getDb: jest.fn(),
  admin: {
    firestore: {
      Timestamp: {
        now: jest.fn(() => ({
          seconds: 100,
          nanoseconds: 0,
          toDate: () => new Date(100000),
        })),
      },
    },
  },
}));

const mockVerifyAuth = verifyAuth as jest.MockedFunction<typeof verifyAuth>;
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

const retailerAuth = {
  uid: 'retailer-user-1',
  email: 'retailer@example.com',
  retailerId: 'retailer-a',
  role: 'networkAdmin' as const,
  scope: {
    level: 'network' as const,
  },
  permissions: {
    dashboard: true,
    roi: true,
    visualsReporting: true,
    realTime: true,
    abTesting: true,
    systemIntegration: true,
    retailMediaNetwork: true,
    manageUsers: true,
    manageOrganization: true,
    approve: true,
    export: true,
  },
  isActive: true,
};

const partner = {
  partnerId: 'partner-nike',
  retailerId: 'retailer-a',
  name: 'Nike',
  status: 'ACTIVE' as const,
  createdAt: {
    seconds: 1,
    nanoseconds: 0,
    toDate: () => new Date(1000),
  },
  createdBy: 'creator-1',
  updatedAt: {
    seconds: 1,
    nanoseconds: 0,
    toDate: () => new Date(1000),
  },
  updatedBy: 'creator-1',
};

const creative = {
  creativeId: 'creative-air-jordan',
  retailerId: 'retailer-a',
  partnerId: 'partner-nike',
  format: 'VIDEO' as const,
  mediaUrl: 'https://example.com/air-jordan.mp4',
  headline: 'Air Jordan',
  status: 'DRAFT' as const,
  createdAt: {
    seconds: 1,
    nanoseconds: 0,
    toDate: () => new Date(1000),
  },
  createdBy: 'creator-1',
  updatedAt: {
    seconds: 1,
    nanoseconds: 0,
    toDate: () => new Date(1000),
  },
  updatedBy: 'creator-1',
};

describe('Sponsored Creative retailer service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a DRAFT Creative beneath an authorized Partner', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const creativeSet = jest.fn().mockResolvedValue(undefined);

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => partner,
            }),
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          doc: jest.fn(() => ({
            id: 'creative-generated-1',
            set: creativeSet,
          })),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({ collection } as any);

    const result = await createSponsoredCreative({
      idToken: 'token',
      partnerId: 'partner-nike',
      format: 'VIDEO',
      mediaUrl: 'https://example.com/ad.mp4',
      headline: 'Air Jordan',
    });

    expect(creativeSet).toHaveBeenCalledWith(
      expect.objectContaining({
        creativeId: 'creative-generated-1',
        retailerId: 'retailer-a',
        partnerId: 'partner-nike',
        format: 'VIDEO',
        status: 'DRAFT',
        createdBy: 'retailer-user-1',
        updatedBy: 'retailer-user-1',
      })
    );

    expect(result.status).toBe('DRAFT');
    expect(result.retailerId).toBe('retailer-a');
    expect(result.partnerId).toBe('partner-nike');
  });

  it('denies creation beneath another retailer Partner', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const creativeSet = jest.fn();

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                ...partner,
                retailerId: 'retailer-b',
              }),
            }),
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          doc: jest.fn(() => ({
            id: 'should-not-exist',
            set: creativeSet,
          })),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({ collection } as any);

    await expect(
      createSponsoredCreative({
        idToken: 'token',
        partnerId: 'partner-nike',
        format: 'VIDEO',
        mediaUrl: 'https://example.com/ad.mp4',
      })
    ).rejects.toThrow('RETAIL_MEDIA_PARTNER_SCOPE_MISMATCH');

    expect(creativeSet).not.toHaveBeenCalled();
  });

  it('omits absent optional presentation fields from the Firestore create document', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const set = jest.fn().mockResolvedValue(undefined);
    const creativeDoc = jest.fn(() => ({
      id: 'creative-no-optionals',
      set,
    }));

    const partnerGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => partner,
    });

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: partnerGet,
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          doc: creativeDoc,
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({
      collection,
    } as any);

    await createSponsoredCreative({
      idToken: 'token',
      partnerId: 'partner-nike',
      format: 'VIDEO',
      mediaUrl: 'https://example.com/nike.mp4',
    });

    const written = set.mock.calls[0][0];

    expect(written).not.toHaveProperty('headline');
    expect(written).not.toHaveProperty('destinationUrl');
  });

  it('denies creation without Retail Media permission', async () => {
    mockVerifyAuth.mockResolvedValue({
      ...retailerAuth,
      permissions: {
        ...retailerAuth.permissions,
        retailMediaNetwork: false,
      },
    });

    await expect(
      createSponsoredCreative({
        idToken: 'token',
        partnerId: 'partner-nike',
        format: 'VIDEO',
        mediaUrl: 'https://example.com/ad.mp4',
      })
    ).rejects.toThrow('RETAIL_MEDIA_PERMISSION_REQUIRED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('lists only Creatives belonging to both retailer and Partner', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const wherePartner = jest.fn(() => ({
      get: jest.fn().mockResolvedValue({
        docs: [
          {
            id: 'creative-air-jordan',
            data: () => creative,
          },
        ],
      }),
    }));

    const whereRetailer = jest.fn(() => ({
      where: wherePartner,
    }));

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => partner,
            }),
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          where: whereRetailer,
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({ collection } as any);

    const result = await listSponsoredCreatives({
      idToken: 'token',
      partnerId: 'partner-nike',
    });

    expect(whereRetailer).toHaveBeenCalledWith(
      'retailerId',
      '==',
      'retailer-a'
    );
    expect(wherePartner).toHaveBeenCalledWith(
      'partnerId',
      '==',
      'partner-nike'
    );

    expect(result).toHaveLength(1);
    expect(result[0].creativeId).toBe('creative-air-jordan');
  });

  it('fails closed if returned Creative scope is inconsistent', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const wherePartner = jest.fn(() => ({
      get: jest.fn().mockResolvedValue({
        docs: [
          {
            id: 'creative-air-jordan',
            data: () => ({
              ...creative,
              partnerId: 'partner-puma',
            }),
          },
        ],
      }),
    }));

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => partner,
            }),
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          where: jest.fn(() => ({
            where: wherePartner,
          })),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({ collection } as any);

    await expect(
      listSponsoredCreatives({
        idToken: 'token',
        partnerId: 'partner-nike',
      })
    ).rejects.toThrow(
      'SPONSORED_CREATIVE_SCOPE_MISMATCH: creative-air-jordan'
    );
  });

  it('fails closed when stored Creative identity differs from document identity', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const wherePartner = jest.fn(() => ({
      get: jest.fn().mockResolvedValue({
        docs: [
          {
            id: 'creative-air-jordan',
            data: () => ({
              ...creative,
              creativeId: 'creative-other',
            }),
          },
        ],
      }),
    }));

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => partner,
            }),
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          where: jest.fn(() => ({
            where: wherePartner,
          })),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({ collection } as any);

    await expect(
      listSponsoredCreatives({
        idToken: 'token',
        partnerId: 'partner-nike',
      })
    ).rejects.toThrow(
      'SPONSORED_CREATIVE_IDENTITY_MISMATCH: creative-air-jordan'
    );
  });
});

describe('Sponsored Creative controlled lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockCreativeDocument(
    storedCreative: Record<string, unknown> = creative
  ) {
    const set = jest.fn().mockResolvedValue(undefined);

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => partner,
            }),
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => storedCreative,
            }),
            set,
          })),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({ collection } as any);

    return { set };
  }

  it('allows shopper-facing fields to change while Creative is DRAFT', async () => {
    const { updateDraftSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);
    const { set } = mockCreativeDocument();

    const result = await updateDraftSponsoredCreative({
      idToken: 'token',
      creativeId: 'creative-air-jordan',
      partnerId: 'partner-nike',
      format: 'BRAND_STRIP',
      mediaUrl: 'https://example.com/air-jordan-strip.png',
      headline: 'New Air Jordan',
      destinationUrl: 'https://example.com/air-jordan',
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        creativeId: 'creative-air-jordan',
        retailerId: 'retailer-a',
        partnerId: 'partner-nike',
        status: 'DRAFT',
        format: 'BRAND_STRIP',
        mediaUrl: 'https://example.com/air-jordan-strip.png',
        headline: 'New Air Jordan',
        updatedBy: 'retailer-user-1',
      })
    );

    expect(result.status).toBe('DRAFT');
  });

  it('prevents shopper-facing edits once Creative is ACTIVE', async () => {
    const { updateDraftSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const { set } = mockCreativeDocument({
      ...creative,
      status: 'ACTIVE',
    });

    await expect(
      updateDraftSponsoredCreative({
        idToken: 'token',
        creativeId: 'creative-air-jordan',
        partnerId: 'partner-nike',
        format: 'VIDEO',
        mediaUrl: 'https://example.com/replacement.mp4',
      })
    ).rejects.toThrow('SPONSORED_CREATIVE_NOT_EDITABLE');

    expect(set).not.toHaveBeenCalled();
  });

  it('removes omitted optional presentation fields without writing undefined values', async () => {
    const { updateDraftSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const storedCreative = {
      ...creative,
      headline: 'Air Jordan',
      destinationUrl: 'https://www.nike.com/air-jordan',
    };

    const set = jest.fn().mockResolvedValue(undefined);

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => partner,
            }),
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => storedCreative,
            }),
            set,
          })),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({ collection } as any);

    await updateDraftSponsoredCreative({
      idToken: 'token',
      creativeId: 'creative-air-jordan',
      partnerId: 'partner-nike',
      format: 'VIDEO',
      mediaUrl: 'https://example.com/air-jordan-v2.mp4',
    });

    const written = set.mock.calls[0][0];

    expect(written).not.toHaveProperty('headline');
    expect(written).not.toHaveProperty('destinationUrl');
  });

  it('activates only a DRAFT Creative', async () => {
    const { activateSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);
    const { set } = mockCreativeDocument();

    const result = await activateSponsoredCreative({
      idToken: 'token',
      creativeId: 'creative-air-jordan',
      partnerId: 'partner-nike',
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        creativeId: 'creative-air-jordan',
        retailerId: 'retailer-a',
        partnerId: 'partner-nike',
        status: 'ACTIVE',
      })
    );

    expect(result.status).toBe('ACTIVE');
  });

  it('prevents ACTIVE to ACTIVE lifecycle activation', async () => {
    const { activateSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const { set } = mockCreativeDocument({
      ...creative,
      status: 'ACTIVE',
    });

    await expect(
      activateSponsoredCreative({
        idToken: 'token',
        creativeId: 'creative-air-jordan',
        partnerId: 'partner-nike',
      })
    ).rejects.toThrow('SPONSORED_CREATIVE_CANNOT_ACTIVATE');

    expect(set).not.toHaveBeenCalled();
  });

  it('retires an ACTIVE Creative and records retirement audit fields', async () => {
    const { retireSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const { set } = mockCreativeDocument({
      ...creative,
      status: 'ACTIVE',
    });

    const result = await retireSponsoredCreative({
      idToken: 'token',
      creativeId: 'creative-air-jordan',
      partnerId: 'partner-nike',
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        creativeId: 'creative-air-jordan',
        retailerId: 'retailer-a',
        partnerId: 'partner-nike',
        status: 'RETIRED',
        retiredBy: 'retailer-user-1',
        updatedBy: 'retailer-user-1',
      })
    );

    expect(result.status).toBe('RETIRED');
    expect(result.retiredAt).toBeDefined();
  });

  it('treats RETIRED as terminal', async () => {
    const { retireSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const { set } = mockCreativeDocument({
      ...creative,
      status: 'RETIRED',
      retiredAt: creative.updatedAt,
      retiredBy: 'retailer-user-1',
    });

    await expect(
      retireSponsoredCreative({
        idToken: 'token',
        creativeId: 'creative-air-jordan',
        partnerId: 'partner-nike',
      })
    ).rejects.toThrow('SPONSORED_CREATIVE_ALREADY_RETIRED');

    expect(set).not.toHaveBeenCalled();
  });

  it('denies Creative mutation through another Partner identity', async () => {
    const { activateSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const set = jest.fn();

    const collection = jest.fn((name: string) => {
      if (name === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                ...partner,
                partnerId: 'partner-puma',
                name: 'Puma',
              }),
            }),
          })),
        };
      }

      if (name === 'sponsoredCreatives') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn(),
            set,
          })),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockGetDb.mockReturnValue({ collection } as any);

    await expect(
      activateSponsoredCreative({
        idToken: 'token',
        creativeId: 'creative-air-jordan',
        partnerId: 'partner-nike',
      })
    ).rejects.toThrow('RETAIL_MEDIA_PARTNER_IDENTITY_MISMATCH');

    expect(set).not.toHaveBeenCalled();
  });

  it('denies Creative mutation when stored Creative belongs to another Partner', async () => {
    const { activateSponsoredCreative } = await import(
      './sponsored-creative-server'
    );

    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const { set } = mockCreativeDocument({
      ...creative,
      partnerId: 'partner-puma',
    });

    await expect(
      activateSponsoredCreative({
        idToken: 'token',
        creativeId: 'creative-air-jordan',
        partnerId: 'partner-nike',
      })
    ).rejects.toThrow('SPONSORED_CREATIVE_SCOPE_MISMATCH');

    expect(set).not.toHaveBeenCalled();
  });
});
