import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-02-001',
    domain: 'GOV-02',
    title: 'Complete Governed AI Capability Inventory',
    requirement:
      'Production AI capabilities must be represented in an authoritative governed capability inventory.',
    risk:
      'Uninventoried AI capabilities may operate without defined ownership, risk treatment, governance controls or lifecycle oversight.',
    controlStatement:
      'iNteract must maintain an authoritative inventory of production AI capabilities subject to Platform AI Governance.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'SCHEMA_VALIDATION',
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-02-002',
    domain: 'GOV-02',
    title: 'Stable Capability Identity',
    requirement:
      'Each governed AI capability must have a stable identity that can be referenced across governance, runtime and evidence records.',
    risk:
      'Unstable or ambiguous capability identity may prevent reliable control mapping, monitoring, auditability and historical traceability.',
    controlStatement:
      'Each governed AI capability must have a stable capability identifier and versioned definition suitable for governance and runtime provenance.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'SCHEMA_VALIDATION',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-02-003',
    domain: 'GOV-02',
    title: 'Defined Intended Use & Prohibited Use',
    requirement:
      'Each governed AI capability must define its intended use and material prohibited uses.',
    risk:
      'AI capabilities used outside their governed purpose may create unassessed risks or inappropriate outcomes.',
    controlStatement:
      'The authoritative capability definition must state intended use and prohibited uses before the capability is authorized for production operation.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'SCHEMA_VALIDATION',
      'CHANGE_CONTROL',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-02-004',
    domain: 'GOV-02',
    title: 'Capability Ownership & Accountability',
    requirement:
      'Each governed AI capability must have defined accountable ownership.',
    risk:
      'A capability without accountable ownership may accumulate unresolved risk, defects or governance obligations.',
    controlStatement:
      'Every governed AI capability must identify an accountable owner responsible for its governed lifecycle and material governance obligations.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-02-005',
    domain: 'GOV-02',
    title: 'Capability Lifecycle, Suspension, Decommissioning & Retirement Governance',
    requirement:
      'Governed AI capabilities must have controlled lifecycle states including the ability to suspend and retire production use.',
    risk:
      'A capability may remain operational after it becomes unsafe, unsupported, unauthorized or obsolete.',
    controlStatement:
      'AI capability lifecycle state must be authoritative and enforceable, with controlled transitions and the ability to suspend or retire production execution when required.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'AUTHORIZATION',
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-02-006',
    domain: 'GOV-02',
    title: 'Model, Provider & Dependency Mapping',
    requirement:
      'Governed AI capabilities must identify material AI models, providers and dependencies used in production execution.',
    risk:
      'Unknown or unmapped dependencies may introduce unmanaged supplier, model, security, availability or change risk.',
    controlStatement:
      'The AI capability inventory must maintain traceable relationships to authorized provider, model and material AI dependency records used by the capability.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'SCHEMA_VALIDATION',
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-02-007',
    domain: 'GOV-02',
    title: 'Applicable Governance & Risk Mapping',
    requirement:
      'Each governed AI capability must be associated with the governance controls and risk treatment applicable to its operation.',
    risk:
      'A capability without explicit governance and risk mapping may execute without controls appropriate to its risk profile.',
    controlStatement:
      'Capability records must identify applicable governance controls and support traceability to the risk decisions governing production authorization.',
    authority: 'DERIVED_EVIDENCE_BASED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'SCHEMA_VALIDATION',
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-02-008',
    domain: 'GOV-02',
    title: 'No Unregistered Production AI',
    requirement:
      'AI functionality must not execute in production as a governed platform capability unless it is registered and authorized.',
    risk:
      'Unregistered production AI can bypass capability governance, risk assessment, provider controls, monitoring and auditability.',
    controlStatement:
      'Production AI execution must fail closed when the requested AI capability cannot be resolved to an authorized governed capability record.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'AUTHORIZATION',
      'SCHEMA_VALIDATION',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_02 =
  validatePlatformAiGovernanceDefinitions(definitions);
