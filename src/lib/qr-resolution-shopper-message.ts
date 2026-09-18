export type QrResolutionShopperMessage = {
  title: string;
  description: string;
};

const NOT_YET_AVAILABLE: QrResolutionShopperMessage = {
  title: "This experience isn't available yet",
  description:
    'Please try again later. This in-store experience has not started yet.',
};

const TEMPORARILY_UNAVAILABLE: QrResolutionShopperMessage = {
  title: 'This experience is temporarily unavailable',
  description:
    'Please try again later. This in-store experience is not available right now.',
};

const NO_LONGER_AVAILABLE: QrResolutionShopperMessage = {
  title: 'This experience is no longer available',
  description:
    'This in-store experience has ended and can no longer be opened.',
};

const GENERIC_FAILURE: QrResolutionShopperMessage = {
  title: "We couldn't open this experience",
  description:
    'Please check the QR code and try again, or ask a store team member for assistance.',
};

export function getQrResolutionShopperMessage(
  code: string | undefined
): QrResolutionShopperMessage {
  switch (code) {
    case 'CAMPAIGN_NOT_ACTIVE':
    case 'CAMPAIGN_NOT_STARTED':
    case 'ACTIVATION_NOT_STARTED':
      return NOT_YET_AVAILABLE;

    case 'CAMPAIGN_PAUSED':
    case 'ACTIVATION_UNAVAILABLE':
      return TEMPORARILY_UNAVAILABLE;

    case 'CAMPAIGN_ENDED':
    case 'CAMPAIGN_ARCHIVED':
    case 'ACTIVATION_ENDED':
    case 'QR_RETIRED':
    case 'DEPLOYMENT_REMOVED':
      return NO_LONGER_AVAILABLE;

    default:
      return GENERIC_FAILURE;
  }
}
