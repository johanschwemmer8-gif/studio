import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-11-001',
    domain: 'GOV-11',
    title: 'Evidence-Grounded Suitability Assessment',
    requirement:
      'AI-generated suitability information must be grounded in authoritative product evidence and the explicitly available shopper context relevant to the assessment.',
    risk:
      'AI may infer suitability from incomplete product information or unsupported assumptions about the shopper.',
    controlStatement:
      'Ari must ground suitability outputs in available authoritative product evidence and permitted shopper context and must not manufacture product attributes or shopper characteristics to complete an assessment.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-11-002',
    domain: 'GOV-11',
    title: 'Safety-Sensitive Context Recognition',
    requirement:
      'Governed AI capabilities must recognize when a request materially depends on safety-sensitive information or individualized professional judgment.',
    risk:
      'Safety-sensitive requests may be handled as ordinary product recommendations, causing unsupported conclusions to be presented with inappropriate confidence.',
    controlStatement:
      'Ari must identify safety-sensitive contexts within the governed capability boundary and apply the required evidence, uncertainty, limitation and escalation behavior before producing an affected outcome.',
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
    controlId: 'GOV-11-003',
    domain: 'GOV-11',
    title: 'No Unsupported Individualized Safety Declaration',
    requirement:
      'Governed AI must not make an individualized safety declaration that is unsupported by authoritative evidence and beyond the permitted capability boundary.',
    risk:
      'A shopper may rely on an unsupported AI statement that a product is safe, appropriate or risk-free for their individual circumstances.',
    controlStatement:
      'Ari may present supported factual safety information but must not declare a product safe or suitable for an individual when that conclusion requires evidence or professional judgment that the governed capability does not possess.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-11-004',
    domain: 'GOV-11',
    title: 'Appropriate Escalation for Professional Judgment',
    requirement:
      'When an individualized safety or suitability conclusion requires qualified professional judgment beyond the AI capability boundary, the shopper must be directed appropriately rather than given a fabricated conclusion.',
    risk:
      'AI may substitute generated advice for professional judgment in circumstances where the available evidence cannot support an individualized conclusion.',
    controlStatement:
      'Where qualified professional judgment is materially required, Ari must state the relevant limitation and direct the shopper to an appropriately qualified professional rather than manufacture or imply that professional judgment.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CONDITIONAL',
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
    controlId: 'GOV-11-005',
    domain: 'GOV-11',
    title: 'Contraindication, Warning & Limitation Integrity',
    requirement:
      'Material contraindications, warnings and limitations presented by AI must be preserved accurately from authoritative evidence and must not be suppressed or weakened for commercial purposes.',
    risk:
      'Omission, distortion or weakening of material safety information may cause a shopper to make a decision without relevant risk information.',
    controlStatement:
      'Ari must preserve supported material warnings, contraindications and limitations relevant to the requested assessment and retailer or commercial configuration must not suppress mandatory safety information.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-11-006',
    domain: 'GOV-11',
    title: 'Uncertainty & Insufficient Safety Evidence',
    requirement:
      'Material uncertainty or insufficient evidence affecting a safety-sensitive outcome must be communicated and must constrain the resulting AI behavior.',
    risk:
      'AI may convert missing or uncertain safety evidence into false reassurance or an unsupported suitability conclusion.',
    controlStatement:
      'When available evidence cannot support a requested safety-sensitive conclusion, Ari must communicate the limitation and constrain or refuse that conclusion rather than infer missing safety facts.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'MODEL_INSTRUCTION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-11-007',
    domain: 'GOV-11',
    title: 'Safety Controls Override Commercial Configuration',
    requirement:
      'Mandatory safety and suitability controls must take precedence over retailer, activation, recommendation and commercial configuration.',
    risk:
      'Commercial objectives may otherwise suppress warnings, increase recommendation confidence or weaken safety-related refusal and escalation behavior.',
    controlStatement:
      'No retailer, activation, campaign, recommendation or commercial configuration may disable or weaken mandatory platform safety and suitability controls.',
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
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_11 =
  validatePlatformAiGovernanceDefinitions(definitions);
