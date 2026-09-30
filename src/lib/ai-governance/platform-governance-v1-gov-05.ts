import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-05-001',
    domain: 'GOV-05',
    title: 'No Manufacturing of Facts',
    requirement:
      'AI outputs must not manufacture factual claims that are unsupported by authoritative evidence available to the governed capability.',
    risk:
      'Manufactured facts may mislead shoppers or operators, corrupt downstream intelligence and undermine trust in AI-assisted decisions.',
    controlStatement:
      'A governed AI capability must not present unsupported factual claims as established fact and must preserve this restriction regardless of retailer, activation or commercial configuration.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
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
    controlId: 'GOV-05-002',
    domain: 'GOV-05',
    title: 'Authoritative Evidence Grounding',
    requirement:
      'Factual AI outputs requiring evidence must be grounded in authoritative evidence appropriate to the capability and requested context.',
    risk:
      'Use of untrusted, irrelevant or non-authoritative evidence may produce incorrect or misleading factual outputs.',
    controlStatement:
      'Governed AI capabilities must resolve factual grounding through approved evidence sources and must preserve the distinction between authoritative evidence, contextual information and unsupported inference.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'DATA_GOVERNANCE',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-05-003',
    domain: 'GOV-05',
    title: 'Explicit Insufficient-Evidence Behaviour',
    requirement:
      'AI capabilities must have defined behavior for circumstances in which available evidence is insufficient to support a requested factual conclusion.',
    risk:
      'An AI system may fill evidence gaps with plausible but unsupported content when insufficient evidence is not handled explicitly.',
    controlStatement:
      'When authoritative evidence is insufficient, the governed AI capability must communicate the limitation, constrain the output or refuse the unsupported conclusion rather than manufacture an answer.',
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
    controlId: 'GOV-05-004',
    domain: 'GOV-05',
    title: 'Evidence Provenance & Traceability',
    requirement:
      'Material evidence used to ground governed AI outcomes must be traceable to its relevant source or evidence context.',
    risk:
      'Without evidence provenance, factual outputs and governance conclusions may be impossible to investigate, reproduce or verify.',
    controlStatement:
      'Governed AI processing must preserve sufficient evidence provenance to support investigation and verification without indiscriminately duplicating sensitive or unnecessary source content.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'AUDIT_LOGGING',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-05-005',
    domain: 'GOV-05',
    title: 'Evidence Failure Must Fail Safely',
    requirement:
      'Failure or unavailability of required evidence must not silently weaken factual grounding requirements.',
    risk:
      'Evidence-provider failure may otherwise cause AI functionality to continue with unsupported factual assertions.',
    controlStatement:
      'When evidence required for a governed factual outcome cannot be resolved or validated, the capability must degrade, constrain or refuse that evidence-dependent outcome rather than bypass the evidence boundary.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'EVIDENCE_BOUNDARY',
      'APPLICATION_LOGIC',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_05 =
  validatePlatformAiGovernanceDefinitions(definitions);
