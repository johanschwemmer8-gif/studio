import {
  createRetailMediaPartner,
  listRetailMediaPartners,
} from './retail-media-partner-server';
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

describe('Retail Media Partner retailer service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a Partner only inside the authoritative retailer scope', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const set = jest.fn().mockResolvedValue(undefined);
    const doc = jest.fn(() => ({
      id: 'partner-generated-1',
      set,
    }));
    const collection = jest.fn(() => ({
      doc,
    }));

    mockGetDb.mockReturnValue({
      collection,
    } as any);

    const result = await createRetailMediaPartner({
      idToken: 'token',
      name: 'Nike',
      websiteUrl: 'https://www.nike.com',
    });

    expect(collection).toHaveBeenCalledWith('retailMediaPartners');
    expect(doc).toHaveBeenCalledWith();

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerId: 'partner-generated-1',
        retailerId: 'retailer-a',
        name: 'Nike',
        status: 'ACTIVE',
        createdBy: 'retailer-user-1',
        updatedBy: 'retailer-user-1',
      })
    );

    expect(result.partnerId).toBe('partner-generated-1');
    expect(result.retailerId).toBe('retailer-a');
  });

  it('does not accept retailerId from the browser', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const set = jest.fn().mockResolvedValue(undefined);
    const collection = jest.fn(() => ({
      doc: jest.fn(() => ({
        id: 'partner-generated-2',
        set,
      })),
    }));

    mockGetDb.mockReturnValue({
      collection,
    } as any);

    await createRetailMediaPartner({
      idToken: 'token',
      name: 'Nike',
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        retailerId: 'retailer-a',
      })
    );
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
      createRetailMediaPartner({
        idToken: 'token',
        name: 'Nike',
      })
    ).rejects.toThrow('RETAIL_MEDIA_PERMISSION_REQUIRED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('lists only the authoritative retailer Partner scope', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const get = jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'partner-1',
          data: () => ({
            partnerId: 'partner-1',
            retailerId: 'retailer-a',
            name: 'Nike',
            status: 'ACTIVE',
            createdAt: {
              seconds: 1,
              nanoseconds: 0,
              toDate: () => new Date(1000),
            },
            createdBy: 'user-1',
            updatedAt: {
              seconds: 1,
              nanoseconds: 0,
              toDate: () => new Date(1000),
            },
            updatedBy: 'user-1',
          }),
        },
      ],
    });

    const where = jest.fn(() => ({
      get,
    }));

    const collection = jest.fn(() => ({
      where,
    }));

    mockGetDb.mockReturnValue({
      collection,
    } as any);

    const result = await listRetailMediaPartners({
      idToken: 'token',
    });

    expect(collection).toHaveBeenCalledWith('retailMediaPartners');
    expect(where).toHaveBeenCalledWith(
      'retailerId',
      '==',
      'retailer-a'
    );

    expect(result).toHaveLength(1);
    expect(result[0].partnerId).toBe('partner-1');
  });

  it('fails closed if a returned Partner belongs to another retailer', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const get = jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'partner-puma',
          data: () => ({
            partnerId: 'partner-puma',
            retailerId: 'retailer-b',
            name: 'Puma',
            status: 'ACTIVE',
            createdAt: {
              seconds: 1,
              nanoseconds: 0,
              toDate: () => new Date(1000),
            },
            createdBy: 'user-2',
            updatedAt: {
              seconds: 1,
              nanoseconds: 0,
              toDate: () => new Date(1000),
            },
            updatedBy: 'user-2',
          }),
        },
      ],
    });

    const where = jest.fn(() => ({
      get,
    }));

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        where,
      })),
    } as any);

    await expect(
      listRetailMediaPartners({
        idToken: 'token',
      })
    ).rejects.toThrow(
      'RETAIL_MEDIA_PARTNER_SCOPE_MISMATCH: partner-puma'
    );
  });

  it('fails closed on malformed stored Partner data', async () => {
    mockVerifyAuth.mockResolvedValue(retailerAuth);

    const get = jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'broken-partner',
          data: () => ({
            retailerId: 'retailer-a',
            name: '',
          }),
        },
      ],
    });

    const where = jest.fn(() => ({
      get,
    }));

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        where,
      })),
    } as any);

    await expect(
      listRetailMediaPartners({
        idToken: 'token',
      })
    ).rejects.toThrow(
      'RETAIL_MEDIA_PARTNER_INTEGRITY_ERROR: broken-partner'
    );
  });
});
