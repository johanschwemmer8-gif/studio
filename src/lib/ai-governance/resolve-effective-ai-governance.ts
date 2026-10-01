import {
  resolveActiveAiGovernance,
  type ResolvedActiveAiGovernance,
} from './resolve-active-ai-governance';
import {
  getRetailerAiGovernance,
} from './retailer-governance-repository';
import {
  validateRetailerAiGovernance,
} from './validate-retailer-ai-governance';
import type {
  RetailerAiGovernanceRule,
} from '@/lib/schemas/retailer-ai-governance';

export type ResolvedEffectiveAiGovernance =
  ResolvedActiveAiGovernance & {
    retailerId: string;
    retailerGovernanceVersion: string | null;
    retailerGovernanceApplied: boolean;
    retailerAdditiveRules:
      RetailerAiGovernanceRule[];
  };

export async function resolveEffectiveAiGovernance(
  capabilityId: string,
  retailerId: string
): Promise<ResolvedEffectiveAiGovernance> {
  if (!retailerId) {
    throw new Error(
      'RETAILER_AI_GOVERNANCE_DENIED:RETAILER_ID_REQUIRED'
    );
  }

  /*
   * Platform Governance is always resolved first.
   * Any Platform Governance failure therefore remains
   * authoritative and fail-closed.
   */
  const platformGovernance =
    await resolveActiveAiGovernance(capabilityId);

  const retailerGovernance =
    await getRetailerAiGovernance(retailerId);

  /*
   * Absence of retailer governance means the mandatory
   * Platform Governance baseline applies unchanged.
   */
  if (!retailerGovernance) {
    return {
      ...platformGovernance,
      retailerId,
      retailerGovernanceVersion: null,
      retailerGovernanceApplied: false,
      retailerAdditiveRules: [],
    };
  }

  /*
   * Validate persisted governance again at runtime.
   * Persistence-time validation is not sufficient authority
   * for execution-time governance.
   */
  const validated =
    validateRetailerAiGovernance(
      retailerGovernance
    );

  /*
   * INACTIVE retailer governance contributes no additions.
   * Platform Governance remains fully authoritative.
   */
  if (validated.status !== 'ACTIVE') {
    return {
      ...platformGovernance,
      retailerId,
      retailerGovernanceVersion:
        validated.governanceVersion,
      retailerGovernanceApplied: false,
      retailerAdditiveRules: [],
    };
  }

  return {
    ...platformGovernance,
    retailerId,
    retailerGovernanceVersion:
      validated.governanceVersion,
    retailerGovernanceApplied: true,
    retailerAdditiveRules:
      validated.additiveRules,
  };
}
