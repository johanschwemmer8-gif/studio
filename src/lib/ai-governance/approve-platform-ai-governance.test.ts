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
  approvePlatformAiGovernance,
} from './approve-platform-ai-governance';

const timestamp = {
  seconds: 1760000000,
  nanoseconds: 0,
  toMillis: () => 1760000000000,
  toDate: () => new Date(1760000000000),
};

function policy(status: string) {
  return {
    governanceId: 'INTERACT-AI-GOVERNANCE-V1',
    governanceVersion: '1.0.0',
    name: 'iNteract Platform AI Governance',
    status,
    createdAt: timestamp,
    createdBy: 'operator_1',
    updatedAt: timestamp,
    updatedBy: 'operator_1',
  };
}

function firestore(
  documents: Record<string, unknown> = {}
) {
  const sets: Array<{
    path: string;
    data: any;
  }> = [];

  const creates: Array<{
    path: string;
    data: any;
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

    set: jest.fn(
      (ref: { path: string }, data: unknown) => {
        sets.push({
          path: ref.path,
          data,
        });
      }
    ),

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
    sets,
    creates,
  };
}

const input = {
  idToken: 'token',
  governanceId: 'INTERACT-AI-GOVERNANCE-V1',
  governanceVersion: '1.0.0',
  reason: 'Governance v1 approved for activation.',
};

describe('approvePlatformAiGovernance', () => {
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
      approvePlatformAiGovernance(input)
    ).rejects.toThrow('UNAUTHORIZED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('fails closed when policy does not exist', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    await expect(
      approvePlatformAiGovernance(input)
    ).rejects.toThrow(
      'AI_GOVERNANCE_POLICY_NOT_FOUND'
    );

    expect(store.transaction.set)
      .not.toHaveBeenCalled();
    expect(store.transaction.create)
      .not.toHaveBeenCalled();
  });

  test('approves DRAFT policy with provenance', async () => {
    const id =
      'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${id}`]:
        policy('DRAFT'),
    });

    mockGetDb.mockReturnValue(store.db);

    const result =
      await approvePlatformAiGovernance(input);

    expect(result).toEqual({
      governanceId: 'INTERACT-AI-GOVERNANCE-V1',
      governanceVersion: '1.0.0',
      policyDocumentId: id,
      alreadyApproved: false,
    });

    expect(store.sets).toHaveLength(1);
    expect(store.creates).toHaveLength(1);

    expect(store.sets[0]).toEqual({
      path: `aiGovernancePolicies/${id}`,
      data: expect.objectContaining({
        status: 'APPROVED',
        approvedBy: 'operator_1',
        updatedBy: 'operator_1',
      }),
    });

    expect(store.creates[0].data).toEqual(
      expect.objectContaining({
        changeType: 'POLICY_APPROVED',
        actorId: 'operator_1',
        targetId: id,
      })
    );
  });

  test('is idempotent when exact policy is already APPROVED', async () => {
    const id =
      'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${id}`]:
        policy('APPROVED'),
    });

    mockGetDb.mockReturnValue(store.db);

    const result =
      await approvePlatformAiGovernance(input);

    expect(result.alreadyApproved).toBe(true);
    expect(store.transaction.set)
      .not.toHaveBeenCalled();
    expect(store.transaction.create)
      .not.toHaveBeenCalled();
  });

  test('does not move ACTIVE policy backwards to APPROVED', async () => {
    const id =
      'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${id}`]:
        policy('ACTIVE'),
    });

    mockGetDb.mockReturnValue(store.db);

    await expect(
      approvePlatformAiGovernance(input)
    ).rejects.toThrow(
      'AI_GOVERNANCE_POLICY_NOT_DRAFT:ACTIVE'
    );

    expect(store.transaction.set)
      .not.toHaveBeenCalled();
    expect(store.transaction.create)
      .not.toHaveBeenCalled();
  });
});
