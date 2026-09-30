import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-09-001',
    domain: 'GOV-09',
    title: 'Shopper Decision Autonomy',
    requirement:
      'Governed shopper-facing AI must preserve the shopper ability to make their own purchasing decision.',
    risk:
      'AI assistance may become coercive or substitute platform objectives for the shopper own judgment.',
    controlStatement:
      'Ari must provide assistance, evidence and relevant options without representing the platform, retailer or model preference as a decision the shopper is required to follow.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-09-002',
    domain: 'GOV-09',
    title: 'Non-Manipulative AI Engagement',
    requirement:
      'Shopper-facing AI must not intentionally manipulate users through deceptive, coercive or materially misleading engagement techniques.',
    risk:
      'AI-generated interaction may exploit conversational influence to increase engagement or conversion at the expense of informed shopper choice.',
    controlStatement:
      'Ari must not use deceptive or coercive interaction patterns to pressure a shopper toward a commercial outcome, and retailer configuration must not authorize such behavior.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
      'AUTHORIZATION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-09-003',
    domain: 'GOV-09',
    title: 'No Fabricated Urgency, Scarcity or Social Proof',
    requirement:
      'AI must not manufacture urgency, scarcity, popularity or social proof to influence a shopper.',
    risk:
      'Fabricated commercial pressure signals may mislead shoppers and improperly influence purchasing decisions.',
    controlStatement:
      'Ari must not claim limited availability, time pressure, popularity, demand or similar persuasive facts unless those claims are supported by authoritative current evidence appropriate to the claim.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'MODEL_INSTRUCTION',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-09-004',
    domain: 'GOV-09',
    title: 'Commercial Objective Subordination',
    requirement:
      'Commercial objectives must remain subordinate to mandatory governance, evidence integrity and shopper-protection requirements.',
    risk:
      'Conversion, basket growth, sponsorship or engagement objectives may otherwise override safeguards intended to protect shopper decision quality.',
    controlStatement:
      'Retailer, activation, recommendation and commercial objectives must not override mandatory platform governance, factual grounding, safety, fairness or shopper-autonomy controls.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
      'MODEL_INSTRUCTION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-09-005',
    domain: 'GOV-09',
    title: 'Transparent Sponsored Influence',
    requirement:
      'Material sponsored or paid commercial influence in an AI-assisted shopper experience must be distinguishable from neutral product assistance.',
    risk:
      'Undisclosed sponsored influence may cause shoppers to interpret paid placement or commercial preference as neutral AI judgment.',
    controlStatement:
      'Where sponsorship or paid influence materially affects presented content or placement, the shopper experience must provide appropriate disclosure and must not represent that influence as independent evidence-based recommendation.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CONDITIONAL',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'MODEL_INSTRUCTION',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'ADDITIVE_ONLY',
  },
  {
    controlId: 'GOV-09-006',
    domain: 'GOV-09',
    title: 'No Exploitation of Vulnerability or Behavioural Signals',
    requirement:
      'Shopper vulnerability or behavioral signals must not be exploited to apply manipulative commercial pressure.',
    risk:
      'AI may use inferred vulnerability, hesitation or behavioral patterns to intensify persuasion against the shopper interests.',
    controlStatement:
      'Ari must not use vulnerability or behavioral signals to target deceptive, coercive or exploitative persuasion, and behavioral context must remain subject to applicable privacy, fairness and autonomy controls.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'PRIVACY_CONTROL',
      'MODEL_INSTRUCTION',
      'DATA_GOVERNANCE',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_09 =
  validatePlatformAiGovernanceDefinitions(definitions);
