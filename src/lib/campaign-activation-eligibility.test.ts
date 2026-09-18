import {
  requireCampaignAllowsActivationSchedule,
  requireCampaignAllowsActiveActivation,
} from './campaign-activation-eligibility';

function ts(milliseconds: number) {
  return {
    seconds: Math.floor(milliseconds / 1000),
    nanoseconds: (milliseconds % 1000) * 1_000_000,
  };
}

function campaign(
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED',
  startAt = ts(1000),
  endAt: ReturnType<typeof ts> | undefined = ts(10000)
) {
  return {
    campaignId: 'campaign-1',
    retailerId: 'retailer-1',
    name: 'Test Campaign',
    status,
    startAt,
    endAt,
    createdAt: ts(0),
    createdBy: 'user-1',
    updatedAt: ts(0),
    updatedBy: 'user-1',
  } as any;
}

describe('Campaign → Activation schedule eligibility', () => {
  test.each(['DRAFT', 'PAUSED', 'ENDED', 'ARCHIVED'] as const)(
    'rejects %s Campaign',
    (status) => {
      expect(() =>
        requireCampaignAllowsActivationSchedule(
          campaign(status),
          ts(2000),
          ts(5000)
        )
      ).toThrow('CAMPAIGN_UNAVAILABLE');
    }
  );

  test.each(['SCHEDULED', 'ACTIVE'] as const)(
    'allows Activation inside %s Campaign window',
    (status) => {
      expect(() =>
        requireCampaignAllowsActivationSchedule(
          campaign(status),
          ts(2000),
          ts(5000)
        )
      ).not.toThrow();
    }
  );

  test('rejects Activation starting before Campaign', () => {
    expect(() =>
      requireCampaignAllowsActivationSchedule(
        campaign('SCHEDULED'),
        ts(500),
        ts(5000)
      )
    ).toThrow('ACTIVATION_OUTSIDE_CAMPAIGN_WINDOW');
  });

  test('rejects Activation ending after Campaign', () => {
    expect(() =>
      requireCampaignAllowsActivationSchedule(
        campaign('SCHEDULED'),
        ts(2000),
        ts(11000)
      )
    ).toThrow('ACTIVATION_OUTSIDE_CAMPAIGN_WINDOW');
  });

  test('rejects Activation starting after Campaign end', () => {
    expect(() =>
      requireCampaignAllowsActivationSchedule(
        campaign('SCHEDULED'),
        ts(11000)
      )
    ).toThrow('ACTIVATION_OUTSIDE_CAMPAIGN_WINDOW');
  });

  test('allows child without endAt under bounded Campaign', () => {
    expect(() =>
      requireCampaignAllowsActivationSchedule(
        campaign('SCHEDULED'),
        ts(2000)
      )
    ).not.toThrow();
  });

  test('allows bounded child under Campaign without endAt', () => {
    const value = campaign('ACTIVE');
    delete value.endAt;

    expect(() =>
      requireCampaignAllowsActivationSchedule(
        value,
        ts(2000),
        ts(20000)
      )
    ).not.toThrow();
  });

  test('rejects Campaign without startAt', () => {
    const value = campaign('SCHEDULED');
    delete value.startAt;

    expect(() =>
      requireCampaignAllowsActivationSchedule(
        value,
        ts(2000),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_START_REQUIRED');
  });
});

describe('Campaign → ACTIVE Activation eligibility', () => {
  test('allows ACTIVE Campaign inside its live window', () => {
    expect(() =>
      requireCampaignAllowsActiveActivation(
        campaign('ACTIVE', ts(1000), ts(10000)),
        ts(5000)
      )
    ).not.toThrow();
  });

  test('rejects SCHEDULED Campaign even when its startAt has arrived', () => {
    expect(() =>
      requireCampaignAllowsActiveActivation(
        campaign('SCHEDULED', ts(1000), ts(10000)),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_NOT_ACTIVE');
  });

  test.each(['DRAFT', 'PAUSED', 'ENDED', 'ARCHIVED'] as const)(
    'rejects %s Campaign',
    (status) => {
      expect(() =>
        requireCampaignAllowsActiveActivation(
          campaign(status, ts(1000), ts(10000)),
          ts(5000)
        )
      ).toThrow('CAMPAIGN_NOT_ACTIVE');
    }
  );

  test('rejects ACTIVE Campaign before startAt', () => {
    expect(() =>
      requireCampaignAllowsActiveActivation(
        campaign('ACTIVE', ts(6000), ts(10000)),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_NOT_STARTED');
  });

  test('rejects ACTIVE Campaign after endAt', () => {
    expect(() =>
      requireCampaignAllowsActiveActivation(
        campaign('ACTIVE', ts(1000), ts(4000)),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_ENDED');
  });

  test('allows ACTIVE Campaign without endAt after startAt', () => {
    const value = campaign('ACTIVE');
    delete value.endAt;

    expect(() =>
      requireCampaignAllowsActiveActivation(
        value,
        ts(5000)
      )
    ).not.toThrow();
  });
});
