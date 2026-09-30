import {
  PLATFORM_AI_GOVERNANCE_V1_CONTROL_COUNT,
  PLATFORM_AI_GOVERNANCE_V1_CONTROLS,
  PLATFORM_AI_GOVERNANCE_V1_DOMAIN_COUNT,
  PLATFORM_AI_GOVERNANCE_V1_DOMAINS,
  PLATFORM_AI_GOVERNANCE_V1_ID,
  PLATFORM_AI_GOVERNANCE_V1_VERSION,
} from './platform-governance-v1';

describe('Platform AI Governance v1 identity catalogue', () => {
  test('has the canonical governance identity and version', () => {
    expect(PLATFORM_AI_GOVERNANCE_V1_ID).toBe(
      'INTERACT-AI-GOVERNANCE-V1',
    );
    expect(PLATFORM_AI_GOVERNANCE_V1_VERSION).toBe('1.0.0');
  });

  test('contains exactly 17 governance domains', () => {
    expect(PLATFORM_AI_GOVERNANCE_V1_DOMAIN_COUNT).toBe(17);
    expect(PLATFORM_AI_GOVERNANCE_V1_DOMAINS).toHaveLength(17);
  });

  test('contains exactly 140 governance controls', () => {
    expect(PLATFORM_AI_GOVERNANCE_V1_CONTROL_COUNT).toBe(140);
    expect(PLATFORM_AI_GOVERNANCE_V1_CONTROLS).toHaveLength(140);
  });

  test('contains no duplicate domain IDs', () => {
    const ids = PLATFORM_AI_GOVERNANCE_V1_DOMAINS.map(
      (domain) => domain.domainId,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('contains no duplicate control IDs', () => {
    const ids = PLATFORM_AI_GOVERNANCE_V1_CONTROLS.map(
      (control) => control.controlId,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('each domain contains its locked control count', () => {
    for (const domain of PLATFORM_AI_GOVERNANCE_V1_DOMAINS) {
      expect(domain.controls).toHaveLength(domain.expectedControlCount);
    }
  });

  test('control IDs belong to their declared domain', () => {
    for (const domain of PLATFORM_AI_GOVERNANCE_V1_DOMAINS) {
      for (const control of domain.controls) {
        expect(control.controlId.startsWith(`${domain.domainId}-`)).toBe(
          true,
        );
      }
    }
  });

  test('domain IDs use the canonical GOV-XX format', () => {
    for (const domain of PLATFORM_AI_GOVERNANCE_V1_DOMAINS) {
      expect(domain.domainId).toMatch(/^GOV-\d{2}$/);
    }
  });

  test('control IDs use the canonical GOV-XX-NNN format', () => {
    for (const control of PLATFORM_AI_GOVERNANCE_V1_CONTROLS) {
      expect(control.controlId).toMatch(/^GOV-\d{2}-\d{3}$/);
    }
  });

  test('all domains and controls have non-empty titles', () => {
    for (const domain of PLATFORM_AI_GOVERNANCE_V1_DOMAINS) {
      expect(domain.title.trim().length).toBeGreaterThan(0);

      for (const control of domain.controls) {
        expect(control.title.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
