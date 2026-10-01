const mockVerifyAuth = jest.fn();
const mockGetAuthorizedRetailerId = jest.fn();
const mockTransactionGet = jest.fn();
const mockTransactionSet = jest.fn();
const mockRunTransaction = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockServerTimestamp = jest.fn();

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: (...args: unknown[]) =>
    mockVerifyAuth(...args),
  getAuthorizedRetailerId: (...args: unknown[]) =>
    mockGetAuthorizedRetailerId(...args),
}));

jest.mock('@/ai/genkit', () => ({
  ai: {
    defineFlow: (
      _config: unknown,
      handler: (...args: any[]) => any
    ) => handler,
  },
}));

jest.mock('genkit', () => ({
  z: require('zod').z,
}));

jest.mock('@/lib/firebase-admin', () => ({
  admin: {
    apps: [{}],
    firestore: Object.assign(
      () => ({
        collection: mockCollection,
        runTransaction: mockRunTransaction,
      }),
      {
        FieldValue: {
          serverTimestamp: () =>
            mockServerTimestamp(),
        },
      }
    ),
  },
}));

import {
  saveRetailerAiGovernance,
} from './save-retailer-ai-governance';

const validRule = {
  ruleId: 'rule-001',
  ruleType: 'TRANSPARENCY_REQUIREMENT' as const,
  platformControlId: 'GOV-12-001',
  title: 'Additional AI disclosure',
  description:
    'Retailer requires an additional AI interaction disclosure.',
  value: 'Additional retailer AI disclosure.',
};

function validInput() {
  return {
    idToken: 'token',
    retailerId: 'retailer-a',
    governanceVersion: '1.0.0',
    status: 'ACTIVE' as const,
    additiveRules: [validRule],
  };
}

function authorizedUser() {
  return {
    uid: 'user-1',
    retailerId: 'retailer-a',
    role: 'networkOwner',
    scope: {
      level: 'network',
      networkId: 'network-a',
    },
    permissions: {},
    isActive: true,
  };
}

describe('saveRetailerAiGovernance', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyAuth.mockResolvedValue(
      authorizedUser()
    );

    mockGetAuthorizedRetailerId.mockResolvedValue(
      'retailer-a'
    );

    mockDoc.mockReturnValue({
      id: 'retailer-a',
    });

    mockCollection.mockReturnValue({
      doc: mockDoc,
    });

    mockServerTimestamp
      .mockReturnValueOnce('SERVER_CREATED')
      .mockReturnValueOnce('SERVER_UPDATED');

    mockRunTransaction.mockImplementation(
      async (callback: any) =>
        callback({
          get: mockTransactionGet,
          set: mockTransactionSet,
        })
    );

    mockTransactionGet.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });
  });

  it('fails closed when authentication fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication required.',
    });

    await expect(
      saveRetailerAiGovernance(validInput())
    ).rejects.toThrow('Authentication required.');

    expect(
      mockGetAuthorizedRetailerId
    ).not.toHaveBeenCalled();

    expect(
      mockRunTransaction
    ).not.toHaveBeenCalled();
  });

  it('uses the canonical tenant authorization gate', async () => {
    mockGetAuthorizedRetailerId.mockRejectedValue(
      new Error('ACCESS_DENIED: Tenant mismatch.')
    );

    await expect(
      saveRetailerAiGovernance(validInput())
    ).rejects.toThrow(
      'ACCESS_DENIED: Tenant mismatch.'
    );

    expect(
      mockRunTransaction
    ).not.toHaveBeenCalled();
  });

  it('writes only to the authorized retailer document', async () => {
    await saveRetailerAiGovernance(validInput());

    expect(
      mockCollection
    ).toHaveBeenCalledWith(
      'retailerAiGovernance'
    );

    expect(mockDoc).toHaveBeenCalledWith(
      'retailer-a'
    );

    expect(
      mockTransactionSet
    ).toHaveBeenCalledTimes(1);
  });

  it('owns provenance and timestamps server-side', async () => {
    await saveRetailerAiGovernance(validInput());

    const written =
      mockTransactionSet.mock.calls[0][1];

    expect(written.retailerId).toBe(
      'retailer-a'
    );

    expect(written.createdBy).toBe(
      'user-1'
    );

    expect(written.updatedBy).toBe(
      'user-1'
    );

    expect(written.createdAt).toBe(
      'SERVER_CREATED'
    );

    expect(written.updatedAt).toBe(
      'SERVER_UPDATED'
    );
  });

  it('preserves original creation provenance on update', async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        createdAt: 'ORIGINAL_CREATED_AT',
        createdBy: 'original-user',
      }),
    });

    mockServerTimestamp.mockReset();
    mockServerTimestamp.mockReturnValue(
      'SERVER_UPDATED'
    );

    await saveRetailerAiGovernance(validInput());

    const written =
      mockTransactionSet.mock.calls[0][1];

    expect(written.createdAt).toBe(
      'ORIGINAL_CREATED_AT'
    );

    expect(written.createdBy).toBe(
      'original-user'
    );

    expect(written.updatedAt).toBe(
      'SERVER_UPDATED'
    );

    expect(written.updatedBy).toBe(
      'user-1'
    );
  });

  it('rejects unauthorized additive governance before writing', async () => {
    await expect(
      saveRetailerAiGovernance({
        ...validInput(),
        additiveRules: [
          {
            ...validRule,
            platformControlId: 'GOV-05-001',
          },
        ],
      })
    ).rejects.toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:PLATFORM_CONTROL_NOT_EXTENSIBLE'
    );

    expect(
      mockTransactionSet
    ).not.toHaveBeenCalled();
  });

  it('permits zero additive rules for Platform-baseline-only governance', async () => {
    await expect(
      saveRetailerAiGovernance({
        ...validInput(),
        additiveRules: [],
      })
    ).resolves.toEqual({
      success: true,
      message:
        'Retailer additive AI governance saved.',
    });

    const written =
      mockTransactionSet.mock.calls[0][1];

    expect(written.additiveRules).toEqual([]);
  });
});
