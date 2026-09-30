import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-12-001',
    domain: 'GOV-12',
    title: 'AI Interaction Transparency',
    requirement:
      'Users interacting materially with governed AI must not be misled into believing that the AI interaction is a human interaction.',
    risk:
      'Users may attribute human authority, accountability or judgment to an AI-generated interaction when its AI nature is obscured.',
    controlStatement:
      'Shopper and operator experiences must provide appropriate transparency that material AI-generated interaction is AI-assisted or AI-generated.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'MODEL_INSTRUCTION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'ADDITIVE_ONLY',
  },
  {
    controlId: 'GOV-12-002',
    domain: 'GOV-12',
    title: 'Capability Purpose Transparency',
    requirement:
      'The material purpose and relevant scope of a governed AI capability must be represented accurately to affected users and operators.',
    risk:
      'Users may rely on AI for purposes beyond its governed scope when capability purpose or limitations are materially unclear.',
    controlStatement:
      'iNteract must represent the intended purpose and material scope of governed AI capabilities accurately and must not describe capabilities as having authority or functionality they do not possess.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'ADDITIVE_ONLY',
  },
  {
    controlId: 'GOV-12-003',
    domain: 'GOV-12',
    title: 'Material Recommendation Explanation',
    requirement:
      'Material AI recommendations must support an explanation appropriate to the recommendation, available evidence and affected user.',
    risk:
      'Users may be unable to understand why a recommendation was presented or whether it reflects their request, evidence or commercial influence.',
    controlStatement:
      'Where appropriate to the capability and impact, Ari must be able to communicate material recommendation factors and evidence without fabricating an explanation or exposing protected internal reasoning.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'APPLICATION_LOGIC',
      'MODEL_INSTRUCTION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-12-004',
    domain: 'GOV-12',
    title: 'Evidence & Source Transparency',
    requirement:
      'Material factual AI claims must support proportionate transparency regarding the evidence or source basis where such transparency is relevant and permitted.',
    risk:
      'Users and operators may be unable to distinguish evidence-grounded claims from unsupported assertions or investigate material AI outcomes.',
    controlStatement:
      'Governed AI must preserve sufficient source provenance to support appropriate evidence transparency while respecting privacy, security, confidentiality and provider restrictions.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'AUDIT_LOGGING',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-12-005',
    domain: 'GOV-12',
    title: 'Uncertainty & Limitation Transparency',
    requirement:
      'Material uncertainty, evidence limitations and capability limitations must not be concealed when they affect the reliability or interpretation of an AI outcome.',
    risk:
      'AI outputs may create unjustified confidence when material uncertainty or limitations are omitted.',
    controlStatement:
      'Ari must communicate material uncertainty or limitations when necessary to prevent an affected output from being reasonably interpreted as more certain, complete or authoritative than the available evidence supports.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
      'EVIDENCE_BOUNDARY',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-12-006',
    domain: 'GOV-12',
    title: 'Commercial Influence & Sponsorship Transparency',
    requirement:
      'Material commercial influence or sponsorship affecting AI-assisted content or recommendations must be disclosed appropriately.',
    risk:
      'Users may interpret sponsored, paid or commercially influenced content as independent AI judgment.',
    controlStatement:
      'Where sponsorship, paid placement or another commercial preference materially affects AI-assisted presentation or recommendation, the experience must provide appropriate disclosure and must not misrepresent that influence as neutral evidence.',
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
    controlId: 'GOV-12-007',
    domain: 'GOV-12',
    title: 'Governance Transparency to Retailers',
    requirement:
      'Retailers must have sufficient transparency regarding mandatory platform AI governance boundaries that materially constrain their configuration or use of Ari.',
    risk:
      'Retailers may misunderstand platform safeguards, attempt unsupported configuration or assume authority over controls they cannot modify.',
    controlStatement:
      'The Ari control plane must distinguish mandatory iNteract governance from retailer-configurable behavior and must not represent immutable platform controls as retailer-controlled settings.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'APPLICATION_LOGIC',
      'AUTHORIZATION',
      'HUMAN_PROCESS',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'ADDITIVE_ONLY',
  },
  {
    controlId: 'GOV-12-008',
    domain: 'GOV-12',
    title: 'No False Explainability',
    requirement:
      'AI explanations must not fabricate evidence, reasoning provenance or causal certainty that cannot be supported.',
    risk:
      'Generated explanations may sound plausible while falsely describing why a model or system produced an outcome.',
    controlStatement:
      'Governed AI must not present generated rationale as verified internal model reasoning or claim causal explanation beyond available evidence and system provenance.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'MODEL_INSTRUCTION',
      'EVIDENCE_BOUNDARY',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-12-009',
    domain: 'GOV-12',
    title: 'Protected Internal Reasoning & Security Boundary',
    requirement:
      'Transparency and explainability requirements must not require disclosure of protected internal reasoning, secrets, credentials, security-sensitive implementation details or other restricted information.',
    risk:
      'Overbroad explainability may expose sensitive system information, weaken security or incorrectly equate transparency with disclosure of private model reasoning.',
    controlStatement:
      'iNteract must provide appropriate outcome, evidence and governance transparency without exposing protected internal reasoning, credentials, secrets or security-sensitive implementation details.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
      'MODEL_INSTRUCTION',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_12 =
  validatePlatformAiGovernanceDefinitions(definitions);
