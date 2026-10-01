const mockGetRetailerAriConfiguration = jest.fn();

jest.mock('@/lib/ari-configuration-repository', () => ({
  getRetailerAriConfiguration: (...args: unknown[]) =>
    mockGetRetailerAriConfiguration(...args),
}));

import { resolveAriConfiguration } from './resolve-ari-configuration';

describe('resolveAriConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fails closed without retailer identity', async () => {
    await expect(
      resolveAriConfiguration('')
    ).rejects.toThrow(
      'ARI_CONFIGURATION_DENIED:RETAILER_ID_REQUIRED'
    );

    expect(
      mockGetRetailerAriConfiguration
    ).not.toHaveBeenCalled();
  });

  it('returns safe platform defaults when no retailer configuration exists', async () => {
    mockGetRetailerAriConfiguration.mockResolvedValue(null);

    const result =
      await resolveAriConfiguration('retailer-a');

    expect(result).toEqual({
      retailerId: 'retailer-a',
      configurationVersion: '1.0.0',
      source: 'PLATFORM_DEFAULT',
      assistantName: 'Ari',
      personality: 'FRIENDLY_APPROACHABLE',
      tone: 'CONVERSATIONAL',
      brandVoice: '',
      welcomeMessage:
        "Hi! I'm Ari. How can I help you with this product today?",
      recommendationCount: 3,
      includePrice: true,
      showAvailability: true,
    });
  });

  it('returns canonical retailer configuration when present', async () => {
    mockGetRetailerAriConfiguration.mockResolvedValue({
      retailerId: 'retailer-a',
      configurationVersion: '1.0.0',
      assistantName: 'Store Ari',
      personality: 'PROFESSIONAL_HELPFUL',
      tone: 'FORMAL',
      brandVoice: 'Clear and practical.',
      welcomeMessage: 'Welcome. How can I help?',
      recommendationCount: 4,
      includePrice: false,
      showAvailability: true,
      createdAt: 'created',
      createdBy: 'user-1',
      updatedAt: 'updated',
      updatedBy: 'user-2',
    });

    const result =
      await resolveAriConfiguration('retailer-a');

    expect(result).toEqual({
      retailerId: 'retailer-a',
      configurationVersion: '1.0.0',
      source: 'RETAILER_CONFIGURATION',
      assistantName: 'Store Ari',
      personality: 'PROFESSIONAL_HELPFUL',
      tone: 'FORMAL',
      brandVoice: 'Clear and practical.',
      welcomeMessage: 'Welcome. How can I help?',
      recommendationCount: 4,
      includePrice: false,
      showAvailability: true,
    });

    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('createdBy');
    expect(result).not.toHaveProperty('updatedAt');
    expect(result).not.toHaveProperty('updatedBy');
  });

  it('propagates repository validation failure instead of falling back', async () => {
    mockGetRetailerAriConfiguration.mockRejectedValue(
      new Error(
        'ARI_CONFIGURATION_DENIED:INVALID_CONFIGURATION'
      )
    );

    await expect(
      resolveAriConfiguration('retailer-a')
    ).rejects.toThrow(
      'ARI_CONFIGURATION_DENIED:INVALID_CONFIGURATION'
    );
  });

  it('reads configuration only for the requested retailer', async () => {
    mockGetRetailerAriConfiguration.mockResolvedValue(null);

    await resolveAriConfiguration('retailer-a');

    expect(
      mockGetRetailerAriConfiguration
    ).toHaveBeenCalledTimes(1);

    expect(
      mockGetRetailerAriConfiguration
    ).toHaveBeenCalledWith('retailer-a');
  });
});
