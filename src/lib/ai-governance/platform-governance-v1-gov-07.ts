import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-07-001',
    domain: 'GOV-07',
    title: 'Data Minimisation & Purpose Limitation',
    requirement:
      'Governed AI processing must limit personal and contextual data to what is authorized and reasonably necessary for the applicable purpose.',
    risk:
      'Excessive or unrelated data processing may create unnecessary privacy exposure and expand AI use beyond its authorized purpose.',
    controlStatement:
      'AI capabilities must process only data permitted for the governed purpose and must not collect or use additional personal data merely because it is technically available.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'PRIVACY_CONTROL',
      'DATA_GOVERNANCE',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-07-002',
    domain: 'GOV-07',
    title: 'PII Protection & Exclusion',
    requirement:
      'Personally identifiable information must be protected and excluded from AI processing where it is not authorized or necessary.',
    risk:
      'Unnecessary exposure of identifiable information to AI processing, logs or providers may create privacy, security and compliance risk.',
    controlStatement:
      'Governed AI capabilities must prevent unauthorized PII use and must exclude or minimize identifiable information in model inputs, outputs, telemetry and governance records where it is not required.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'PRIVACY_CONTROL',
      'DATA_GOVERNANCE',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-07-003',
    domain: 'GOV-07',
    title: 'Lawful-Basis & Consent-Aware Processing',
    requirement:
      'AI processing that depends on consent or another applicable processing authority must respect that authority and its relevant conditions.',
    risk:
      'AI functionality may process personal or behavioral data without the required authorization or after applicable consent has been withheld.',
    controlStatement:
      'Where AI processing is conditional on consent or another applicable authorization, the capability must receive and enforce the authoritative processing state rather than infer or manufacture permission.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CONDITIONAL',
    enforcementTypes: [
      'PRIVACY_CONTROL',
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-07-004',
    domain: 'GOV-07',
    title: 'No Unauthorized Sensitive Inference',
    requirement:
      'Governed AI must not infer sensitive personal characteristics unless that inference is explicitly authorized, necessary and governed for the capability.',
    risk:
      'Sensitive characteristics may be inferred from behavioral or contextual signals and used without appropriate authority, evidence or safeguards.',
    controlStatement:
      'AI capabilities must not derive or act on sensitive personal characteristics from indirect signals unless the capability has explicit governed authority and applicable privacy safeguards for that processing.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'PRIVACY_CONTROL',
      'MODEL_INSTRUCTION',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-07-005',
    domain: 'GOV-07',
    title: 'Anonymous/Pseudonymous/Unauthenticated Identity Separation',
    requirement:
      'Anonymous, pseudonymous and authenticated identity contexts must remain distinguishable and must not be silently collapsed into a stronger identity claim.',
    risk:
      'Improper identity linkage may expose personal information, create unauthorized profiling or incorrectly attribute anonymous behavior to an identifiable person.',
    controlStatement:
      'AI and shopper-session processing must preserve authoritative identity state and must not convert anonymous, pseudonymous or unauthenticated activity into identified-person data without authorized identity evidence.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'PRIVACY_CONTROL',
      'SESSION_AUTHORITY',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-07-006',
    domain: 'GOV-07',
    title: 'Controlled Retention & Deletion',
    requirement:
      'AI-related data must be subject to defined retention and deletion requirements appropriate to its purpose, sensitivity and obligations.',
    risk:
      'Indefinite or uncontrolled retention may increase privacy, security and compliance exposure and preserve data beyond legitimate need.',
    controlStatement:
      'iNteract must define and enforce applicable retention and deletion rules for AI-related data and governance records, including justified exceptions where records must be retained for security, audit or legal purposes.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'PRIVACY_CONTROL',
      'DATA_GOVERNANCE',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-07-007',
    domain: 'GOV-07',
    title: 'AI Data Use & Model-Training Boundary',
    requirement:
      'Data provided to AI capabilities must not be used for model training or other secondary AI purposes unless that use is explicitly authorized and governed.',
    risk:
      'Operational, shopper, retailer or confidential data may be reused by AI providers or platform processes beyond the authorized purpose.',
    controlStatement:
      'iNteract must maintain explicit boundaries governing whether operational data may be used for model training, fine-tuning or other secondary AI purposes, and absence of explicit authorization must not be interpreted as permission.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'PRIVACY_CONTROL',
      'DATA_GOVERNANCE',
      'AUTHORIZATION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_07 =
  validatePlatformAiGovernanceDefinitions(definitions);
