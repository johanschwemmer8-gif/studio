'use server';

import { z } from 'genkit';
import { getAuthorizedRetailerId } from '@/lib/auth-server';
import {
  getRetailerAiGovernance,
} from '@/lib/ai-governance/retailer-governance-repository';

const GetRetailerAiGovernanceInputSchema = z.object({
  idToken: z.string(),
  retailerId: z.string(),
});

export async function getRetailerAiGovernanceForRetailer(
  input: z.infer<typeof GetRetailerAiGovernanceInputSchema>
) {
  const parsed =
    GetRetailerAiGovernanceInputSchema.parse(input);

  const authorizedRetailerId =
    await getAuthorizedRetailerId(
      parsed.idToken,
      parsed.retailerId
    );

  const governance =
    await getRetailerAiGovernance(
      authorizedRetailerId
    );

  if (!governance) {
    return {
      governance: null,
    };
  }

  return {
    governance: {
      retailerId: governance.retailerId,
      governanceVersion:
        governance.governanceVersion,
      status: governance.status,
      additiveRules: governance.additiveRules,
    },
  };
}
