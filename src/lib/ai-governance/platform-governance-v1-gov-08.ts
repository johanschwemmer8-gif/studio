import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-08-001',
    domain: 'GOV-08',
    title: 'Fairness & Harm Risk Assessment',
    requirement:
      'Governed AI capabilities must assess material fairness and harm risks proportionate to their intended use, affected parties and operating context.',
    risk:
      'AI functionality may create or amplify harmful or unjustified outcomes when fairness and harm risks are not identified and assessed.',
    controlStatement:
      'iNteract must evaluate material fairness and harm risks for governed AI capabilities using evidence and assessment depth proportionate to the capability and reasonably foreseeable impact.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'CHANGE_CONTROL',
      'MONITORING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-08-002',
    domain: 'GOV-08',
    title: 'No Unjustified Differential Treatment',
    requirement:
      'Governed AI must not apply materially different treatment to users or groups without a legitimate, authorized and evidence-supported basis.',
    risk:
      'Unjustified differential treatment may produce discriminatory, unfair or harmful outcomes.',
    controlStatement:
      'AI capabilities must not intentionally differentiate treatment on an arbitrary or unsupported basis and must preserve applicable fairness safeguards regardless of commercial configuration.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'MODEL_INSTRUCTION',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-08-003',
    domain: 'GOV-08',
    title: 'Protected & Sensitive Attribute Boundary',
    requirement:
      'Use of protected or sensitive personal attributes by governed AI must be explicitly authorized, necessary and subject to applicable safeguards.',
    risk:
      'Protected or sensitive attributes may be used in ways that create discrimination, privacy intrusion or inappropriate decision influence.',
    controlStatement:
      'Governed AI must not use protected or sensitive attributes for differentiation or decision influence unless the use is explicitly authorized, necessary for the governed purpose and subject to applicable privacy and fairness controls.',
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
  {
    controlId: 'GOV-08-004',
    domain: 'GOV-08',
    title: 'No Proxy Discrimination',
    requirement:
      'Governed AI must not intentionally use proxy variables to circumvent restrictions on protected or sensitive attributes.',
    risk:
      'Apparently neutral signals may be deliberately used as substitutes for restricted attributes and reproduce prohibited differential treatment.',
    controlStatement:
      'AI capabilities and configuration must not deliberately use behavioral, geographic, commercial or other proxy signals to circumvent protected-attribute or fairness boundaries.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'MODEL_INSTRUCTION',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-08-005',
    domain: 'GOV-08',
    title: 'Fairness Measurement Requires Valid Evidence',
    requirement:
      'Claims about fairness, bias or differential outcomes must be supported by evidence appropriate to the population, capability and measurement being assessed.',
    risk:
      'Weak, irrelevant or insufficient evidence may produce misleading fairness conclusions and false assurance.',
    controlStatement:
      'iNteract must not represent a fairness or bias conclusion as established unless the underlying data, population, methodology and limitations provide a valid basis for that conclusion.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'MONITORING',
      'DATA_GOVERNANCE',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-08-006',
    domain: 'GOV-08',
    title: 'Synthetic Fairness Evidence Prohibited',
    requirement:
      'Synthetic, demonstration or fabricated data must not be represented as real production evidence of fairness or bias performance.',
    risk:
      'Synthetic fairness metrics presented as production evidence may conceal unknown performance and create false governance assurance.',
    controlStatement:
      'Fairness monitoring and governance reporting must distinguish synthetic or test data from real production evidence and must never present fabricated metrics, populations or findings as observed production results.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'MONITORING',
      'AUDIT_LOGGING',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-08-007',
    domain: 'GOV-08',
    title: 'Harm Prevention Overrides Commercial Optimization',
    requirement:
      'Material harm-prevention controls must take precedence over retailer, marketing, engagement or revenue optimization objectives.',
    risk:
      'Commercial optimization may incentivize AI behavior that increases engagement or conversion at the expense of user protection.',
    controlStatement:
      'Retailer and commercial configuration must not weaken mandatory harm-prevention controls, and governed AI must subordinate conflicting commercial objectives to applicable platform safeguards.',
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
    controlId: 'GOV-08-008',
    domain: 'GOV-08',
    title: 'Proportionate Evidence-Based Fairness & Harm Monitoring',
    requirement:
      'Fairness and harm monitoring must be proportionate to capability risk and based on available valid evidence.',
    risk:
      'Absent monitoring may leave material harms undetected, while unsupported monitoring may create false assurance.',
    controlStatement:
      'iNteract must apply fairness and harm monitoring appropriate to the capability risk and available evidence and must explicitly represent monitoring limitations where reliable measurement is not possible.',
    authority: 'DERIVED_EVIDENCE_BASED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MONITORING',
      'DATA_GOVERNANCE',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-08-009',
    domain: 'GOV-08',
    title: 'Fairness Findings Require Investigation & Remediation',
    requirement:
      'Material fairness or harm findings must trigger proportionate investigation and accountable treatment.',
    risk:
      'Known harmful or unfair outcomes may persist when findings are recorded but not investigated or remediated.',
    controlStatement:
      'Material fairness or harm findings must be assigned for investigation, assessed for affected capability and risk, and result in proportionate remediation, restriction, acceptance or other accountable disposition.',
    authority: 'ADMIN_MANAGED',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'HUMAN_PROCESS',
      'INCIDENT_RESPONSE',
      'CHANGE_CONTROL',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_08 =
  validatePlatformAiGovernanceDefinitions(definitions);
