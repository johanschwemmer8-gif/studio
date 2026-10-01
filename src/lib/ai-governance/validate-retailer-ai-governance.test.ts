import {
  validateRetailerAiGovernance,
  validateRetailerAiGovernanceRule,
} from './validate-retailer-ai-governance';

describe('Retailer Additive AI Governance authority', () => {
  const transparencyRule = {
    ruleId: 'rule-001',
    ruleType: 'TRANSPARENCY_REQUIREMENT' as const,
    platformControlId: 'GOV-12-001',
    title: 'Additional AI disclosure',
    description:
      'Retailer requires an additional AI interaction disclosure.',
    value: 'Additional retailer AI disclosure.',
  };

  it('accepts a permitted additive transparency rule', () => {
    expect(
      validateRetailerAiGovernanceRule(
        transparencyRule
      )
    ).toEqual(transparencyRule);
  });

  it('rejects an unknown Platform control', () => {
    expect(() =>
      validateRetailerAiGovernanceRule({
        ...transparencyRule,
        platformControlId: 'GOV-99-999',
      })
    ).toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:UNKNOWN_PLATFORM_CONTROL'
    );
  });

  it('rejects a Platform control with NONE extensibility', () => {
    expect(() =>
      validateRetailerAiGovernanceRule({
        ...transparencyRule,
        platformControlId: 'GOV-05-001',
      })
    ).toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:PLATFORM_CONTROL_NOT_EXTENSIBLE'
    );
  });

  it('rejects an ADDITIVE_ONLY control outside the rule type allowlist', () => {
    expect(() =>
      validateRetailerAiGovernanceRule({
        ...transparencyRule,
        platformControlId: 'GOV-13-007',
      })
    ).toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:RULE_CONTROL_MISMATCH'
    );
  });

  it('accepts the permitted sponsorship disclosure mapping', () => {
    expect(() =>
      validateRetailerAiGovernanceRule({
        ...transparencyRule,
        ruleType:
          'SPONSORSHIP_DISCLOSURE_REQUIREMENT',
        platformControlId: 'GOV-09-005',
      })
    ).not.toThrow();
  });

  it('accepts the permitted complaint and recourse mapping', () => {
    expect(() =>
      validateRetailerAiGovernanceRule({
        ...transparencyRule,
        ruleType:
          'COMPLAINT_RECOURSE_REQUIREMENT',
        platformControlId: 'GOV-13-007',
      })
    ).not.toThrow();
  });

  it('rejects duplicate retailer rule IDs', () => {
    expect(() =>
      validateRetailerAiGovernance({
        retailerId: 'retailer-001',
        governanceVersion: '1.0.0',
        status: 'ACTIVE',
        additiveRules: [
          transparencyRule,
          {
            ...transparencyRule,
            title: 'Duplicate rule',
          },
        ],
        createdAt: {},
        createdBy: 'user-001',
        updatedAt: {},
        updatedBy: 'user-001',
      })
    ).toThrow(
      'RETAILER_AI_GOVERNANCE_DENIED:DUPLICATE_RULE_ID'
    );
  });
});
