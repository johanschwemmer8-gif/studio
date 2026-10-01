const mockVerifyAuth = jest.fn();
const mockGetRetailerAriConfiguration = jest.fn();

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: (...args: unknown[]) =>
    mockVerifyAuth(...args),
}));

jest.mock('@/lib/ari-configuration-repository', () => ({
  getRetailerAriConfiguration: (...args: unknown[]) =>
    mockGetRetailerAriConfiguration(...args),
}));

import { getAiConfig } from './get-ai-config';

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

describe('getAiConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAuth.mockResolvedValue(authorizedUser());
    mockGetRetailerAriConfiguration.mockResolvedValue(null);
  });

  it('fails closed when authentication fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication required.',
    });

    await expect(
      getAiConfig({
        idToken: 'token',
        retailerId: 'retailer-a',
      })
    ).rejects.toThrow('Authentication required.');

    expect(
      mockGetRetailerAriConfiguration
    ).not.toHaveBeenCalled();
  });

  it('fails closed on tenant mismatch', async () => {
    await expect(
      getAiConfig({
        idToken: 'token',
        retailerId: 'retailer-b',
      })
    ).rejects.toThrow('ACCESS_DENIED: Tenant mismatch.');

    expect(
      mockGetRetailerAriConfiguration
    ).not.toHaveBeenCalled();
  });

  it('returns null when no canonical configuration exists', async () => {
    const result = await getAiConfig({
      idToken: 'token',
      retailerId: 'retailer-a',
    });

    expect(result).toEqual({
      configuration: null,
    });

    expect(
      mockGetRetailerAriConfiguration
    ).toHaveBeenCalledWith('retailer-a');
  });

  it('returns only the serializable retailer Ari client configuration', async () => {
    const createdAt = {
      toDate: () => new Date(),
    };
    const updatedAt = {
      toDate: () => new Date(),
    };

    const configuration = {
      retailerId: 'retailer-a',
      configurationVersion: '1.0.0',
      assistantName: 'Ari',
      personality: 'FRIENDLY_APPROACHABLE',
      tone: 'CONVERSATIONAL',
      brandVoice: '',
      welcomeMessage:
        "Hi! I'm Ari. How can I help you with this product today?",
      recommendationCount: 3,
      includePrice: true,
      showAvailability: true,
      createdAt,
      createdBy: 'user-1',
      updatedAt,
      updatedBy: 'user-1',
    };

    mockGetRetailerAriConfiguration.mockResolvedValue(
      configuration
    );

    const result = await getAiConfig({
      idToken: 'token',
      retailerId: 'retailer-a',
    });

    expect(result).toEqual({
      configuration: {
        assistantName: 'Ari',
        personality: 'FRIENDLY_APPROACHABLE',
        tone: 'CONVERSATIONAL',
        brandVoice: '',
        welcomeMessage:
          "Hi! I'm Ari. How can I help you with this product today?",
        recommendationCount: 3,
        includePrice: true,
        showAvailability: true,
      },
    });

    expect(result.configuration).not.toHaveProperty('retailerId');
    expect(result.configuration).not.toHaveProperty(
      'configurationVersion'
    );
    expect(result.configuration).not.toHaveProperty('createdAt');
    expect(result.configuration).not.toHaveProperty('createdBy');
    expect(result.configuration).not.toHaveProperty('updatedAt');
    expect(result.configuration).not.toHaveProperty('updatedBy');
  });
});
