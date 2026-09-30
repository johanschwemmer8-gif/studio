const mockGetDb = jest.fn();
const mockVerifyPlatformOperator = jest.fn();
const mockTimestampNow = jest.fn();

jest.mock('@/lib/firebase-admin', () => ({
  getDb: () => mockGetDb(),
  admin: {
    firestore: {
      Timestamp: {
        now: () => mockTimestampNow(),
      },
    },
  },
}));

jest.mock('@/lib/auth-server', () => ({
  verifyPlatformOperator: (idToken: string) =>
    mockVerifyPlatformOperator(idToken),
}));

import {
  bootstrapPlatformAiGovernanceV1,
} from './bootstrap-platform-ai-governance-v1';

const timestamp = {
  seconds: 1760000000,
  nanoseconds: 0,
  toMillis: () => 1760000000000,
  toDate: () => new Date(1760000000000),
};

function firestore(
  documents: Record<string, unknown> = {}
) {
  const creates: Array<{
    path: string;
    data: unknown;
  }> = [];

  const collection = (name: string) => ({
    doc: (id: string) => ({
      path: `${name}/${id}`,
    }),
  });

  const transaction = {
    get: jest.fn(async (ref: { path: string }) => {
      const data = documents[ref.path];

      return {
        exists: data !== undefined,
        data: () => data,
      };
    }),

    create: jest.fn(
      (ref: { path: string }, data: unknown) => {
        creates.push({
          path: ref.path,
          data,
        });
      }
    ),
  };

  const db = {
    collection,
    runTransaction: jest.fn(
      async (
        callback: (
          tx: typeof transaction
        ) => Promise<unknown>
      ) => callback(transaction)
    ),
  };

  return {
    db,
    transaction,
    creates,
  };
}

describe('bootstrapPlatformAiGovernanceV1', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyPlatformOperator.mockResolvedValue({
      uid: 'operator_1',
      email: 'operator@example.com',
    });

    mockTimestampNow.mockReturnValue(timestamp);
  });

  test('authenticates before accessing Firestore', async () => {
    mockVerifyPlatformOperator.mockRejectedValue(
      new Error('UNAUTHORIZED')
    );

    await expect(
      bootstrapPlatformAiGovernanceV1({
        idToken: 'bad-token',
      })
    ).rejects.toThrow('UNAUTHORIZED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('creates canonical v1 as DRAFT with provenance', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    const result =
      await bootstrapPlatformAiGovernanceV1({
        idToken: 'token',
        reason: 'Initialize canonical governance.',
      });

    expect(result).toEqual({
      governanceId: 'INTERACT-AI-GOVERNANCE-V1',
      governanceVersion: '1.0.0',
      policyDocumentId:
        'INTERACT-AI-GOVERNANCE-V1__1.0.0',
      alreadyExists: false,
    });

    expect(store.creates).toHaveLength(2);

    const policyWrite = store.creates.find(
      item =>
        item.path ===
        'aiGovernancePolicies/INTERACT-AI-GOVERNANCE-V1__1.0.0'
    );

    expect(policyWrite?.data).toEqual(
      expect.objectContaining({
        governanceId:
          'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '1.0.0',
        name: 'iNteract Platform AI Governance',
        status: 'DRAFT',
        createdBy: 'operator_1',
        updatedBy: 'operator_1',
      })
    );

    const eventWrite = store.creates.find(
      item =>
        item.path.startsWith(
          'aiGovernanceChangeEvents/'
        )
    );

    expect(eventWrite?.data).toEqual(
      expect.objectContaining({
        changeType: 'POLICY_CREATED',
        actorId: 'operator_1',
        targetId:
          'INTERACT-AI-GOVERNANCE-V1__1.0.0',
      })
    );
  });

  test('does not overwrite an existing canonical policy', async () => {
    const id =
      'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${id}`]: {
        governanceId:
          'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '1.0.0',
        name: 'iNteract Platform AI Governance',
        status: 'DRAFT',
        createdAt: timestamp,
        createdBy: 'operator_1',
        updatedAt: timestamp,
        updatedBy: 'operator_1',
      },
    });

    mockGetDb.mockReturnValue(store.db);

    const result =
      await bootstrapPlatformAiGovernanceV1({
        idToken: 'token',
      });

    expect(result.alreadyExists).toBe(true);
    expect(store.transaction.create)
      .not.toHaveBeenCalled();
  });

  test('fails closed on existing document identity corruption', async () => {
    const id =
      'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${id}`]: {
        governanceId: 'WRONG-GOVERNANCE',
        governanceVersion: '1.0.0',
        name: 'iNteract Platform AI Governance',
        status: 'DRAFT',
        createdAt: timestamp,
        createdBy: 'operator_1',
        updatedAt: timestamp,
        updatedBy: 'operator_1',
      },
    });

    mockGetDb.mockReturnValue(store.db);

    await expect(
      bootstrapPlatformAiGovernanceV1({
        idToken: 'token',
      })
    ).rejects.toThrow(
      'AI_GOVERNANCE_POLICY_DOCUMENT_IDENTITY_MISMATCH'
    );

    expect(store.transaction.create)
      .not.toHaveBeenCalled();
  });
});
