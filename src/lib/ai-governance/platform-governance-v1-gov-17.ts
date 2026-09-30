import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-17-001',
    domain: 'GOV-17',
    title: 'Risk-Appropriate AI Performance Framework',
    requirement:
      'Governed AI capabilities must have performance evaluation appropriate to their intended use, material risks and operational context.',
    risk:
      'AI performance may be evaluated using incomplete or irrelevant measures that do not reflect the capability purpose or material governance risks.',
    controlStatement:
      'iNteract must define proportionate performance measures and evaluation criteria for governed AI capabilities according to intended use, risk, available evidence and operational significance.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MONITORING',
      'HUMAN_PROCESS',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-17-002',
    domain: 'GOV-17',
    title: 'Governance Performance Distinct from Commercial Performance',
    requirement:
      'AI governance performance must remain distinguishable from commercial, engagement or optimization performance.',
    risk:
      'Strong commercial results may be incorrectly treated as evidence that AI governance, safety or control effectiveness is satisfactory.',
    controlStatement:
      'iNteract must distinguish governance and control-effectiveness measures from commercial measures such as engagement, conversion, basket or revenue outcomes and must not use commercial success as a substitute for governance evidence.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'MONITORING',
      'DATA_GOVERNANCE',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-17-003',
    domain: 'GOV-17',
    title: 'Production Performance Claims Require Real Production Evidence',
    requirement:
      'Claims about actual production AI performance must be supported by appropriate real production evidence.',
    risk:
      'Synthetic, test, assumed or fabricated results may be represented as actual production performance and create false assurance.',
    controlStatement:
      'iNteract must not characterize test, demonstration, synthetic or assumed results as observed production AI performance, and production claims must remain traceable to appropriate authoritative evidence.',
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
    controlId: 'GOV-17-004',
    domain: 'GOV-17',
    title: 'Metric Definition & Interpretation Integrity',
    requirement:
      'Material AI performance metrics must have defined meaning, source and interpretation sufficient to prevent misleading conclusions.',
    risk:
      'Ambiguous or poorly defined metrics may be interpreted beyond what their underlying data and methodology support.',
    controlStatement:
      'Material AI performance metrics must retain sufficient definition of purpose, source, calculation or interpretation boundaries to support accurate use and prevent unsupported claims.',
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
    controlId: 'GOV-17-005',
    domain: 'GOV-17',
    title: 'Control Effectiveness Evaluation',
    requirement:
      'Implemented AI governance controls must be evaluated for effectiveness where their risk and assurance purpose requires it.',
    risk:
      'A control may exist technically or procedurally while failing to achieve its intended governance outcome.',
    controlStatement:
      'iNteract must evaluate control effectiveness using evidence appropriate to the control and must preserve the distinction between control definition, implementation, verification and demonstrated effectiveness.',
    authority: 'DERIVED_EVIDENCE_BASED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'MONITORING',
      'HUMAN_PROCESS',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-17-006',
    domain: 'GOV-17',
    title: 'Material Performance Degradation Detection',
    requirement:
      'Governed AI capabilities must support proportionate detection of material performance degradation where such degradation can affect intended use or governance risk.',
    risk:
      'AI quality or control performance may deteriorate after deployment without timely recognition.',
    controlStatement:
      'iNteract must define proportionate monitoring or review mechanisms capable of identifying material degradation relevant to capability purpose, risk and available evidence.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MONITORING',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-17-007',
    domain: 'GOV-17',
    title: 'Controlled Continual Improvement',
    requirement:
      'AI improvement activities must occur through governed change rather than uncontrolled modification of production behavior.',
    risk:
      'Optimization or iterative changes may bypass risk assessment, testing, authorization or governance requirements.',
    controlStatement:
      'Continual improvement of governed AI capabilities must use applicable change-control, testing and authorization processes proportionate to the materiality of the proposed improvement.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'CHANGE_CONTROL',
      'HUMAN_PROCESS',
      'AUTHORIZATION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-17-008',
    domain: 'GOV-17',
    title: 'Improvement Cannot Optimize Around Governance',
    requirement:
      'AI optimization must not weaken or circumvent mandatory governance controls in pursuit of commercial, engagement or performance objectives.',
    risk:
      'Optimization pressure may cause the system to trade away evidence integrity, privacy, fairness, safety, autonomy or other mandatory safeguards.',
    controlStatement:
      'Mandatory platform governance must remain authoritative during AI optimization, and improvement objectives must not be permitted to override or route around applicable controls.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'CHANGE_CONTROL',
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-17-009',
    domain: 'GOV-17',
    title: 'Performance Findings Drive Accountable Action',
    requirement:
      'Material AI performance or governance findings must be assigned appropriate accountable action rather than merely recorded.',
    risk:
      'Known degradation, control weakness or adverse findings may persist without treatment or ownership.',
    controlStatement:
      'Material performance and governance findings must be evaluated and, where action is required, assigned an accountable disposition such as remediation, risk treatment, restriction, change or documented acceptance by authorized roles.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'CHANGE_CONTROL',
      'INCIDENT_RESPONSE',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-17-010',
    domain: 'GOV-17',
    title: 'Periodic AI Management Review',
    requirement:
      'iNteract must periodically review the suitability, adequacy and effectiveness of its AI governance system using relevant evidence and material changes.',
    risk:
      'The AI governance system may become stale or ineffective as capabilities, risks, providers, requirements and operating conditions change.',
    controlStatement:
      'Authorized iNteract governance leadership must periodically review material AI governance performance, risks, incidents, changes, evidence, supplier developments and improvement needs and record accountable outcomes.',
    authority: 'ADMIN_MANAGED',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'MONITORING',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_17 =
  validatePlatformAiGovernanceDefinitions(definitions);
