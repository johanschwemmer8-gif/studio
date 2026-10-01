import type {
  RetailerAiGovernance,
  RetailerAiGovernanceRule,
  RetailerAiGovernanceRuleType,
} from '@/lib/schemas/retailer-ai-governance';

import {
  RetailerAiGovernanceSchema,
} from '@/lib/schemas/retailer-ai-governance';

import {
  getPlatformAiGovernanceV1Definition,
} from './platform-governance-v1-definitions';

const PERMITTED_PLATFORM_CONTROLS_BY_RULE_TYPE: Record<
  RetailerAiGovernanceRuleType,
  readonly string[]
> = {
  TRANSPARENCY_REQUIREMENT: [
    'GOV-12-001',
    'GOV-12-002',
  ],
  SPONSORSHIP_DISCLOSURE_REQUIREMENT: [
    'GOV-09-005',
    'GOV-12-006',
  ],
  COMPLAINT_RECOURSE_REQUIREMENT: [
    'GOV-13-007',
  ],
};

export function validateRetailerAiGovernanceRule(
  rule: RetailerAiGovernanceRule
): RetailerAiGovernanceRule {
  const definition =
    getPlatformAiGovernanceV1Definition(
      rule.platformControlId
    );

  if (!definition) {
    throw new Error(
      `RETAILER_AI_GOVERNANCE_DENIED:UNKNOWN_PLATFORM_CONTROL:${rule.platformControlId}`
    );
  }

  if (
    definition.retailerExtensibility !==
    'ADDITIVE_ONLY'
  ) {
    throw new Error(
      `RETAILER_AI_GOVERNANCE_DENIED:PLATFORM_CONTROL_NOT_EXTENSIBLE:${rule.platformControlId}`
    );
  }

  const permittedControls =
    PERMITTED_PLATFORM_CONTROLS_BY_RULE_TYPE[
      rule.ruleType
    ];

  if (
    !permittedControls.includes(
      rule.platformControlId
    )
  ) {
    throw new Error(
      `RETAILER_AI_GOVERNANCE_DENIED:RULE_CONTROL_MISMATCH:${rule.ruleType}:${rule.platformControlId}`
    );
  }

  return rule;
}

export function validateRetailerAiGovernance(
  input: unknown
): RetailerAiGovernance {
  const governance =
    RetailerAiGovernanceSchema.parse(input);

  const ruleIds = new Set<string>();

  for (const rule of governance.additiveRules) {
    if (ruleIds.has(rule.ruleId)) {
      throw new Error(
        `RETAILER_AI_GOVERNANCE_DENIED:DUPLICATE_RULE_ID:${rule.ruleId}`
      );
    }

    ruleIds.add(rule.ruleId);

    validateRetailerAiGovernanceRule(rule);
  }

  return governance;
}
