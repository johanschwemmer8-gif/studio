import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-13-001',
    domain: 'GOV-13',
    title: 'Defined Human Oversight Model',
    requirement:
      'Governed AI capabilities must have a defined human oversight model proportionate to their intended use, risk and operating context.',
    risk:
      'AI capabilities may operate without clear human accountability, intervention paths or oversight responsibilities.',
    controlStatement:
      'iNteract must define the human oversight responsibilities, intervention points and escalation arrangements applicable to each governed AI capability according to its risk and purpose.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'AUTHORIZATION',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-13-002',
    domain: 'GOV-13',
    title: 'Human Authority Must Be Real',
    requirement:
      'A stated human oversight or intervention mechanism must correspond to an actual authorized human capability to review, intervene or decide.',
    risk:
      'Users or operators may be given false assurance that meaningful human oversight exists when no effective intervention authority is available.',
    controlStatement:
      'iNteract must not represent a human review, approval or intervention mechanism as available unless an identified authorized role can actually perform the stated action.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'AUTHORIZATION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-13-003',
    domain: 'GOV-13',
    title: 'Defined Escalation Triggers',
    requirement:
      'Material circumstances requiring human escalation must be defined for governed AI capabilities where escalation is part of the control model.',
    risk:
      'AI or operators may fail to escalate significant uncertainty, safety concerns, incidents or governance exceptions when escalation criteria are undefined.',
    controlStatement:
      'Governed AI capabilities must define proportionate escalation triggers for material conditions that require human review, intervention or decision.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-13-004',
    domain: 'GOV-13',
    title: 'Qualified Escalation for Professional Judgment',
    requirement:
      'Escalation requiring specialized professional judgment must direct the affected user toward an appropriately qualified source of that judgment.',
    risk:
      'Generic escalation may falsely imply that an unqualified retailer, platform operator or AI system can provide specialized professional judgment.',
    controlStatement:
      'Where a governed outcome requires professional judgment beyond Ari or iNteract authority, the escalation must identify the appropriate category of qualified professional without fabricating access to a specific professional or service.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CONDITIONAL',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-13-005',
    domain: 'GOV-13',
    title: 'No Fake Human Handoff',
    requirement:
      'AI must not claim that a human handoff, review or contact has occurred or will occur unless that mechanism actually exists and has been invoked as represented.',
    risk:
      'Fabricated human escalation may mislead users into believing that a person is reviewing or receiving their issue when no such process exists.',
    controlStatement:
      'Ari must not simulate, promise or imply a human handoff unless the platform has an authorized operational mechanism capable of performing the represented handoff.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-13-006',
    domain: 'GOV-13',
    title: 'Human Intervention Must Not Weaken Mandatory Governance',
    requirement:
      'Human intervention must not provide an uncontrolled mechanism for bypassing mandatory platform AI governance.',
    risk:
      'Operators may override safety, evidence, privacy or other mandatory controls under the label of human oversight.',
    controlStatement:
      'Human review and intervention mechanisms must remain subject to applicable authorization and mandatory platform governance and must not create an unrestricted governance bypass.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-13-007',
    domain: 'GOV-13',
    title: 'Disputed AI Outcome, Complaint & Recourse',
    requirement:
      'Material disputes or complaints concerning governed AI outcomes must have an appropriate path for review or recourse proportionate to the context and impact.',
    risk:
      'Affected users or retailers may have no accountable mechanism for raising material AI concerns or challenging significant outcomes.',
    controlStatement:
      'iNteract must define proportionate mechanisms for receiving, reviewing and resolving material AI-related disputes or complaints within the applicable platform and retailer responsibility boundaries.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
      'INCIDENT_RESPONSE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'ADDITIVE_ONLY',
  },
  {
    controlId: 'GOV-13-008',
    domain: 'GOV-13',
    title: 'Emergency Restriction & Suspension Authority',
    requirement:
      'Authorized iNteract personnel must be able to restrict or suspend governed AI capability when continued operation presents an unacceptable governance, safety or security risk.',
    risk:
      'A materially unsafe or nonconforming AI capability may continue operating because no effective emergency restriction authority exists.',
    controlStatement:
      'iNteract must maintain authorized capability-level restriction or suspension mechanisms that can place affected AI functionality into an appropriate safe state without disabling mandatory governance.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'INCIDENT_RESPONSE',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-13-009',
    domain: 'GOV-13',
    title: 'Human Oversight Actions Must Be Auditable',
    requirement:
      'Material human governance interventions affecting AI capability, authorization, restriction or risk disposition must be auditable.',
    risk:
      'Human governance decisions may alter AI behavior or risk without sufficient accountability or reconstruction of who acted and why.',
    controlStatement:
      'Material human oversight and governance actions must produce proportionate authoritative records identifying the action, authorized actor, affected governance context and relevant disposition without recording unnecessary sensitive information.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUDIT_LOGGING',
      'AUTHORIZATION',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_13 =
  validatePlatformAiGovernanceDefinitions(definitions);
