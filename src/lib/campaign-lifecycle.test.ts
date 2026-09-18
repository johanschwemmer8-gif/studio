import {
  canTransitionCampaign,
  requireCampaignTransition,
} from './campaign-lifecycle';

describe('campaign lifecycle', () => {
  describe('allowed transitions', () => {
    const allowed = [
      ['DRAFT', 'SCHEDULED'],
      ['DRAFT', 'ACTIVE'],
      ['DRAFT', 'ARCHIVED'],
      ['SCHEDULED', 'ACTIVE'],
      ['SCHEDULED', 'ARCHIVED'],
      ['ACTIVE', 'PAUSED'],
      ['ACTIVE', 'ENDED'],
      ['ACTIVE', 'ARCHIVED'],
      ['PAUSED', 'ACTIVE'],
      ['PAUSED', 'ENDED'],
      ['PAUSED', 'ARCHIVED'],
      ['ENDED', 'ARCHIVED'],
    ] as const;

    it.each(allowed)('allows %s → %s', (from, to) => {
      expect(canTransitionCampaign(from, to)).toBe(true);
      expect(() => requireCampaignTransition(from, to)).not.toThrow();
    });
  });

  describe('forbidden transitions', () => {
    const forbidden = [
      ['DRAFT', 'PAUSED'],
      ['DRAFT', 'ENDED'],
      ['SCHEDULED', 'DRAFT'],
      ['SCHEDULED', 'PAUSED'],
      ['SCHEDULED', 'ENDED'],
      ['ACTIVE', 'DRAFT'],
      ['ACTIVE', 'SCHEDULED'],
      ['PAUSED', 'DRAFT'],
      ['PAUSED', 'SCHEDULED'],
      ['ENDED', 'DRAFT'],
      ['ENDED', 'SCHEDULED'],
      ['ENDED', 'ACTIVE'],
      ['ENDED', 'PAUSED'],
      ['ARCHIVED', 'DRAFT'],
      ['ARCHIVED', 'SCHEDULED'],
      ['ARCHIVED', 'ACTIVE'],
      ['ARCHIVED', 'PAUSED'],
      ['ARCHIVED', 'ENDED'],
    ] as const;

    it.each(forbidden)('rejects %s → %s', (from, to) => {
      expect(canTransitionCampaign(from, to)).toBe(false);

      expect(() => requireCampaignTransition(from, to)).toThrow(
        `INVALID_CAMPAIGN_TRANSITION: Campaign cannot transition from ${from} to ${to}.`
      );
    });
  });

  it('does not treat same-state writes as lifecycle transitions', () => {
    expect(canTransitionCampaign('DRAFT', 'DRAFT')).toBe(false);
    expect(canTransitionCampaign('SCHEDULED', 'SCHEDULED')).toBe(false);
    expect(canTransitionCampaign('ACTIVE', 'ACTIVE')).toBe(false);
    expect(canTransitionCampaign('PAUSED', 'PAUSED')).toBe(false);
    expect(canTransitionCampaign('ENDED', 'ENDED')).toBe(false);
    expect(canTransitionCampaign('ARCHIVED', 'ARCHIVED')).toBe(false);
  });

  it('treats ARCHIVED as terminal', () => {
    const targets = [
      'DRAFT',
      'SCHEDULED',
      'ACTIVE',
      'PAUSED',
      'ENDED',
    ] as const;

    for (const target of targets) {
      expect(canTransitionCampaign('ARCHIVED', target)).toBe(false);
    }
  });
});
