import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-16-001',
    domain: 'GOV-16',
    title: 'Defined AI Incident Classification',
    requirement:
      'iNteract must define what constitutes an AI-related incident within the governed platform context.',
    risk:
      'Material AI failures may not be recognized or managed consistently when incident classification is undefined.',
    controlStatement:
      'iNteract must maintain defined AI incident criteria covering material governance, safety, evidence, privacy, security, fairness and operational failures appropriate to the platform.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'INCIDENT_RESPONSE',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-002',
    domain: 'GOV-16',
    title: 'Risk-Based AI Incident Severity & Triage',
    requirement:
      'AI incidents must be assessed and triaged according to their material risk, impact and urgency.',
    risk:
      'Critical AI incidents may receive inadequate or delayed response when all incidents are treated without risk-based prioritization.',
    controlStatement:
      'Identified AI incidents must receive proportionate severity classification and triage based on affected capability, governance impact, affected parties, scope and reasonably established consequences.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'INCIDENT_RESPONSE',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-003',
    domain: 'GOV-16',
    title: 'AI Incident Containment & Safe State',
    requirement:
      'Material AI incidents must support proportionate containment and transition to an appropriate safe operational state.',
    risk:
      'Affected AI functionality may continue producing harmful, insecure or nonconforming outcomes while an incident is being investigated.',
    controlStatement:
      'iNteract must maintain authorized means to restrict, suspend or otherwise contain affected AI capability when required by incident severity while preserving mandatory governance safeguards.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'INCIDENT_RESPONSE',
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-004',
    domain: 'GOV-16',
    title: 'Investigation, Remediation & Learning',
    requirement:
      'Material AI incidents must be investigated and receive accountable remediation and learning appropriate to their significance.',
    risk:
      'AI incidents may recur or remain unresolved when causes, control failures and corrective actions are not examined.',
    controlStatement:
      'Material AI incidents must be investigated to an appropriate depth, assigned accountable treatment and used to identify corrective, preventive or governance improvement actions where supported by evidence.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'INCIDENT_RESPONSE',
      'HUMAN_PROCESS',
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-005',
    domain: 'GOV-16',
    title: 'Material AI Change Classification',
    requirement:
      'Changes affecting governed AI must be assessed to determine whether they are material to capability, risk, governance or assurance.',
    risk:
      'Significant model, provider, data, configuration or application changes may enter production without appropriate governance review.',
    controlStatement:
      'iNteract must classify AI-related changes according to their potential effect on intended use, risk, controls, evidence, providers, models, data or governed behavior.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'CHANGE_CONTROL',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-006',
    domain: 'GOV-16',
    title: 'Change Impact Assessment',
    requirement:
      'Material AI changes must receive proportionate impact assessment before production authorization.',
    risk:
      'A change may invalidate previous risk treatment, evidence, testing or governance assumptions without being recognized.',
    controlStatement:
      'Material AI changes must be assessed for relevant effects on capability boundaries, risks, controls, data, providers, models, users and existing assurance before production authorization.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'CHANGE_CONTROL',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-007',
    domain: 'GOV-16',
    title: 'AI Change Testing & Reverification',
    requirement:
      'Material AI changes must receive testing and control reverification proportionate to the change and affected risk.',
    risk:
      'Previously verified controls may no longer operate effectively after changes to models, providers, data or application behavior.',
    controlStatement:
      'Affected AI requirements and controls must be retested or otherwise reverified to an appropriate extent following material change before prior assurance is treated as continuing to apply.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'CHANGE_CONTROL',
      'HUMAN_PROCESS',
      'MONITORING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-008',
    domain: 'GOV-16',
    title: 'Change Provenance & Rollback',
    requirement:
      'Material AI changes must retain sufficient provenance and support an appropriate recovery or rollback strategy where technically and operationally applicable.',
    risk:
      'AI behavior may change without reconstructable history or an effective means to recover from a defective deployment.',
    controlStatement:
      'iNteract must preserve proportionate records of material AI changes and define an appropriate rollback, restriction or recovery mechanism based on the nature of the affected capability.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
      'INCIDENT_RESPONSE',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-009',
    domain: 'GOV-16',
    title: 'AI Supplier & Dependency Inventory',
    requirement:
      'External AI providers and material dependencies supporting governed AI capabilities must be identified and associated with the capabilities that depend on them.',
    risk:
      'Untracked external dependencies may introduce unknown operational, data, security or governance exposure.',
    controlStatement:
      'iNteract must maintain an authoritative inventory of material AI providers and dependencies with sufficient linkage to identify affected governed capabilities.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-010',
    domain: 'GOV-16',
    title: 'Proportionate Supplier Risk & Responsibility Assessment',
    requirement:
      'Material AI suppliers and dependencies must receive risk and responsibility assessment proportionate to their role in governed capabilities.',
    risk:
      'Provider limitations, contractual boundaries, data practices or service characteristics may create unmanaged platform risk.',
    controlStatement:
      'iNteract must assess material AI supplier responsibilities and risks relevant to data handling, service dependency, security, model behavior, change, assurance and continuity to a depth proportionate to dependency criticality.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-011',
    domain: 'GOV-16',
    title: 'Supplier Cannot Override iNteract Governance',
    requirement:
      'External AI provider behavior, defaults or configuration must not supersede mandatory iNteract platform governance.',
    risk:
      'Provider defaults or model behavior may weaken platform evidence, privacy, safety or other governance requirements.',
    controlStatement:
      'iNteract must retain platform governance authority over governed AI outcomes and must constrain, supplement or disable provider functionality where required to preserve mandatory controls.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'AUTHORIZATION',
      'MODEL_INSTRUCTION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-16-012',
    domain: 'GOV-16',
    title: 'Supplier Change, Failure & Exit Resilience',
    requirement:
      'Governed AI architecture must address material supplier change, service failure and dependency exit to a degree proportionate to capability criticality.',
    risk:
      'Provider outage, model retirement, contractual change or dependency failure may cause unsafe degradation, uncontrolled substitution or loss of critical AI functionality.',
    controlStatement:
      'iNteract must define proportionate responses to material supplier change or failure, including safe degradation, controlled substitution, restriction or migration where applicable, without bypassing mandatory governance.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'INCIDENT_RESPONSE',
      'CHANGE_CONTROL',
      'HUMAN_PROCESS',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_16 =
  validatePlatformAiGovernanceDefinitions(definitions);
