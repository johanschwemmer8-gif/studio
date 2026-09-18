import type { Campaign } from '@/lib/schemas/campaign';

/**
 * Campaigns offered as parents in the Activation workflow.
 *
 * This is presentation eligibility only. The authoritative lifecycle and
 * schedule validation remains server-side in scheduleActivation().
 *
 * A retailer may prepare an Activation under:
 * - SCHEDULED Campaign
 * - ACTIVE Campaign
 *
 * DRAFT, PAUSED, ENDED and ARCHIVED Campaigns must not be offered as
 * eligible Activation parents.
 */
export function campaignIsEligibleForActivationSelector(
  campaign: Pick<Campaign, 'status'>
): boolean {
  return campaign.status === 'SCHEDULED' || campaign.status === 'ACTIVE';
}
