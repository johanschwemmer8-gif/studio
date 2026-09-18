import { admin, getDb } from './firebase-admin';
import { verifyRetailMediaPartnerAccess } from './retail-media-auth-server';

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

function validMembership(
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

function validPartner(
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

function mockVerifiedToken(uid = 'nike_user'): void {
  mockAdmin.auth.mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid,
    }),
  });
}

function mockFirestore(options: {
  memberships?: Array<Record<string, unknown>>;
  partner?: Record<string, unknown> | null;
} = {}): void {
  const memberships =
    options.memberships === undefined
      ? [validMembership()]
      : options.memberships;

  const partner =
    options.partner === undefined
      ? validPartner()
      : options.partner;

  const membershipGet = jest.fn().mockResolvedValue({
    empty: memberships.length === 0,
    docs: memberships.map((membership) => ({
      data: () => membership,
    })),
  });

  const thirdWhere = jest.fn(() => ({
    get: membershipGet,
  }));

  const secondWhere = jest.fn(() => ({
    where: thirdWhere,
  }));

  const firstWhere = jest.fn(() => ({
    where: secondWhere,
  }));

  const partnerGet = jest.fn().mockResolvedValue({
    exists: partner !== null,
    data: () => partner ?? undefined,
  });

  mockGetDb.mockReturnValue({
    collection: jest.fn((collectionName: string) => {
      if (collectionName === 'retailMediaPartnerMemberships') {
        return {
          where: firstWhere,
        };
      }

      if (collectionName === 'retailMediaPartners') {
        return {
          doc: jest.fn(() => ({
            get: partnerGet,
          })),
        };
      }

      throw new Error(`Unexpected collection: ${collectionName}`);
    }),
  });
}

describe('verifyRetailMediaPartnerAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows an authenticated active Partner member to access its own resource', async () => {
    mockVerifiedToken();
    mockFirestore();

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'valid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
        },
      })
    ).resolves.toEqual({
      uid: 'nike_user',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
      membershipId: 'membership_nike_retailer_a',
    });
  });

  it('fails closed when no authentication token is supplied', async () => {
    await expect(
      verifyRetailMediaPartnerAccess({
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
        },
      })
    ).rejects.toThrow('AUTHENTICATION_REQUIRED');
  });

  it('fails closed when Firebase token verification fails', async () => {
    mockAdmin.auth.mockReturnValue({
      verifyIdToken: jest.fn().mockRejectedValue(
        new Error('invalid token')
      ),
    });

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'invalid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
        },
      })
    ).rejects.toThrow('AUTHENTICATION_FAILED');
  });

  it('denies access when no authoritative membership exists', async () => {
    mockVerifiedToken();
    mockFirestore({
      memberships: [],
    });

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'valid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
        },
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner membership not found.'
    );
  });

  it('denies ambiguous duplicate Partner memberships', async () => {
    mockVerifiedToken();
    mockFirestore({
      memberships: [
        validMembership(),
        validMembership({
          membershipId: 'membership_duplicate',
        }),
      ],
    });

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'valid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
        },
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Ambiguous Retail Media Partner membership.'
    );
  });

  it('denies an inactive Partner membership', async () => {
    mockVerifiedToken();
    mockFirestore({
      memberships: [
        validMembership({
          status: 'INACTIVE',
        }),
      ],
    });

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'valid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
        },
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner membership is inactive.'
    );
  });

  it('denies access when the required Partner permission is not granted', async () => {
    mockVerifiedToken();
    mockFirestore();

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'valid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'exportRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
        },
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner permission is not granted.'
    );
  });

  it('denies access when the canonical Partner is inactive', async () => {
    mockVerifiedToken();
    mockFirestore({
      partner: validPartner({
        status: 'INACTIVE',
      }),
    });

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'valid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_nike',
        },
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media Partner is inactive.'
    );
  });

  it('DENIES Nike credentials plus a Puma resource ID in the same retailer', async () => {
    mockVerifiedToken();
    mockFirestore();

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'valid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_a',
          partnerId: 'partner_puma',
        },
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media resource belongs to a different Partner.'
    );
  });

  it('DENIES Nike at Retailer A plus a Nike resource at Retailer B', async () => {
    mockVerifiedToken();
    mockFirestore();

    await expect(
      verifyRetailMediaPartnerAccess({
        idToken: 'valid-token',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        permission: 'viewRetailMedia',
        resource: {
          retailerId: 'retailer_b',
          partnerId: 'partner_nike',
        },
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Retail Media resource belongs to a different retailer.'
    );
  });
});
