jest.mock('@/lib/firebase-admin', () => ({
  admin: {
    firestore: jest.fn(),
  },
}));

import { admin } from '@/lib/firebase-admin';
import { getRetailerAriConfiguration } from './ari-configuration-repository';

const validConfiguration = {
  retailerId: 'retailer-1',
  configurationVersion: '1.0.0',
  assistantName: 'Ari',
  personality: 'FRIENDLY_APPROACHABLE',
  tone: 'CONVERSATIONAL',
  brandVoice: '',
  welcomeMessage: "Hi! I'm Ari. How can I help you with this product today?",
  recommendationCount: 3,
  includePrice: true,
  showAvailability: true,
  createdAt: 'created',
  createdBy: 'user-1',
  updatedAt: 'updated',
  updatedBy: 'user-1',
};

function mockSnapshot(exists: boolean, data?: unknown) {
  const get = jest.fn().mockResolvedValue({
    exists,
    data: () => data,
  });

  const doc = jest.fn(() => ({ get }));
  const collection = jest.fn(() => ({ doc }));

  (admin.firestore as unknown as jest.Mock).mockReturnValue({
    collection,
  });

  return { collection, doc, get };
}

describe('getRetailerAriConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fails closed when retailerId is missing', async () => {
    await expect(
      getRetailerAriConfiguration('')
    ).rejects.toThrow(
      'ARI_CONFIGURATION_DENIED:RETAILER_ID_REQUIRED'
    );

    expect(admin.firestore).not.toHaveBeenCalled();
  });

  it('returns null when no retailer Ari configuration exists', async () => {
    const mocks = mockSnapshot(false);

    await expect(
      getRetailerAriConfiguration('retailer-1')
    ).resolves.toBeNull();

    expect(mocks.collection).toHaveBeenCalledWith('configurations');
    expect(mocks.doc).toHaveBeenCalledWith('retailer-1_ai');
  });

  it('returns a valid canonical retailer Ari configuration', async () => {
    mockSnapshot(true, validConfiguration);

    await expect(
      getRetailerAriConfiguration('retailer-1')
    ).resolves.toEqual(validConfiguration);
  });

  it('fails closed when persisted configuration is invalid', async () => {
    mockSnapshot(true, {
      retailerId: 'retailer-1',
      type: 'ai',
      data: {
        assistantName: 'Legacy Ari',
      },
    });

    await expect(
      getRetailerAriConfiguration('retailer-1')
    ).rejects.toThrow(
      'ARI_CONFIGURATION_DENIED:INVALID_CONFIGURATION'
    );
  });

  it('fails closed when persisted retailer identity does not match', async () => {
    mockSnapshot(true, {
      ...validConfiguration,
      retailerId: 'retailer-2',
    });

    await expect(
      getRetailerAriConfiguration('retailer-1')
    ).rejects.toThrow(
      'ARI_CONFIGURATION_DENIED:TENANT_IDENTITY_MISMATCH'
    );
  });
});
