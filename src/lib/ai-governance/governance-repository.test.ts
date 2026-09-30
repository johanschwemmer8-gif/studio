const mockGetDb = jest.fn();

jest.mock('@/lib/firebase-admin', () => ({
  getDb: () => mockGetDb(),
}));

import {
  getActiveGovernancePointer,
  getGovernancePolicy,
} from './governance-repository';

const timestamp = {
  seconds: 1760000000,
  nanoseconds: 0,
};

function firestore(
  documents: Record<string, unknown> = {}
) {
  const collection = jest.fn((name: string) => ({
    doc: jest.fn((id: string) => ({
      get: jest.fn(async () => {
        const path = `${name}/${id}`;
        const data = documents[path];

        return {
          exists: data !== undefined,
          data: () => data,
        };
      }),
    })),
  }));

  return { collection };
}

describe('AI governance repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reads and validates a versioned governance policy', async () => {
    const id = 'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    mockGetDb.mockReturnValue(
      firestore({
        [`aiGovernancePolicies/${id}`]: {
          governanceId: 'INTERACT-AI-GOVERNANCE-V1',
          governanceVersion: '1.0.0',
          name: 'iNteract Platform AI Governance',
          status: 'APPROVED',
          createdAt: timestamp,
          createdBy: 'operator_1',
          updatedAt: timestamp,
          updatedBy: 'operator_1',
        },
      })
    );

    const result = await getGovernancePolicy(
      'INTERACT-AI-GOVERNANCE-V1',
      '1.0.0'
    );

    expect(result?.governanceVersion).toBe('1.0.0');
    expect(result?.status).toBe('APPROVED');
  });

  test('returns null when governance policy does not exist', async () => {
    mockGetDb.mockReturnValue(firestore());

    await expect(
      getGovernancePolicy(
        'INTERACT-AI-GOVERNANCE-V1',
        '1.0.0'
      )
    ).resolves.toBeNull();
  });

  test('reads and validates the active governance pointer', async () => {
    const id = 'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    mockGetDb.mockReturnValue(
      firestore({
        'platformConfiguration/aiGovernance': {
          governanceId: 'INTERACT-AI-GOVERNANCE-V1',
          governanceVersion: '1.0.0',
          policyDocumentId: id,
          activatedAt: timestamp,
          activatedBy: 'operator_1',
        },
      })
    );

    const result = await getActiveGovernancePointer();

    expect(result?.policyDocumentId).toBe(id);
  });

  test('rejects malformed persisted governance data', async () => {
    const id = 'INTERACT-AI-GOVERNANCE-V1__1.0.0';

    mockGetDb.mockReturnValue(
      firestore({
        [`aiGovernancePolicies/${id}`]: {
          governanceId: 'INTERACT-AI-GOVERNANCE-V1',
          governanceVersion: '1.0.0',
          status: 'ACTIVE',
        },
      })
    );

    await expect(
      getGovernancePolicy(
        'INTERACT-AI-GOVERNANCE-V1',
        '1.0.0'
      )
    ).rejects.toThrow();
  });
});
