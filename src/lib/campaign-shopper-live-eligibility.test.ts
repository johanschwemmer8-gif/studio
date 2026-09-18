import { requireCampaignShopperLive } from './campaign-shopper-live-eligibility';

const ts = (ms: number) => ({
  seconds: Math.floor(ms / 1000),
  nanoseconds: (ms % 1000) * 1_000_000,
});

const campaign = (
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED',
  startAt = ts(1000),
  endAt = ts(10000)
) =>
  ({
    campaignId: 'campaign-1',
    retailerId: 'retailer-1',
    status,
    startAt,
    endAt,
  }) as any;

describe('Campaign shopper-live eligibility', () => {
  test('allows ACTIVE Campaign inside its live window', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('ACTIVE'),
        ts(5000)
      )
    ).not.toThrow();
  });

  test('rejects DRAFT Campaign', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('DRAFT'),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_UNAVAILABLE');
  });

  test('rejects SCHEDULED Campaign even after startAt has arrived', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('SCHEDULED'),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_NOT_ACTIVE');
  });

  test('rejects PAUSED Campaign', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('PAUSED'),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_PAUSED');
  });

  test('rejects ENDED Campaign', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('ENDED'),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_ENDED');
  });

  test('rejects ARCHIVED Campaign', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('ARCHIVED'),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_ARCHIVED');
  });

  test('rejects ACTIVE Campaign before startAt', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('ACTIVE'),
        ts(500)
      )
    ).toThrow('CAMPAIGN_NOT_STARTED');
  });

  test('rejects ACTIVE Campaign after endAt', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('ACTIVE'),
        ts(11000)
      )
    ).toThrow('CAMPAIGN_ENDED');
  });

  test('allows ACTIVE Campaign exactly at startAt', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('ACTIVE'),
        ts(1000)
      )
    ).not.toThrow();
  });

  test('allows ACTIVE Campaign exactly at endAt', () => {
    expect(() =>
      requireCampaignShopperLive(
        campaign('ACTIVE'),
        ts(10000)
      )
    ).not.toThrow();
  });

  test('allows ACTIVE Campaign without endAt after startAt', () => {
    const value = campaign('ACTIVE');
    delete value.endAt;

    expect(() =>
      requireCampaignShopperLive(
        value,
        ts(5000)
      )
    ).not.toThrow();
  });
});
