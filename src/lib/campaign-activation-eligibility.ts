import type { Campaign } from '@/lib/schemas/campaign';

type TimestampLike = {
  seconds: number;
  nanoseconds: number;
};

export function timestampToMillis(value: TimestampLike): number {
  return value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000);
}

export function requireCampaignAllowsActivationSchedule(
  campaign: Campaign,
  activationStartAt: TimestampLike,
  activationEndAt?: TimestampLike
): void {
  if (
    campaign.status !== 'SCHEDULED' &&
    campaign.status !== 'ACTIVE'
  ) {
    throw new Error(
      'CAMPAIGN_UNAVAILABLE: Parent Campaign must be SCHEDULED or ACTIVE before its Activation can be scheduled.'
    );
  }

  if (campaign.startAt === undefined) {
    throw new Error(
      'CAMPAIGN_START_REQUIRED: Parent Campaign must have a startAt before its Activation can be scheduled.'
    );
  }

  const campaignStartMillis = timestampToMillis(campaign.startAt);
  const activationStartMillis = timestampToMillis(activationStartAt);

  if (activationStartMillis < campaignStartMillis) {
    throw new Error(
      'ACTIVATION_OUTSIDE_CAMPAIGN_WINDOW: Activation cannot start before its parent Campaign.'
    );
  }

  if (
    campaign.endAt !== undefined &&
    activationEndAt !== undefined &&
    timestampToMillis(activationEndAt) >
      timestampToMillis(campaign.endAt)
  ) {
    throw new Error(
      'ACTIVATION_OUTSIDE_CAMPAIGN_WINDOW: Activation cannot end after its parent Campaign.'
    );
  }

  if (
    campaign.endAt !== undefined &&
    activationStartMillis > timestampToMillis(campaign.endAt)
  ) {
    throw new Error(
      'ACTIVATION_OUTSIDE_CAMPAIGN_WINDOW: Activation cannot start after its parent Campaign has ended.'
    );
  }
}

export function requireCampaignAllowsActiveActivation(
  campaign: Campaign,
  now: TimestampLike
): void {
  if (campaign.status !== 'ACTIVE') {
    throw new Error(
      'CAMPAIGN_NOT_ACTIVE: Activation cannot become ACTIVE unless its parent Campaign is ACTIVE.'
    );
  }

  if (
    campaign.startAt !== undefined &&
    timestampToMillis(campaign.startAt) > timestampToMillis(now)
  ) {
    throw new Error(
      'CAMPAIGN_NOT_STARTED: Activation cannot become ACTIVE before its parent Campaign starts.'
    );
  }

  if (
    campaign.endAt !== undefined &&
    timestampToMillis(campaign.endAt) < timestampToMillis(now)
  ) {
    throw new Error(
      'CAMPAIGN_ENDED: Activation cannot become ACTIVE after its parent Campaign ends.'
    );
  }
}
