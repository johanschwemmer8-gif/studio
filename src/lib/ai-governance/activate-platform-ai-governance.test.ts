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

import { activatePlatformAiGovernance } from './activate-platform-ai-governance';

const timestamp = {
  seconds: 1760000000,
  nanoseconds: 0,
  toMillis: () => 1760000000000,
  toDate: () => new Date(1760000000000),
};

function policy(
  status: string,
  version = '1.0.0'
) {
  return {
    governanceId: 'INTERACT-AI-GOVERNANCE-V1',
    governanceVersion: version,
    name: 'iNteract Platform AI Governance',
    status,
    createdAt: timestamp,
    createdBy: 'operator_creator',
    updatedAt: timestamp,
    updatedBy: 'operator_creator',
  };
}

function snapshot(data?: unknown) {
  return {
    exists: data !== undefined,
    data: () => data,
  };
}

function firestore(
  documents: Record<string, unknown> = {}
) {
  const refs = new Map<string, { id: string; path: string }>();
  const set = jest.fn();
  const create = jest.fn();

  const collection = jest.fn((name: string) => ({
    doc: jest.fn((id: string) => {
      const path = `${name}/${id}`;
      const ref = { id, path };
      refs.set(path, ref);
      return ref;
    }),
  }));

  const transaction = {
    get: jest.fn(async (ref: { path: string }) =>
      snapshot(documents[ref.path])
    ),
    set,
    create,
  };

  const runTransaction = jest.fn(
    async (callback: (tx: any) => unknown) =>
      callback(transaction)
  );

  return {
    db: {
      collection,
      runTransaction,
    },
    transaction,
    set,
    create,
  };
}

describe('activatePlatformAiGovernance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTimestampNow.mockReturnValue(timestamp);
    mockVerifyPlatformOperator.mockResolvedValue({
      uid: 'operator_1',
      email: 'operator@example.com',
    });
  });

  test('authenticates before governance mutation', async () => {
    mockVerifyPlatformOperator.mockRejectedValue(
      new Error('PLATFORM_OPERATOR_REQUIRED')
    );

    await expect(
      activatePlatformAiGovernance({
        idToken: 'bad-token',
        governanceId: 'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '1.0.0',
      })
    ).rejects.toThrow('PLATFORM_OPERATOR_REQUIRED');

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('fails closed when target policy does not exist', async () => {
    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    await expect(
      activatePlatformAiGovernance({
        idToken: 'token',
        governanceId: 'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '1.0.0',
      })
    ).rejects.toThrow('AI_GOVERNANCE_POLICY_NOT_FOUND');

    expect(store.set).not.toHaveBeenCalled();
    expect(store.create).not.toHaveBeenCalled();
  });

  test('refuses to activate a policy that is not APPROVED', async () => {
    const id = 'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${id}`]:
        policy('DRAFT'),
    });

    mockGetDb.mockReturnValue(store.db);

    await expect(
      activatePlatformAiGovernance({
        idToken: 'token',
        governanceId: 'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '1.0.0',
      })
    ).rejects.toThrow(
      'AI_GOVERNANCE_POLICY_NOT_APPROVED:DRAFT'
    );

    expect(store.set).not.toHaveBeenCalled();
    expect(store.create).not.toHaveBeenCalled();
  });

  test('activates an APPROVED policy and creates the pointer', async () => {
    const id = 'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${id}`]:
        policy('APPROVED'),
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await activatePlatformAiGovernance({
      idToken: 'token',
      governanceId: 'INTERACT-AI-GOVERNANCE-V1',
      governanceVersion: '1.0.0',
      reason: 'Initial governance activation',
    });

    expect(result).toEqual({
      governanceId: 'INTERACT-AI-GOVERNANCE-V1',
      governanceVersion: '1.0.0',
      policyDocumentId: id,
      alreadyActive: false,
    });

    expect(store.set).toHaveBeenCalledTimes(2);
    expect(store.create).toHaveBeenCalledTimes(1);

    expect(store.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `aiGovernancePolicies/${id}`,
      }),
      expect.objectContaining({
        status: 'ACTIVE',
        activatedBy: 'operator_1',
      })
    );

    expect(store.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'platformConfiguration/aiGovernance',
      }),
      expect.objectContaining({
        governanceId: 'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '1.0.0',
        policyDocumentId: id,
        activatedBy: 'operator_1',
      })
    );
  });

  test('supersedes the previous ACTIVE policy atomically', async () => {
    const oldId = 'INTERACT-AI-GOVERNANCE-V1__0.9.0';
    const newId = 'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${newId}`]:
        policy('APPROVED'),
      'platformConfiguration/aiGovernance': {
        governanceId: 'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '0.9.0',
        policyDocumentId: oldId,
        activatedAt: timestamp,
        activatedBy: 'operator_old',
      },
      [`aiGovernancePolicies/${oldId}`]:
        policy('ACTIVE', '0.9.0'),
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await activatePlatformAiGovernance({
      idToken: 'token',
      governanceId: 'INTERACT-AI-GOVERNANCE-V1',
      governanceVersion: '1.0.0',
      reason: 'Activate replacement policy',
    });

    expect(result.alreadyActive).toBe(false);
    expect(store.set).toHaveBeenCalledTimes(3);
    expect(store.create).toHaveBeenCalledTimes(2);

    expect(store.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `aiGovernancePolicies/${oldId}`,
      }),
      expect.objectContaining({
        status: 'SUPERSEDED',
        supersededBy: 'operator_1',
      })
    );

    expect(store.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `aiGovernancePolicies/${newId}`,
      }),
      expect.objectContaining({
        status: 'ACTIVE',
        activatedBy: 'operator_1',
      })
    );
  });

  test('is idempotent when the exact policy is already active', async () => {
    const id = 'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const active = {
      ...policy('ACTIVE'),
      activatedAt: timestamp,
      activatedBy: 'operator_existing',
    };

    const store = firestore({
      [`aiGovernancePolicies/${id}`]: active,
      'platformConfiguration/aiGovernance': {
        governanceId: 'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '1.0.0',
        policyDocumentId: id,
        activatedAt: timestamp,
        activatedBy: 'operator_existing',
      },
    });

    mockGetDb.mockReturnValue(store.db);

    const result = await activatePlatformAiGovernance({
      idToken: 'token',
      governanceId: 'INTERACT-AI-GOVERNANCE-V1',
      governanceVersion: '1.0.0',
    });

    expect(result.alreadyActive).toBe(true);
    expect(store.set).not.toHaveBeenCalled();
    expect(store.create).not.toHaveBeenCalled();
  });

  test('fails closed when active pointer document identity is corrupt', async () => {
    const targetId =
      'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    const store = firestore({
      [`aiGovernancePolicies/${targetId}`]:
        policy('APPROVED'),
      'platformConfiguration/aiGovernance': {
        governanceId: 'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '0.9.0',
        policyDocumentId: 'corrupt-document-id',
        activatedAt: timestamp,
        activatedBy: 'operator_old',
      },
    });

    mockGetDb.mockReturnValue(store.db);

    await expect(
      activatePlatformAiGovernance({
        idToken: 'token',
        governanceId: 'INTERACT-AI-GOVERNANCE-V1',
        governanceVersion: '1.0.0',
      })
    ).rejects.toThrow(
      'AI_GOVERNANCE_POINTER_DOCUMENT_ID_MISMATCH'
    );

    expect(store.set).not.toHaveBeenCalled();
    expect(store.create).not.toHaveBeenCalled();
  });

});
