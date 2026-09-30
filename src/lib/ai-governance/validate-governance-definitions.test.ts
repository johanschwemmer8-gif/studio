import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const validDefinition = {
  controlId: 'GOV-05-001',
  domain: 'GOV-05',
  title: 'No Manufacturing of Facts',
  requirement: 'AI outputs must not manufacture unsupported facts.',
  risk: 'Unsupported factual claims may mislead users and undermine evidence integrity.',
  controlStatement: 'Ari must not present unsupported factual claims as established fact.',
  authority: 'IMMUTABLE_PLATFORM_INVARIANT',
  applicability: 'PLATFORM',
  enforcementTypes: ['EVIDENCE_BOUNDARY', 'MODEL_INSTRUCTION'],
  standardsMappings: [],
  visibility: 'READ_ONLY',
  retailerExtensibility: 'NONE',
} as const;

describe('validatePlatformAiGovernanceDefinitions', () => {
  test('accepts a structurally valid canonical definition', () => {
    const result = validatePlatformAiGovernanceDefinitions([
      validDefinition,
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].controlId).toBe('GOV-05-001');
  });

  test('rejects an unknown control ID', () => {
    expect(() =>
      validatePlatformAiGovernanceDefinitions([
        {
          ...validDefinition,
          controlId: 'GOV-99-999',
        },
      ]),
    ).toThrow('UNKNOWN_GOVERNANCE_CONTROL:GOV-99-999');
  });

  test('rejects a domain mismatch', () => {
    expect(() =>
      validatePlatformAiGovernanceDefinitions([
        {
          ...validDefinition,
          domain: 'GOV-06',
        },
      ]),
    ).toThrow(
      'GOVERNANCE_CONTROL_DOMAIN_MISMATCH:GOV-05-001',
    );
  });

  test('rejects a title mismatch', () => {
    expect(() =>
      validatePlatformAiGovernanceDefinitions([
        {
          ...validDefinition,
          title: 'Changed title',
        },
      ]),
    ).toThrow(
      'GOVERNANCE_CONTROL_TITLE_MISMATCH:GOV-05-001',
    );
  });

  test('rejects duplicate control definitions', () => {
    expect(() =>
      validatePlatformAiGovernanceDefinitions([
        validDefinition,
        validDefinition,
      ]),
    ).toThrow(
      'DUPLICATE_GOVERNANCE_CONTROL_DEFINITION:GOV-05-001',
    );
  });

  test('rejects structurally invalid definitions', () => {
    expect(() =>
      validatePlatformAiGovernanceDefinitions([
        {
          ...validDefinition,
          requirement: '',
        },
      ]),
    ).toThrow();
  });
});
