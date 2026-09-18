jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn(() => jest.fn()),
    defineFlow: jest.fn((_config, handler) => handler),
    generate: jest.fn(),
  },
}));

jest.mock('genkit', () => ({
  z: require('zod').z,
}));

jest.mock('@/lib/firebase-admin', () => ({
  admin: {
    firestore: {
      Timestamp: {
        now: jest.fn(() => ({
          seconds: 1,
          nanoseconds: 0,
        })),
      },
    },
  },
  getDb: jest.fn(),
}));

jest.mock('@/lib/qr-resolution', () => ({
  resolveProductionQr: jest.fn(),
}));

jest.mock('@/lib/sponsored-media-eligibility', () => ({
  establishSponsoredMediaEligibility: jest.fn(),
}));

import { ai } from '@/ai/genkit';
import { getDb } from '@/lib/firebase-admin';
import { resolveProductionQr } from '@/lib/qr-resolution';
import { establishSponsoredMediaEligibility } from '@/lib/sponsored-media-eligibility';
import { getScanInteraction } from './get-scan-interaction';

const mockGenerate = ai.generate as jest.Mock;
const mockGetDb = getDb as jest.Mock;
const mockResolveProductionQr = resolveProductionQr as jest.Mock;
const mockEligibility = establishSponsoredMediaEligibility as jest.Mock;

function resolvedQr(sponsoredMedia: Record<string, unknown>) {
  return {
    qr: {
      qrCodeId: 'qr_nike',
      retailerId: 'retailer_a',
      campaignId: 'campaign_1',
      activationId: 'activation_1',
      deploymentId: 'deployment_1',
      configurationVersion: 3,
      environment: 'PRODUCTION',
    },
    activation: {
      activationId: 'activation_1',
      retailerId: 'retailer_a',
      campaignId: 'campaign_1',
      status: 'ACTIVE',
      experienceConfig: {
        scanDestination: 'ai',
        sponsoredMedia,
      },
      target: {
        level: 'CATEGORY',
      },
      productContext: [],
    },
    campaign: {
      campaignId: 'campaign_1',
      retailerId: 'retailer_a',
      name: 'Test Campaign',
      status: 'ACTIVE',
    },
    deployment: {},
  };
}

function firestore() {
  const create = jest.fn().mockResolvedValue(undefined);

  return {
    create,
    db: {
      collection: jest.fn((name: string) => {
        if (name === 'qrExposures') {
          return {
            doc: jest.fn(() => ({
              create,
            })),
          };
        }

        if (name === 'tenants') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: false,
                data: () => undefined,
              }),
            })),
          };
        }

        if (name === 'shoppers') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: false,
                data: () => undefined,
              }),
            })),
          };
        }

        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: false,
              data: () => undefined,
            }),
          })),
        };
      }),
    },
  };
}

describe('getScanInteraction sponsored-media eligibility bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const store = firestore();
    mockGetDb.mockReturnValue(store.db);

    mockGenerate.mockResolvedValue({
      output: {
        messages: ['Hello! Ari here.'],
      },
    });
  });

  it('returns the server-established presentationId for canonical 15B media', async () => {
    mockResolveProductionQr.mockResolvedValue(
      resolvedQr({
        partnerId: 'partner_nike',
        creativeId: 'creative_nike_video',
        format: 'VIDEO',
        sponsorName: 'Nike',
        mediaUrl: 'https://example.com/nike.mp4',
        headline: 'Nike Air',
        destinationUrl: 'https://example.com/nike',
      })
    );

    mockEligibility.mockResolvedValue({
      eventId: 'sme_eligible_1',
      presentationId: 'smp_server_1',
    });

    const result = await getScanInteraction({
      qrId: 'qr_nike',
    });

    expect(mockEligibility).toHaveBeenCalledTimes(1);
    expect(mockEligibility).toHaveBeenCalledWith('qr_nike');

    expect(result.sponsoredMedia).toEqual(
      expect.objectContaining({
        format: 'VIDEO',
        sponsorName: 'Nike',
        mediaUrl: 'https://example.com/nike.mp4',
        presentationId: 'smp_server_1',
      })
    );

    expect(result.sponsoredMedia).not.toHaveProperty('partnerId');
    expect(result.sponsoredMedia).not.toHaveProperty('creativeId');
  });

  it('preserves legacy 15A media without establishing eligibility', async () => {
    mockResolveProductionQr.mockResolvedValue(
      resolvedQr({
        format: 'VIDEO',
        sponsorName: 'Legacy Sponsor',
        mediaUrl: 'https://example.com/legacy.mp4',
      })
    );

    const result = await getScanInteraction({
      qrId: 'qr_legacy',
    });

    expect(mockEligibility).not.toHaveBeenCalled();

    expect(result.sponsoredMedia).toEqual(
      expect.objectContaining({
        format: 'VIDEO',
        sponsorName: 'Legacy Sponsor',
        mediaUrl: 'https://example.com/legacy.mp4',
      })
    );

    expect(result.sponsoredMedia?.presentationId).toBeUndefined();
  });
});
