const mockGet = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockGetDb = jest.fn();

jest.mock('@/lib/firebase-admin', () => ({
  getDb: () => mockGetDb(),
}));

import {
  getRetailerAiGovernance,
} from './retailer-governance-repository';

function validGovernance(
  overrides: Record<string, unknown> = {}
) {
  return {
    retailerId: 'retailer-a',
    governanceVersion: '1.0.0',
    status: 'ACTIVE',
    additiveRules: [],
    createdAt: 'created',
    createdBy: 'user-1',
    updatedAt: 'updated',
    updatedBy: 'user-1',
    ...overrides,
  };
}

describe('retailer-governance-repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetDb.mockReturnValue({
      collection: mockCollection,
    });

    mockCollection.mockReturnValue({
      doc: mockDoc,
    });

    mockDoc.mockReturnValue({
      get: mockGet,
    });
  });

  it('fails when Firestore is unavailable', async () => {
    mockGetDb.mockReturnValue(null);

    await expect(
      getRetailerAiGovernance('retailer-a')
    ).rejects.toThrow(
      'RETAILER_AI_GOVERNANCE_FIRESTORE_UNAVAILABLE'
    );
  });

  it('requires retailer identity', async () => {
    await expect(
      getRetailerAiGovernance('')
    ).rejects.toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:RETAILER_ID_REQUIRED'
    );

    expect(mockCollection).not.toHaveBeenCalled();
  });

  it('returns null when retailer governance does not exist', async () => {
    mockGet.mockResolvedValue({
      exists: false,
    });

    await expect(
      getRetailerAiGovernance('retailer-a')
    ).resolves.toBeNull();

    expect(mockCollection).toHaveBeenCalledWith(
      'retailerAiGovernance'
    );

    expect(mockDoc).toHaveBeenCalledWith(
      'retailer-a'
    );
  });

  it('returns valid governance for the requested retailer', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => validGovernance(),
    });

    const result =
      await getRetailerAiGovernance(
        'retailer-a'
      );

    expect(result?.retailerId).toBe(
      'retailer-a'
    );
  });

  it('fails closed on tenant identity mismatch', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () =>
        validGovernance({
          retailerId: 'retailer-b',
        }),
    });

    await expect(
      getRetailerAiGovernance('retailer-a')
    ).rejects.toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:TENANT_IDENTITY_MISMATCH'
    );
  });

  it('fails closed on malformed persisted governance', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        retailerId: 'retailer-a',
        status: 'ACTIVE',
      }),
    });

    await expect(
      getRetailerAiGovernance('retailer-a')
    ).rejects.toThrow();
  });
});
