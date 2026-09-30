import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-06-001',
    domain: 'GOV-06',
    title: 'Authoritative Data Source Identification',
    requirement:
      'Governed AI capabilities must identify the authoritative data sources applicable to factual and operational decisions.',
    risk:
      'AI processing may rely on untrusted, ambiguous or non-authoritative data when source authority is undefined.',
    controlStatement:
      'iNteract must define and preserve authoritative data-source boundaries for governed AI capabilities and must not silently substitute lower-authority data as established fact.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'EVIDENCE_BOUNDARY',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-06-002',
    domain: 'GOV-06',
    title: 'Data Provenance & Lineage',
    requirement:
      'Material data used by governed AI must retain sufficient provenance and lineage to establish its origin and relevant transformations.',
    risk:
      'Loss of data lineage may prevent validation, investigation or reconstruction of AI outcomes.',
    controlStatement:
      'Governed AI data processing must preserve sufficient provenance and transformation lineage for material evidence and decision inputs appropriate to the capability and risk.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-06-003',
    domain: 'GOV-06',
    title: 'Data Quality & Suitability Validation',
    requirement:
      'Data used for governed AI outcomes must be sufficiently suitable and reliable for its intended purpose.',
    risk:
      'Incorrect, malformed or unsuitable data may produce unreliable AI outputs even when the AI processing itself operates as designed.',
    controlStatement:
      'Governed AI capabilities must apply proportionate validation to material data inputs and must not treat data as suitable merely because it is available.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'SCHEMA_VALIDATION',
      'EVIDENCE_BOUNDARY',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-06-004',
    domain: 'GOV-06',
    title: 'Data Completeness Must Not Be Assumed',
    requirement:
      'Governed AI must not assume that available data is complete when completeness has not been established.',
    risk:
      'Missing data may be interpreted as negative evidence or filled with unsupported assumptions, producing misleading outcomes.',
    controlStatement:
      'AI processing must represent material data gaps explicitly and must not manufacture missing attributes, evidence or conclusions from absence alone.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'EVIDENCE_BOUNDARY',
      'MODEL_INSTRUCTION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-06-005',
    domain: 'GOV-06',
    title: 'Data Freshness & Temporal Validity',
    requirement:
      'Time-sensitive data used by governed AI must be evaluated for relevant freshness and temporal validity.',
    risk:
      'Stale information may be presented as current and cause incorrect recommendations, analysis or operational conclusions.',
    controlStatement:
      'Where freshness materially affects an AI outcome, the capability must preserve or evaluate relevant temporal context and must not represent stale evidence as current without appropriate qualification.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CONDITIONAL',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'EVIDENCE_BOUNDARY',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-06-006',
    domain: 'GOV-06',
    title: 'Conflicting Data Resolution',
    requirement:
      'Material conflicts between data sources must be handled according to defined source authority and evidence rules.',
    risk:
      'AI may arbitrarily select among conflicting facts or conceal material disagreement between sources.',
    controlStatement:
      'Governed AI processing must resolve material data conflicts using defined authority rules or explicitly preserve unresolved conflict when a reliable resolution cannot be established.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CONDITIONAL',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'EVIDENCE_BOUNDARY',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-06-007',
    domain: 'GOV-06',
    title: 'Data Transformation Integrity',
    requirement:
      'Material transformations applied to data used by governed AI must preserve intended meaning and relevant integrity.',
    risk:
      'Incorrect normalization, aggregation, conversion or enrichment may alter data meaning and produce unsupported AI conclusions.',
    controlStatement:
      'Material data transformations must be deterministic or otherwise governed, traceable where appropriate, and validated so that transformed data does not silently misrepresent authoritative source information.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'SCHEMA_VALIDATION',
      'AUDIT_LOGGING',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-06-008',
    domain: 'GOV-06',
    title: 'Permitted Data Use Boundary',
    requirement:
      'Governed AI capabilities must use data only within authorized purposes and applicable governance boundaries.',
    risk:
      'Data collected or available for one purpose may be reused in an unauthorized or inappropriate AI context.',
    controlStatement:
      'AI processing must enforce applicable purpose, privacy, tenant and capability boundaries governing use of data and must not treat technical accessibility as authorization for AI use.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'AUTHORIZATION',
      'PRIVACY_CONTROL',
      'TENANT_ISOLATION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-06-009',
    domain: 'GOV-06',
    title: 'Data Quality Failure Must Propagate Safely',
    requirement:
      'Material data-quality failure must not be silently converted into apparently reliable AI output.',
    risk:
      'AI may continue operating on invalid, missing or unreliable data and create false confidence in the resulting output.',
    controlStatement:
      'When required data fails material quality, authority or validation requirements, the affected AI outcome must be constrained, qualified or refused according to the capability risk rather than bypassing the failure.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'CAPABILITY',
    enforcementTypes: [
      'DATA_GOVERNANCE',
      'EVIDENCE_BOUNDARY',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_06 =
  validatePlatformAiGovernanceDefinitions(definitions);
