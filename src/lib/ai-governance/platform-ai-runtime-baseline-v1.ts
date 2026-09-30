import {
  PLATFORM_AI_GOVERNANCE_V1_ID,
  PLATFORM_AI_GOVERNANCE_V1_VERSION,
} from './platform-governance-v1';

export const PLATFORM_AI_RUNTIME_BASELINE_V1 = {
  governanceId: PLATFORM_AI_GOVERNANCE_V1_ID,
  governanceVersion: PLATFORM_AI_GOVERNANCE_V1_VERSION,

  controlIds: [
    'GOV-02-002',
    'GOV-02-005',
    'GOV-02-006',
    'GOV-02-008',
    'GOV-03-007',
    'GOV-04-004',
    'GOV-04-007',
    'GOV-04-008',
    'GOV-14-002',
    'GOV-14-003',
    'GOV-14-005',
    'GOV-14-006',
    'GOV-14-008',
  ],
} as const;
