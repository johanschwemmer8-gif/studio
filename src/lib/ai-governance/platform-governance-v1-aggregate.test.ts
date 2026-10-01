import {
  PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS,
  getPlatformAiGovernanceV1Definition,
} from './platform-governance-v1-definitions';

describe('Platform AI Governance v1 definition aggregate', () => {
  it('contains exactly 140 unique canonical controls', () => {
    const ids = PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS.map(
      (control) => control.controlId
    );

    expect(PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS).toHaveLength(140);
    expect(new Set(ids).size).toBe(140);
  });

  it('contains only canonical retailer extensibility values', () => {
    for (const control of PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS) {
      expect(['NONE', 'ADDITIVE_ONLY']).toContain(
        control.retailerExtensibility
      );
    }
  });

  it('looks up canonical definitions by control ID', () => {
    const control =
      getPlatformAiGovernanceV1Definition('GOV-04-005');

    expect(control?.controlId).toBe('GOV-04-005');
  });

  it('returns undefined for an unknown control ID', () => {
    expect(
      getPlatformAiGovernanceV1Definition('GOV-99-999')
    ).toBeUndefined();
  });

  it('reports the existing extensibility distribution', () => {
    const none =
      PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS.filter(
        (control) =>
          control.retailerExtensibility === 'NONE'
      ).length;

    const additiveOnly =
      PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS.filter(
        (control) =>
          control.retailerExtensibility === 'ADDITIVE_ONLY'
      ).length;

    console.log(
      `Retailer extensibility — NONE: ${none}, ADDITIVE_ONLY: ${additiveOnly}`
    );

    console.log(
      'ADDITIVE_ONLY controls:',
      PLATFORM_AI_GOVERNANCE_V1_DEFINITIONS
        .filter(
          (control) =>
            control.retailerExtensibility === 'ADDITIVE_ONLY'
        )
        .map((control) => `${control.controlId} — ${control.title}`)
    );

    expect(none + additiveOnly).toBe(140);
  });
});
