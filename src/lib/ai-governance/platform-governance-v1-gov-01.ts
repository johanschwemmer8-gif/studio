import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-01-001',
    domain: 'GOV-01',
    title: 'Platform AI Governance Authority',
    requirement:
      'iNteract must maintain authoritative platform-level governance over production AI capabilities.',
    risk:
      'Without a defined platform authority, downstream configuration may weaken, bypass or contradict mandatory AI governance.',
    controlStatement:
      'Production AI capabilities must operate subject to the active iNteract Platform AI Governance policy, and downstream configuration must not override mandatory platform controls.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'SCHEMA_VALIDATION',
      'CHANGE_CONTROL',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'ADDITIVE_ONLY',
  },
  {
    controlId: 'GOV-01-002',
    domain: 'GOV-01',
    title: 'Defined Governance Accountability',
    requirement:
      'AI governance responsibilities must have defined accountable ownership.',
    risk:
      'Undefined accountability may result in unmanaged risks, unresolved control failures or unapproved governance decisions.',
    controlStatement:
      'Each governed AI policy, control and capability must have an identified accountable owner appropriate to its governance responsibility.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-01-003',
    domain: 'GOV-01',
    title: 'AI Governance Approval Authority',
    requirement:
      'Approval and activation of platform AI governance must be restricted to authorized platform governance authority.',
    risk:
      'Unauthorized approval or activation could place unreviewed governance requirements into production.',
    controlStatement:
      'Only an authorized iNteract Platform Operator acting through the controlled governance lifecycle may approve or activate a Platform AI Governance policy.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-01-004',
    domain: 'GOV-01',
    title: 'Separation of Governance Requirement, Implementation, Verification & Effectiveness',
    requirement:
      'Governance requirements, technical implementation, verification evidence and effectiveness conclusions must remain distinguishable.',
    risk:
      'Treating a documented requirement as proof of implementation or effectiveness can create false assurance.',
    controlStatement:
      'The governance system must represent control definition, implementation state, verification evidence and effectiveness assessment as distinct governance concepts.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'SCHEMA_VALIDATION',
      'AUDIT_LOGGING',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-01-005',
    domain: 'GOV-01',
    title: 'Governance Change Accountability',
    requirement:
      'Material changes to AI governance must be attributable and reviewable.',
    risk:
      'Unattributed or uncontrolled governance changes may silently alter production safeguards.',
    controlStatement:
      'Material governance changes must record the responsible actor, affected governance object, reason, time and resulting governance version or state.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-01-006',
    domain: 'GOV-01',
    title: 'Governance Review & Reassessment',
    requirement:
      'Platform AI governance must be reviewed periodically and when material changes or risk events require reassessment.',
    risk:
      'Governance may become stale or inappropriate as AI capabilities, dependencies, risks or obligations change.',
    controlStatement:
      'iNteract must maintain defined review triggers and review frequency for active AI governance and reassess affected controls when material change, incident or new risk warrants review.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'CHANGE_CONTROL',
      'MONITORING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-01-007',
    domain: 'GOV-01',
    title: 'Governance Nonconformity Accountability',
    requirement:
      'Identified governance nonconformities must be recorded, owned and resolved through accountable action.',
    risk:
      'Unmanaged nonconformities may allow known governance weaknesses to persist in production.',
    controlStatement:
      'A governance nonconformity must have an accountable owner, documented finding, required treatment and traceable resolution or formally authorized disposition.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'INCIDENT_RESPONSE',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-01-008',
    domain: 'GOV-01',
    title: 'Governance Transparency & Downstream Responsibility',
    requirement:
      'Relevant downstream users of governed AI must be able to understand applicable governance responsibilities and limitations.',
    risk:
      'Opaque governance boundaries may cause retailers or operators to assume authority they do not possess or misunderstand mandatory safeguards.',
    controlStatement:
      'iNteract must expose appropriate governance requirements, responsibilities and configuration boundaries to downstream parties without exposing protected internal security or reasoning information.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'ADDITIVE_ONLY',
  },
  {
    controlId: 'GOV-01-009',
    domain: 'GOV-01',
    title: 'AI Governance Competence & Awareness',
    requirement:
      'Persons performing material AI governance responsibilities must have competence appropriate to those responsibilities.',
    risk:
      'Governance decisions made without appropriate competence or awareness may result in ineffective controls or unmanaged risk.',
    controlStatement:
      'iNteract must identify competence and awareness needs for material AI governance responsibilities and maintain proportionate evidence that those responsibilities are understood and performed appropriately.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_01 =
  validatePlatformAiGovernanceDefinitions(definitions);
