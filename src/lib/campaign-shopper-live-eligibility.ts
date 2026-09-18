import type { Campaign } from '@/lib/schemas/campaign';

type TimestampLike = {
  seconds: number;
  nanoseconds: number;
};

function timestampToMillis(value: TimestampLike): number {
  return (
    value.seconds * 1000 +
    Math.floor(value.nanoseconds / 1_000_000)
  );
}

export function requireCampaignShopperLive(
  campaign: Campaign,
  now: TimestampLike
): void {
  switch (campaign.status) {
    case 'DRAFT':
      throw new Error('CAMPAIGN_UNAVAILABLE');

    case 'SCHEDULED':
      throw new Error('CAMPAIGN_NOT_ACTIVE');

    case 'PAUSED':
      throw new Error('CAMPAIGN_PAUSED');

    case 'ENDED':
      throw new Error('CAMPAIGN_ENDED');

    case 'ARCHIVED':
      throw new Error('CAMPAIGN_ARCHIVED');

    case 'ACTIVE':
      break;
  }

  if (
    campaign.startAt !== undefined &&
    timestampToMillis(campaign.startAt) > timestampToMillis(now)
  ) {
    throw new Error('CAMPAIGN_NOT_STARTED');
  }

  if (
    campaign.endAt !== undefined &&
    timestampToMillis(campaign.endAt) < timestampToMillis(now)
  ) {
    throw new Error('CAMPAIGN_ENDED');
  }
}
