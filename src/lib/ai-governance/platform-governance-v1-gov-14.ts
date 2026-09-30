import { validatePlatformAiGovernanceDefinitions } from './validate-governance-definitions';

const definitions = [
  {
    controlId: 'GOV-14-001',
    domain: 'GOV-14',
    title: 'Tenant Isolation',
    requirement:
      'Governed AI processing must preserve authoritative tenant boundaries across data access, configuration, execution and resulting records.',
    risk:
      'AI processing may expose, combine or act on data or configuration belonging to another retailer tenant.',
    controlStatement:
      'AI capabilities must derive and enforce authoritative retailer tenancy and must not permit client-supplied or inferred context to bypass tenant isolation.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'TENANT_ISOLATION',
      'AUTHORIZATION',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-14-002',
    domain: 'GOV-14',
    title: 'Server-Side Authorization Authority',
    requirement:
      'Material AI authorization decisions must be enforced by authoritative server-side controls rather than trusted to client presentation or client-supplied claims.',
    risk:
      'Client-side authorization may be manipulated to invoke AI capabilities or governance actions beyond the caller authority.',
    controlStatement:
      'Governed AI execution and governance mutation must enforce applicable authorization on the trusted server boundary using authoritative identity and role information.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-14-003',
    domain: 'GOV-14',
    title: 'Authoritative AI Execution Context',
    requirement:
      'Material identity, tenant, capability, activation and governance context used for AI execution must originate from or be validated against authoritative platform state.',
    risk:
      'Untrusted execution context may cause AI to operate under fabricated tenancy, capability, activation or governance conditions.',
    controlStatement:
      'The AI runtime must construct or validate material execution context from authoritative platform sources and must not treat arbitrary client-provided identifiers or configuration as sufficient authority.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'SESSION_AUTHORITY',
      'TENANT_ISOLATION',
      'APPLICATION_LOGIC',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-14-004',
    domain: 'GOV-14',
    title: 'Privilege & Role Separation',
    requirement:
      'AI governance and operational privileges must be assigned according to defined roles and must preserve separation between platform and retailer authority.',
    risk:
      'Retailer users or insufficiently privileged platform users may alter platform-level governance or perform unauthorized AI administrative actions.',
    controlStatement:
      'iNteract must enforce role and privilege boundaries so that platform governance authority, retailer configuration authority and shopper interaction authority remain distinct.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'TENANT_ISOLATION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-14-005',
    domain: 'GOV-14',
    title: 'Governance Configuration Integrity',
    requirement:
      'Authoritative AI governance configuration must be protected against unauthorized creation, modification, deletion and substitution.',
    risk:
      'Unauthorized governance changes may silently weaken mandatory controls or alter the effective governance baseline.',
    controlStatement:
      'Platform AI governance state must be mutated only through authorized governed operations that validate the requested change and preserve required audit provenance.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'SCHEMA_VALIDATION',
      'AUDIT_LOGGING',
      'CHANGE_CONTROL',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-14-006',
    domain: 'GOV-14',
    title: 'Secure AI Configuration Precedence',
    requirement:
      'AI configuration resolution must apply defined authority precedence so that lower-authority configuration cannot override mandatory platform governance.',
    risk:
      'Retailer, activation or runtime configuration may override mandatory safeguards when configuration precedence is ambiguous or client-controlled.',
    controlStatement:
      'Effective AI configuration must be resolved server-side according to canonical precedence, with mandatory platform governance taking authority over retailer and activation-level configuration.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
      'SCHEMA_VALIDATION',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-14-007',
    domain: 'GOV-14',
    title: 'Secrets, Credentials & AI Provider Boundary',
    requirement:
      'Secrets, credentials and privileged AI-provider access must remain within authorized trusted execution boundaries and must not be exposed through shopper or retailer configuration.',
    risk:
      'Exposure or misuse of provider credentials may permit unauthorized model access, data exposure, service abuse or governance bypass.',
    controlStatement:
      'AI provider credentials and other privileged secrets must be confined to authorized server-side execution and must not be disclosed through client configuration, AI output or governance transparency mechanisms.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'APPLICATION_LOGIC',
      'DATA_GOVERNANCE',
    ],
    standardsMappings: [],
    visibility: 'INTERNAL_ONLY',
    retailerExtensibility: 'NONE',
  },
  {
    controlId: 'GOV-14-008',
    domain: 'GOV-14',
    title: 'Security & Governance Failure Must Fail Safely',
    requirement:
      'Failure of required authorization, tenancy, governance resolution or other mandatory security conditions must not silently permit less-governed AI execution.',
    risk:
      'System errors or unavailable governance state may cause AI execution to continue without required security or governance safeguards.',
    controlStatement:
      'When mandatory authorization, tenant isolation or governance state cannot be established, the affected AI capability must deny, restrict or safely degrade the operation rather than bypass the failed control.',
    authority: 'IMMUTABLE_PLATFORM_INVARIANT',
    applicability: 'PLATFORM',
    enforcementTypes: [
      'AUTHORIZATION',
      'TENANT_ISOLATION',
      'APPLICATION_LOGIC',
      'INCIDENT_RESPONSE',
    ],
    standardsMappings: [],
    visibility: 'READ_ONLY',
    retailerExtensibility: 'NONE',
  },
] as const;

export const PLATFORM_AI_GOVERNANCE_V1_GOV_14 =
  validatePlatformAiGovernanceDefinitions(definitions);
