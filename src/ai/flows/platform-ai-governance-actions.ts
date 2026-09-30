'use server';

import {
  bootstrapPlatformAiGovernanceV1,
} from '@/lib/ai-governance/bootstrap-platform-ai-governance-v1';
import {
  approvePlatformAiGovernance,
} from '@/lib/ai-governance/approve-platform-ai-governance';
import {
  activatePlatformAiGovernance,
} from '@/lib/ai-governance/activate-platform-ai-governance';
import {
  PLATFORM_AI_GOVERNANCE_V1_ID,
  PLATFORM_AI_GOVERNANCE_V1_VERSION,
} from '@/lib/ai-governance/platform-governance-v1';

export async function initializePlatformAiGovernanceV1(
  idToken: string
) {
  try {
    const result =
      await bootstrapPlatformAiGovernanceV1({
        idToken,
        reason:
          'Initialize canonical Platform AI Governance v1.',
      });

    return {
      success: true as const,
      result,
    };
  } catch (error) {
    console.error(
      '[AI Governance] Initialization failed:',
      error
    );

    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : 'AI governance initialization failed.',
    };
  }
}

export async function approvePlatformAiGovernanceV1(
  idToken: string
) {
  try {
    const result =
      await approvePlatformAiGovernance({
        idToken,
        governanceId:
          PLATFORM_AI_GOVERNANCE_V1_ID,
        governanceVersion:
          PLATFORM_AI_GOVERNANCE_V1_VERSION,
        reason:
          'Platform Operator approval of canonical Platform AI Governance v1.',
      });

    return {
      success: true as const,
      result,
    };
  } catch (error) {
    console.error(
      '[AI Governance] Approval failed:',
      error
    );

    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : 'AI governance approval failed.',
    };
  }
}

export async function activatePlatformAiGovernanceV1(
  idToken: string
) {
  try {
    const result =
      await activatePlatformAiGovernance({
        idToken,
        governanceId:
          PLATFORM_AI_GOVERNANCE_V1_ID,
        governanceVersion:
          PLATFORM_AI_GOVERNANCE_V1_VERSION,
        reason:
          'Platform Operator activation of canonical Platform AI Governance v1.',
      });

    return {
      success: true as const,
      result,
    };
  } catch (error) {
    console.error(
      '[AI Governance] Activation failed:',
      error
    );

    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : 'AI governance activation failed.',
    };
  }
}
