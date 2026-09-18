import { campaignIsEligibleForActivationSelector } from './campaign-activation-selector-eligibility';

describe('Campaign Activation selector eligibility', () => {
  test.each([
    ['DRAFT', false],
    ['SCHEDULED', true],
    ['ACTIVE', true],
    ['PAUSED', false],
    ['ENDED', false],
    ['ARCHIVED', false],
  ] as const)('%s → %s', (status, expected) => {
    expect(
      campaignIsEligibleForActivationSelector({ status })
    ).toBe(expected);
  });
});
