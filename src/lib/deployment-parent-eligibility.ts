import type { Campaign } from '@/lib/schemas/campaign';
import type { Activation } from '@/lib/schemas/activation';
import {
  requireCampaignAllowsActivationSchedule,
  requireCampaignAllowsActiveActivation,
} from '@/lib/campaign-activation-eligibility';

type TimestampLike = {
  seconds: number;
  nanoseconds: number;
};

export function requireParentsAllowDeployment(
  campaign: Campaign,
  activation: Activation,
  now: TimestampLike
): void {
  if (
    activation.status !== 'SCHEDULED' &&
    activation.status !== 'ACTIVE'
  ) {
    throw new Error(
      'ACTIVATION_UNAVAILABLE_FOR_DEPLOYMENT: Only SCHEDULED or ACTIVE Activations may receive a new physical Deployment.'
    );
  }

  if (activation.startAt === undefined) {
    throw new Error(
      'ACTIVATION_START_REQUIRED: Activation must have a startAt before physical Deployment.'
    );
  }

  requireCampaignAllowsActivationSchedule(
    campaign,
    activation.startAt,
    activation.endAt
  );

  if (activation.status === 'ACTIVE') {
    requireCampaignAllowsActiveActivation(
      campaign,
      now
    );
  }
}
