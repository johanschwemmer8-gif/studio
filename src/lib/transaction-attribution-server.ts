import { z } from 'zod';

import {
  TransactionSchema,
  type Transaction,
} from '@/lib/schemas/transaction';
import {
  ShopperSessionSchema,
  type ShopperSession,
} from '@/lib/schemas/shopper-session';

/**
 * Deterministic E2 transaction-attribution eligibility.
 *
 * This utility does NOT authorize scope and does NOT query Firestore.
 * Its caller must first resolve the authoritative organizational scope and
 * provide the Deployment -> Store relationship from that authorized scope.
 *
 * Presence of sessionId alone never establishes attribution.
 */

export const E2IneligibilityReasonSchema = z.enum([
  'TRANSACTION_INVALID',
  'TRANSACTION_NOT_PRODUCTION',
  'SESSION_ID_MISSING',
  'SESSION_INVALID',
  'SESSION_ID_MISMATCH',
  'RETAILER_MISMATCH',
  'SESSION_NOT_PRODUCTION',
  'ENVIRONMENT_MISMATCH',
  'DEPLOYMENT_NOT_AUTHORIZED',
  'STORE_MISMATCH',
]);

export type E2IneligibilityReason = z.infer<
  typeof E2IneligibilityReasonSchema
>;

export type E2EligibilityResult =
  | {
      eligible: true;
      transaction: Transaction;
      session: ShopperSession;
      authoritativeStoreId: string;
    }
  | {
      eligible: false;
      reason: E2IneligibilityReason;
    };

export type EvaluateE2EligibilityInput = {
  transaction: unknown;
  session: unknown;
  expectedSessionId: string;

  /**
   * Authoritative Deployment -> Store mapping produced from the caller's
   * already-authorized organizational scope.
   *
   * Missing deploymentId means the Session's Deployment is not eligible
   * for this scope.
   */
  authorizedDeploymentStoreIds: ReadonlyMap<string, string>;
};

export function evaluateE2Eligibility(
  input: EvaluateE2EligibilityInput,
): E2EligibilityResult {
  const transactionResult = TransactionSchema.safeParse(input.transaction);

  if (!transactionResult.success) {
    return {
      eligible: false,
      reason: 'TRANSACTION_INVALID',
    };
  }

  const transaction = transactionResult.data;

  if (transaction.environment !== 'PRODUCTION') {
    return {
      eligible: false,
      reason: 'TRANSACTION_NOT_PRODUCTION',
    };
  }

  if (!transaction.sessionId) {
    return {
      eligible: false,
      reason: 'SESSION_ID_MISSING',
    };
  }

  const sessionResult = ShopperSessionSchema.safeParse(input.session);

  if (!sessionResult.success) {
    return {
      eligible: false,
      reason: 'SESSION_INVALID',
    };
  }

  const session = sessionResult.data;

  if (
    transaction.sessionId !== input.expectedSessionId ||
    session.sessionId !== input.expectedSessionId
  ) {
    return {
      eligible: false,
      reason: 'SESSION_ID_MISMATCH',
    };
  }

  if (transaction.retailerId !== session.retailerId) {
    return {
      eligible: false,
      reason: 'RETAILER_MISMATCH',
    };
  }

  if (session.environment !== 'PRODUCTION') {
    return {
      eligible: false,
      reason: 'SESSION_NOT_PRODUCTION',
    };
  }

  if (transaction.environment !== session.environment) {
    return {
      eligible: false,
      reason: 'ENVIRONMENT_MISMATCH',
    };
  }

  const authoritativeStoreId =
    input.authorizedDeploymentStoreIds.get(session.deploymentId);

  if (!authoritativeStoreId) {
    return {
      eligible: false,
      reason: 'DEPLOYMENT_NOT_AUTHORIZED',
    };
  }

  if (
    transaction.storeId !== undefined &&
    transaction.storeId !== authoritativeStoreId
  ) {
    return {
      eligible: false,
      reason: 'STORE_MISMATCH',
    };
  }

  return {
    eligible: true,
    transaction,
    session,
    authoritativeStoreId,
  };
}
