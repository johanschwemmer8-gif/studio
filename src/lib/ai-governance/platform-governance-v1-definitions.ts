/**
 * Canonical aggregate of the validated Platform AI Governance v1
 * control definitions.
 *
 * This module does not redefine governance. It provides one
 * authoritative lookup surface over the existing GOV-01–GOV-17
 * validated definition modules.
 */

import { PLATFORM_AI_GOVERNANCE_V1_GOV_01 } from './platform-governance-v1-gov-01';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_02 } from './platform-governance-v1-gov-02';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_03 } from './platform-governance-v1-gov-03';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_04 } from './platform-governance-v1-gov-04';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_05 } from './platform-governance-v1-gov-05';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_06 } from './platform-governance-v1-gov-06';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_07 } from './platform-governance-v1-gov-07';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_08 } from './platform-governance-v1-gov-08';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_09 } from './platform-governance-v1-gov-09';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_10 } from './platform-governance-v1-gov-10';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_11 } from './platform-governance-v1-gov-11';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_12 } from './platform-governance-v1-gov-12';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_13 } from './platform-governance-v1-gov-13';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_14 } from './platform-governance-v1-gov-14';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_15 } from './platform-governance-v1-gov-15';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_16 } from './platform-governance-v1-gov-16';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_17 } from './platform-governance-v1-gov-17';

export const PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS = [
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_01,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_02,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_03,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_04,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_05,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_06,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_07,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_08,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_09,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_10,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_11,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_12,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_13,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_14,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_15,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_16,
  ...PLATFORM_AI_GOVERNANCE_V1_GOV_17,
];

export function getPlatformAiGovernanceV1Definition(
  controlId: string
) {
  return PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS.find(
    (control) => control.controlId === controlId
  );
}
