import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-04-001',
    domain: 'GOV-04',
    title: 'Explicit Intended Use',
    requirement:
      'Each governed AI capability must operate within an explicitly defined intended use.',
    risk:
      'Undefined intended use may allow AI functionality to be applied in contexts for which its risks, evidence and safeguards have not been assessed.',
    controlStatement:
      'The authoritative capability definition must state the intended purpose, operating context and material scope of the AI capability before production authorization.',
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
    controlId: 'GOV-04-002',
    domain: 'GOV-04',
    title: 'Explicit Prohibited Use',
    requirement:
      'Material uses that a governed AI capability must not perform must be explicitly defined.',
    risk:
      'Without prohibited-use boundaries, a capability may be applied to unsafe, unauthorized or unassessed purposes.',
    controlStatement:
      'The authoritative capability definition must identify material prohibited uses, and production operation must not intentionally authorize those uses.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'SCHEMA_VALIDATION',
      'APPLICATION_LOGIC',
      'AUTHORIZATION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-04-003',
    domain: 'GOV-04',
    title: 'Capability Scope Boundary',
    requirement:
      'Each governed AI capability must have a defined functional and authority boundary.',
    risk:
      'Ambiguous capability boundaries may cause AI functionality to assume authority, data access or decision scope beyond its governed purpose.',
    controlStatement:
      'Production AI capabilities must operate within their authorized functional, data and decision boundaries and must not silently expand those boundaries.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'AUTHORIZATION',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-04-004',
    domain: 'GOV-04',
    title: 'Configuration Cannot Redefine Capability Authority',
    requirement:
      'Downstream configuration must not grant an AI capability authority that its platform-governed definition does not permit.',
    risk:
      'Retailer, activation or other downstream configuration could otherwise bypass platform governance by redefining what an AI capability is allowed to do.',
    controlStatement:
      'Retailer and activation configuration may refine permitted behavior only within the capability boundary and must not override or expand platform-governed capability authority.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'SCHEMA_VALIDATION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'ADDITIVE_ONLY',
  },
  {
    controlId: 'GOV-04-005',
    domain: 'GOV-04',
    title: 'Out-of-Scope Request Handling',
    requirement:
      'AI capabilities must handle materially out-of-scope requests without pretending to possess unauthorized capability or authority.',
    risk:
      'Responding beyond governed scope may create unsupported claims, unsafe advice or unauthorized actions.',
    controlStatement:
      'When a request materially exceeds the authorized capability boundary, the AI must refuse, constrain or appropriately redirect the request rather than manufacture capability.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'MODEL_INSTRUCTION',
      'EVIDENCE_BOUNDARY',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-04-006',
    domain: 'GOV-04',
    title: 'Material Scope Expansion Requires Reassessment',
    requirement:
      'A material expansion of an AI capability scope must undergo governance and risk reassessment before production authorization.',
    risk:
      'New uses may introduce risks or obligations not addressed by the capability existing assessment and controls.',
    controlStatement:
      'Material changes to intended use, affected users, data, decision authority or operating context must trigger reassessment before the expanded scope is authorized in production.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'CHANGE_CONTROL',
      'HUMAN_PROCESS',
      'AUTHORIZATION',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-04-007',
    domain: 'GOV-04',
    title: 'No Unauthorized Capability Chaining',
    requirement:
      'Multiple AI capabilities or dependencies must not be combined in a way that creates unauthorized aggregate authority or bypasses individual governance boundaries.',
    risk:
      'Individually permitted capabilities may create an unassessed or prohibited function when chained together.',
    controlStatement:
      'AI capability orchestration must preserve applicable governance boundaries, and material capability combinations must be explicitly authorized where their combined behavior changes governed scope or risk.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'AUTHORIZATION',
      'CHANGE_CONTROL',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-04-008',
    domain: 'GOV-04',
    title: 'Boundary Provenance & Runtime Traceability',
    requirement:
      'Production AI execution must be traceable to the governed capability and governance boundary applicable to that execution.',
    risk:
      'Without runtime provenance, it may be impossible to determine which governed capability and controls authorized an AI execution.',
    controlStatement:
      'Governed AI execution records must retain sufficient capability and governance provenance to identify the authorized capability definition and applicable governance context without indiscriminately duplicating sensitive content.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'AUDIT_LOGGING',
      'APPLICATION_LOGIC',
      'SCHEMA_VALIDATION',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_04 =
  validatePlatformAiGovernanceDefinitions(definitions);
