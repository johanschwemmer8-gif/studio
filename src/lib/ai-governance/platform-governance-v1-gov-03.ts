import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-03-001',
    domain: 'GOV-03',
    title: 'Proportionate AI Risk Assessment Coverage',
    requirement:
      'Governed AI capabilities must receive risk assessment proportionate to their intended use, context and potential impact.',
    risk:
      'AI risks may remain unidentified or untreated when assessment depth is not proportionate to the capability and its operating context.',
    controlStatement:
      'iNteract must assess governed AI capabilities using a risk process proportionate to intended use, affected parties, data, dependencies and reasonably foreseeable impact.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'CHANGE_CONTROL',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-03-002',
    domain: 'GOV-03',
    title: 'Defined AI Risk Taxonomy',
    requirement:
      'AI risks must be identified and classified using a defined risk taxonomy.',
    risk:
      'Inconsistent risk terminology and classification may cause material risks to be overlooked, duplicated or evaluated inconsistently.',
    controlStatement:
      'iNteract must maintain a defined AI risk taxonomy suitable for consistently identifying and classifying material risks across governed AI capabilities.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'SCHEMA_VALIDATION',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-03-003',
    domain: 'GOV-03',
    title: 'Evidence-Based Risk Evaluation',
    requirement:
      'AI risk evaluation must be supported by relevant evidence and must distinguish known facts from assumptions or unresolved uncertainty.',
    risk:
      'Risk decisions based on unsupported assumptions or fabricated evidence may create false assurance and inappropriate authorization.',
    controlStatement:
      'AI risk evaluations must reference available evidence, identify material assumptions and uncertainty, and must not present unsupported conclusions as verified facts.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-03-004',
    domain: 'GOV-03',
    title: 'Inherent & Residual Risk Separation',
    requirement:
      'Risk evaluation must distinguish risk before treatment from risk remaining after applicable controls and treatment.',
    risk:
      'Failure to distinguish inherent and residual risk may obscure control effectiveness and lead to incorrect risk acceptance decisions.',
    controlStatement:
      'Material AI risk records must distinguish inherent risk from residual risk after identified controls and treatment are considered.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'SCHEMA_VALIDATION',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-03-005',
    domain: 'GOV-03',
    title: 'Risk Treatment & Control Traceability',
    requirement:
      'Material AI risks requiring treatment must be traceable to the controls or actions intended to address them.',
    risk:
      'Risk treatments without control traceability may remain incomplete, unverified or disconnected from the risks they are intended to reduce.',
    controlStatement:
      'Governance records must support traceability from identified material AI risks to applicable treatment decisions, controls, implementation references and evidence.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'SCHEMA_VALIDATION',
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-03-006',
    domain: 'GOV-03',
    title: 'Residual Risk Acceptance Authority',
    requirement:
      'Residual AI risk requiring acceptance must be accepted only by authorized accountable authority.',
    risk:
      'Unauthorized or undocumented acceptance may expose the platform to risk outside approved tolerance.',
    controlStatement:
      'Residual AI risk acceptance must identify the authorized accepting authority, the risk accepted, rationale, applicable conditions and time of acceptance.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'AUTHORIZATION',
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-03-007',
    domain: 'GOV-03',
    title: 'Risk-Based Capability Authorization',
    requirement:
      'Production authorization of governed AI capabilities must account for applicable risk assessment and unresolved material risk.',
    risk:
      'An AI capability may enter or remain in production despite unacceptable or unresolved risk.',
    controlStatement:
      'A governed AI capability must not be authorized for production operation when applicable governance determines that unresolved risk requires restriction, suspension or further treatment.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
      'CHANGE_CONTROL',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-03-008',
    domain: 'GOV-03',
    title: 'Continuous Risk Reassessment',
    requirement:
      'AI risk assessments must be reconsidered when material changes, incidents, evidence or operating conditions may alter the risk profile.',
    risk:
      'A previously acceptable risk assessment may become stale after material changes to capabilities, models, data, dependencies or use.',
    controlStatement:
      'Defined triggers must cause reassessment of affected AI risks following material change, significant incident, relevant new evidence or material change in operating context.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MONITORING',
      'CHANGE_CONTROL',
      'INCIDENT_RESPONSE',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-03-009',
    domain: 'GOV-03',
    title: 'Explicit Uncertainty & Unknown Risk',
    requirement:
      'Material uncertainty and unknown risk must be represented explicitly rather than converted into unsupported certainty.',
    risk:
      'Uncertainty hidden by unsupported assumptions can produce false confidence in governance and operational decisions.',
    controlStatement:
      'Risk assessment and governance decisions must record material uncertainty, evidence gaps and unresolved risk where they affect the reliability of the assessment or authorization decision.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'DATA_GOVERNANCE',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_03 =
  validatePlatformAiGovernanceDefinitions(definitions);
