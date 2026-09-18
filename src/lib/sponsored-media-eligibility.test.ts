jest.mock('./firebase-admin', () => ({
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

jest.mock('./sponsored-media-resolution', () => ({
  resolveSponsoredMediaForProductionQr: jest.fn(),
}));

import { getDb } from './firebase-admin';
import { resolveSponsoredMediaForProductionQr } from './sponsored-media-resolution';
import { establishSponsoredMediaEligibility } from './sponsored-media-eligibility';

const mockGetDb = getDb as jest.Mock;
const mockResolve = resolveSponsoredMediaForProductionQr as jest.Mock;

describe('establishSponsoredMediaEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a server-established canonical ELIGIBLE presentation opportunity', async () => {
    const create = jest.fn().mockResolvedValue(undefined);

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({ create })),
      })),
    });

    mockResolve.mockResolvedValue({
      qrContext: {
        qr: {
          retailerId: 'retailer_a',
          campaignId: 'campaign_1',
          activationId: 'activation_1',
          deploymentId: 'deployment_1',
          qrCodeId: 'qr_1',
          configurationVersion: 3,
          environment: 'PRODUCTION',
        },
      },
      creative: {
        creativeId: 'creative_nike',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        format: 'VIDEO',
      },
    });

    const result = await establishSponsoredMediaEligibility('qr_1');

    expect(result.eventId).toMatch(/^sme_/);
    expect(result.presentationId).toMatch(/^smp_/);

    expect(create).toHaveBeenCalledTimes(1);

    const event = create.mock.calls[0][0];

    expect(event).toEqual(
      expect.objectContaining({
        eventId: result.eventId,
        presentationId: result.presentationId,
        eventType: 'ELIGIBLE',
        retailerId: 'retailer_a',
        campaignId: 'campaign_1',
        activationId: 'activation_1',
        deploymentId: 'deployment_1',
        qrCodeId: 'qr_1',
        partnerId: 'partner_nike',
        creativeId: 'creative_nike',
        format: 'VIDEO',
        configurationVersion: 3,
        environment: 'PRODUCTION',
      })
    );

    expect(event).not.toHaveProperty('sessionId');
    expect(event).not.toHaveProperty('shopperId');
    expect(event).not.toHaveProperty('uid');
  });

  it('rejects malformed qrId before writing', async () => {
    const create = jest.fn();

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({ create })),
      })),
    });

    await expect(
      establishSponsoredMediaEligibility('   ')
    ).rejects.toThrow();

    expect(mockResolve).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('does not write when canonical sponsored media resolution fails', async () => {
    const create = jest.fn();

    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({ create })),
      })),
    });

    mockResolve.mockRejectedValue(
      new Error('SPONSORED_MEDIA_NOT_MEASURABLE')
    );

    await expect(
      establishSponsoredMediaEligibility('qr_legacy')
    ).rejects.toThrow('SPONSORED_MEDIA_NOT_MEASURABLE');

    expect(create).not.toHaveBeenCalled();
  });
});
