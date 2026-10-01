'use server';

/**
 * Persists Retailer Additive AI Governance.
 *
 * SECURITY:
 * - Firebase token establishes identity.
 * - Authoritative /users profile establishes retailer authorization.
 * - Browser-supplied retailerId is never tenant authority.
 * - createdBy/updatedBy and timestamps are server-owned.
 * - Retailer rules must pass Platform Governance additive-authority validation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import {
  getAuthorizedRetailerId,
  verifyAuth,
} from '@/lib/auth-server';
import {
  RetailerAiGovernanceRuleSchema,
  RetailerAiGovernanceStatusSchema,
} from '@/lib/schemas/retailer-ai-governance';
import {
  validateRetailerAiGovernance,
} from '@/lib/ai-governance/validate-retailer-ai-governance';

if (!admin.apps.length) {
  admin.initializeApp();
}

const SaveRetailerAiGovernanceInputSchema = z.object({
  idToken: z.string(),
  retailerId: z.string(),
  governanceVersion: z.string().min(1),
  status: RetailerAiGovernanceStatusSchema,
  additiveRules: z.array(
    RetailerAiGovernanceRuleSchema
  ),
});

const SaveRetailerAiGovernanceOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function saveRetailerAiGovernance(
  input: z.infer<
    typeof SaveRetailerAiGovernanceInputSchema
  >
) {
  return saveRetailerAiGovernanceFlow(input);
}

const saveRetailerAiGovernanceFlow = ai.defineFlow(
  {
    name: 'saveRetailerAiGovernanceFlow',
    inputSchema: SaveRetailerAiGovernanceInputSchema,
    outputSchema: SaveRetailerAiGovernanceOutputSchema,
  },
  async ({
    idToken,
    retailerId,
    governanceVersion,
    status,
    additiveRules,
  }) => {
    const auth = await verifyAuth(idToken);

    if ('error' in auth) {
      throw new Error(auth.error);
    }

    const authorizedRetailerId =
      await getAuthorizedRetailerId(
        idToken,
        retailerId
      );

    const db = admin.firestore();
    const ref = db
      .collection('retailerAiGovernance')
      .doc(authorizedRetailerId);

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      const existingData = existing.exists
        ? existing.data()
        : undefined;

      const governance = {
        retailerId: authorizedRetailerId,
        governanceVersion,
        status,
        additiveRules,
        createdAt:
          existingData?.createdAt ??
          admin.firestore.FieldValue.serverTimestamp(),
        createdBy:
          existingData?.createdBy ?? auth.uid,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: auth.uid,
      };

      validateRetailerAiGovernance(governance);

      transaction.set(ref, governance);
    });

    return {
      success: true,
      message:
        'Retailer additive AI governance saved.',
    };
  }
);
