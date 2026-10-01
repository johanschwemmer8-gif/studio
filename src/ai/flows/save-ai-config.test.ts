const mockVerifyAuth = jest.fn();
const mockGetAuthorizedRetailerId = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockServerTimestamp = jest.fn();

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: (...args: unknown[]) =>
    mockVerifyAuth(...args),
  getAuthorizedRetailerId: (...args: unknown[]) =>
    mockGetAuthorizedRetailerId(...args),
}));

jest.mock('@/lib/firebase-admin', () => ({
  admin: {
    firestore: Object.assign(
      () => ({
        collection: mockCollection,
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

import { saveAiConfig } from './save-ai-config';

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

function validInput() {
  return {
    idToken: 'token',
    retailerId: 'retailer-a',
    config: {
      assistantName: 'Ari',
      personality: 'FRIENDLY_APPROACHABLE' as const,
      tone: 'CONVERSATIONAL' as const,
      brandVoice: 'Clear and practical.',
      welcomeMessage:
        "Hi! I'm Ari. How can I help you with this product today?",
      recommendationCount: 3,
      includePrice: true,
      showAvailability: true,
    },
  };
}

describe('saveAiConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyAuth.mockResolvedValue(
      authorizedUser()
    );

    mockGetAuthorizedRetailerId.mockResolvedValue(
      'retailer-a'
    );

    mockDoc.mockReturnValue({
      get: mockGet,
      set: mockSet,
    });

    mockCollection.mockReturnValue({
      doc: mockDoc,
    });

    mockGet.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    mockServerTimestamp.mockReturnValue(
      'SERVER_TIMESTAMP'
    );
  });

  it('fails closed when authentication fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication required.',
    });

    await expect(
      saveAiConfig(validInput())
    ).rejects.toThrow('Authentication required.');

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('fails closed on tenant mismatch', async () => {
    mockGetAuthorizedRetailerId.mockRejectedValue(
      new Error('ACCESS_DENIED: Tenant mismatch.')
    );

    const input = validInput();
    input.retailerId = 'retailer-b';

    await expect(
      saveAiConfig(input)
    ).rejects.toThrow(
      'ACCESS_DENIED: Tenant mismatch.'
    );

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('rejects fields outside the canonical command', async () => {
    const input = {
      ...validInput(),
      config: {
        ...validInput().config,
        language: 'af',
      },
    };

    await expect(
      saveAiConfig(input as any)
    ).rejects.toThrow();

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('writes only to the authenticated retailer document', async () => {
    await saveAiConfig(validInput());

    expect(mockCollection).toHaveBeenCalledWith(
      'configurations'
    );

    expect(mockDoc).toHaveBeenCalledWith(
      'retailer-a_ai'
    );

    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  it('owns canonical provenance server-side on creation', async () => {
    await saveAiConfig(validInput());

    const written = mockSet.mock.calls[0][0];

    expect(written.retailerId).toBe(
      'retailer-a'
    );
    expect(written.configurationVersion).toBe(
      '1.0.0'
    );
    expect(written.createdAt).toBe(
      'SERVER_TIMESTAMP'
    );
    expect(written.createdBy).toBe(
      'user-1'
    );
    expect(written.updatedAt).toBe(
      'SERVER_TIMESTAMP'
    );
    expect(written.updatedBy).toBe(
      'user-1'
    );
  });

  it('preserves creation provenance from a canonical document', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        retailerId: 'retailer-a',
        configurationVersion: '1.0.0',
        assistantName: 'Ari',
        personality: 'PROFESSIONAL_HELPFUL',
        tone: 'FORMAL',
        brandVoice: '',
        welcomeMessage: 'Welcome.',
        recommendationCount: 2,
        includePrice: true,
        showAvailability: true,
        createdAt: 'ORIGINAL_CREATED_AT',
        createdBy: 'original-user',
        updatedAt: 'OLD_UPDATED_AT',
        updatedBy: 'original-user',
      }),
    });

    await saveAiConfig(validInput());

    const written = mockSet.mock.calls[0][0];

    expect(written.createdAt).toBe(
      'ORIGINAL_CREATED_AT'
    );
    expect(written.createdBy).toBe(
      'original-user'
    );
    expect(written.updatedAt).toBe(
      'SERVER_TIMESTAMP'
    );
    expect(written.updatedBy).toBe(
      'user-1'
    );
  });

  it('does not trust legacy prototype provenance', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        retailerId: 'retailer-a',
        type: 'ai',
        data: {
          assistantName: 'Legacy Ari',
        },
        createdAt: 'LEGACY_CREATED_AT',
        createdBy: 'legacy-user',
      }),
    });

    await saveAiConfig(validInput());

    const written = mockSet.mock.calls[0][0];

    expect(written.createdAt).toBe(
      'SERVER_TIMESTAMP'
    );
    expect(written.createdBy).toBe(
      'user-1'
    );
    expect(written).not.toHaveProperty(
      'type'
    );
    expect(written).not.toHaveProperty(
      'data'
    );
  });
});
