import type { CampaignStatus } from '@/lib/schemas/retail-domain';

/**
 * Canonical Campaign lifecycle transitions.
 *
 * Campaign status changes must occur through explicit lifecycle operations.
 * General Campaign updates must not arbitrarily mutate lifecycle status.
 *
 * ARCHIVED is terminal.
 */
const CAMPAIGN_TRANSITIONS: Readonly<
  Record<CampaignStatus, readonly CampaignStatus[]>
> = {
  DRAFT: ['SCHEDULED', 'ACTIVE', 'ARCHIVED'],
  SCHEDULED: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['PAUSED', 'ENDED', 'ARCHIVED'],
  PAUSED: ['ACTIVE', 'ENDED', 'ARCHIVED'],
  ENDED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function canTransitionCampaign(
  from: CampaignStatus,
  to: CampaignStatus
): boolean {
  return CAMPAIGN_TRANSITIONS[from].includes(to);
}

export function requireCampaignTransition(
  from: CampaignStatus,
  to: CampaignStatus
): void {
  if (!canTransitionCampaign(from, to)) {
    throw new Error(
      `INVALID_CAMPAIGN_TRANSITION: Campaign cannot transition from ${from} to ${to}.`
    );
  }
}
