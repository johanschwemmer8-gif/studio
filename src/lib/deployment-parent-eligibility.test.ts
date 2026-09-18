import { requireParentsAllowDeployment } from './deployment-parent-eligibility';

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

const activation = (
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'SCHEDULED'
    | 'ACTIVE'
    | 'PAUSED'
    | 'ENDED'
    | 'ARCHIVED',
  startAt = ts(2000),
  endAt = ts(9000)
) =>
  ({
    activationId: 'activation-1',
    retailerId: 'retailer-1',
    campaignId: 'campaign-1',
    status,
    startAt,
    endAt,
  }) as any;

describe('Deployment parent eligibility', () => {
  test('allows SCHEDULED Activation under SCHEDULED Campaign', () => {
    expect(() =>
      requireParentsAllowDeployment(
        campaign('SCHEDULED'),
        activation('SCHEDULED'),
        ts(1500)
      )
    ).not.toThrow();
  });

  test('allows SCHEDULED Activation under ACTIVE Campaign', () => {
    expect(() =>
      requireParentsAllowDeployment(
        campaign('ACTIVE'),
        activation('SCHEDULED'),
        ts(5000)
      )
    ).not.toThrow();
  });

  test('allows ACTIVE Activation under ACTIVE Campaign inside live window', () => {
    expect(() =>
      requireParentsAllowDeployment(
        campaign('ACTIVE'),
        activation('ACTIVE'),
        ts(5000)
      )
    ).not.toThrow();
  });

  test('rejects ACTIVE Activation under SCHEDULED Campaign', () => {
    expect(() =>
      requireParentsAllowDeployment(
        campaign('SCHEDULED'),
        activation('ACTIVE'),
        ts(5000)
      )
    ).toThrow('CAMPAIGN_NOT_ACTIVE');
  });

  test.each([
    'DRAFT',
    'PENDING_APPROVAL',
    'PAUSED',
    'ENDED',
    'ARCHIVED',
  ] as const)(
    'rejects %s Activation',
    (status) => {
      expect(() =>
        requireParentsAllowDeployment(
          campaign('ACTIVE'),
          activation(status),
          ts(5000)
        )
      ).toThrow('ACTIVATION_UNAVAILABLE_FOR_DEPLOYMENT');
    }
  );

  test.each([
    'DRAFT',
    'PAUSED',
    'ENDED',
    'ARCHIVED',
  ] as const)(
    'rejects SCHEDULED Activation under %s Campaign',
    (status) => {
      expect(() =>
        requireParentsAllowDeployment(
          campaign(status),
          activation('SCHEDULED'),
          ts(5000)
        )
      ).toThrow('CAMPAIGN_UNAVAILABLE');
    }
  );

  test('rejects Activation without startAt', () => {
    const value = activation('SCHEDULED');
    delete value.startAt;

    expect(() =>
      requireParentsAllowDeployment(
        campaign('SCHEDULED'),
        value,
        ts(1500)
      )
    ).toThrow('ACTIVATION_START_REQUIRED');
  });

  test('rejects Activation starting before Campaign', () => {
    expect(() =>
      requireParentsAllowDeployment(
        campaign('SCHEDULED'),
        activation('SCHEDULED', ts(500), ts(9000)),
        ts(100)
      )
    ).toThrow('ACTIVATION_OUTSIDE_CAMPAIGN_WINDOW');
  });

  test('rejects Activation ending after Campaign', () => {
    expect(() =>
      requireParentsAllowDeployment(
        campaign('SCHEDULED'),
        activation('SCHEDULED', ts(2000), ts(11000)),
        ts(100)
      )
    ).toThrow('ACTIVATION_OUTSIDE_CAMPAIGN_WINDOW');
  });

  test('allows future SCHEDULED hierarchy to be physically deployed early', () => {
    expect(() =>
      requireParentsAllowDeployment(
        campaign('SCHEDULED', ts(10000), ts(30000)),
        activation('SCHEDULED', ts(15000), ts(25000)),
        ts(1000)
      )
    ).not.toThrow();
  });
});
