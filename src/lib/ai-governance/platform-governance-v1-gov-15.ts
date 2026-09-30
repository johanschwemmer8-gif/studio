import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-15-001',
    domain: 'GOV-15',
    title: 'Proportionate Authoritative AI Execution Logging',
    requirement:
      'Governed AI execution must produce authoritative logging proportionate to capability risk, operational need and applicable privacy boundaries.',
    risk:
      'Material AI activity may be impossible to investigate or govern when execution records are absent, unreliable or excessively incomplete.',
    controlStatement:
      'iNteract must record proportionate authoritative AI execution metadata sufficient for applicable monitoring, investigation and governance without indiscriminately duplicating prompts, responses, PII or sensitive content.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'AUDIT_LOGGING',
      'PRIVACY_CONTROL',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-15-002',
    domain: 'GOV-15',
    title: 'Governance Version & Control Provenance',
    requirement:
      'Material governed AI execution must retain sufficient provenance to identify the applicable governance version and relevant control context.',
    risk:
      'AI outcomes may be impossible to reconstruct against the governance requirements that were effective when execution occurred.',
    controlStatement:
      'Runtime governance records must preserve sufficient version and control provenance to establish the applicable governance baseline without duplicating the full governance catalogue into each execution record.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUDIT_LOGGING',
      'DATA_GOVERNANCE',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-15-003',
    domain: 'GOV-15',
    title: 'Audit Record Integrity',
    requirement:
      'Material AI governance audit records must be protected against unauthorized alteration, deletion or misleading substitution.',
    risk:
      'Governance evidence may become unreliable if audit records can be silently changed or replaced without authorization and provenance.',
    controlStatement:
      'Material AI governance and oversight records must be created and managed through authorized processes that preserve sufficient integrity, attribution and change provenance for their intended assurance purpose.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUDIT_LOGGING',
      'AUTHORIZATION',
      'CHANGE_CONTROL',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-15-004',
    domain: 'GOV-15',
    title: 'Real Metrics Only',
    requirement:
      'Production AI governance and performance metrics must be derived from real authoritative evidence appropriate to the metric being reported.',
    risk:
      'Fabricated, placeholder or unsupported metrics may create false assurance about AI performance, safety, fairness or governance effectiveness.',
    controlStatement:
      'iNteract must not present fabricated, placeholder, demonstration or otherwise unsupported values as observed production AI governance or performance metrics.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'MONITORING',
      'DATA_GOVERNANCE',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-15-005',
    domain: 'GOV-15',
    title: 'Synthetic/Test Data Identification',
    requirement:
      'Synthetic, test, demonstration and simulated AI data must remain distinguishable from authoritative production evidence.',
    risk:
      'Non-production data may be mistaken for real operational evidence and contaminate governance conclusions or reported metrics.',
    controlStatement:
      'Where synthetic, test or demonstration data is retained or displayed, it must be explicitly identifiable as non-production and must not be aggregated into production evidence without a valid governed purpose and clear distinction.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'MONITORING',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-15-006',
    domain: 'GOV-15',
    title: 'Monitoring Coverage & Failure Visibility',
    requirement:
      'Required AI monitoring must have defined coverage, and material monitoring failure or absence must not be represented as evidence that no issue exists.',
    risk:
      'Monitoring gaps or failed telemetry may create false confidence when absence of detected problems is interpreted as successful control operation.',
    controlStatement:
      'iNteract must identify material monitoring coverage and must expose relevant monitoring failure or absence so that missing evidence is not interpreted as evidence of satisfactory performance.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MONITORING',
      'AUDIT_LOGGING',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-15-007',
    domain: 'GOV-15',
    title: 'Evidence-Based Control Verification',
    requirement:
      'AI governance controls may be classified as verified only when appropriate evidence demonstrates that the relevant requirement and implementation have been tested or otherwise substantiated.',
    risk:
      'Controls may be declared verified merely because they are documented or implemented, creating false governance assurance.',
    controlStatement:
      'Verification status must be supported by identified evidence appropriate to the control and must preserve the distinction between a defined requirement, technical implementation, verification and effectiveness.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
      'MONITORING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-15-008',
    domain: 'GOV-15',
    title: 'Monitoring & Evidence Freshness',
    requirement:
      'Monitoring and governance evidence must retain sufficient temporal context to determine whether it remains current for the assurance claim being made.',
    risk:
      'Stale monitoring results or historical evidence may be presented as proof of current control operation after relevant systems or risks have changed.',
    controlStatement:
      'Governance evidence and monitoring results must retain relevant timestamps, review context or validity information so that stale evidence is not silently represented as current assurance.',
    authority: 'DERIVED_EVIDENCE_BASED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'MONITORING',
      'AUDIT_LOGGING',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_15 =
  validatePlatformAiGovernanceDefinitions(definitions);
