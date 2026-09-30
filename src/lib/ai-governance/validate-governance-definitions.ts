import {
  PlatformAiGovernanceControlDefinition,
  PlatformAiGovernanceControlDefinitionSchema,
} from '@/lib/schemas/ai-governance';

import {
  PLATFORM_AI_GOVERNANCE_V1_CONTROLS,
} from './platform-governance-v1';

const identityByControlId = new Map<
  string,
  (typeof PLATFORM_AI_GOVERNANCE_V1_CONTROLS)[number]
>(
  PLATFORM_AI_GOVERNANCE_V1_CONTROLS.map((control) => [
    control.controlId,
    control,
  ]),
);

/**
 * Validate substantive governance definitions against both:
 * 1. the canonical governance definition schema; and
 * 2. the frozen Platform AI Governance v1 identity catalogue.
 *
 * A definition may not silently rename, move or invent a v1 control.
 */
export function validatePlatformAiGovernanceDefinitions(
  definitions: readonly unknown[],
): PlatformAiGovernanceControlDefinition[] {
  const parsed = definitions.map((definition) =>
    PlatformAiGovernanceControlDefinitionSchema.parse(definition),
  );

  const seen = new Set<string>();

  for (const definition of parsed) {
    if (seen.has(definition.controlId)) {
      throw new Error(
        `DUPLICATE_GOVERNANCE_CONTROL_DEFINITION:${definition.controlId}`,
      );
    }

    seen.add(definition.controlId);

    const identity = identityByControlId.get(definition.controlId);

    if (!identity) {
      throw new Error(
        `UNKNOWN_GOVERNANCE_CONTROL:${definition.controlId}`,
      );
    }

    if (definition.domain !== identity.domainId) {
      throw new Error(
        `GOVERNANCE_CONTROL_DOMAIN_MISMATCH:${definition.controlId}`,
      );
    }

    if (definition.title !== identity.title) {
      throw new Error(
        `GOVERNANCE_CONTROL_TITLE_MISMATCH:${definition.controlId}`,
      );
    }
  }

  return parsed;
}
