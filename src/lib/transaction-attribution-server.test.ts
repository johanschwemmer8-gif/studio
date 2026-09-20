import {
  evaluateE2Eligibility,
} from './transaction-attribution-server';

const timestamp = {
  seconds: 1_700_000_000,
  nanoseconds: 0,
};

function transaction(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    transactionId: 'txn_1',
    retailerId: 'retailer_1',
    amount: 250,
    currency: 'ZAR',
    timestamp,
    sessionId: 'sess_1',
    storeId: 'store_1',
    source: 'POS',
    dataStatus: 'VERIFIED',
    environment: 'PRODUCTION',
    ...overrides,
  };
}

function session(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    sessionId: 'sess_1',
    retailerId: 'retailer_1',
    campaignId: 'campaign_1',
    activationId: 'activation_1',
    deploymentId: 'deployment_1',
    qrCodeId: 'qr_1',
    configurationVersion: 1,
    environment: 'PRODUCTION',
    startedAt: timestamp,
    lastInteractionAt: timestamp,
    ...overrides,
  };
}

const authorizedDeployments = new Map([
  ['deployment_1', 'store_1'],
]);

describe('evaluateE2Eligibility', () => {
  it('accepts a valid production transaction deterministically linked to an authorized Session', () => {
    const result = evaluateE2Eligibility({
      transaction: transaction(),
      session: session(),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result.eligible).toBe(true);

    if (result.eligible) {
      expect(result.authoritativeStoreId).toBe('store_1');
      expect(result.transaction.transactionId).toBe('txn_1');
      expect(result.session.sessionId).toBe('sess_1');
    }
  });

  it('rejects an invalid transaction contract', () => {
    const result = evaluateE2Eligibility({
      transaction: transaction({ currency: 'RAND' }),
      session: session(),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'TRANSACTION_INVALID',
    });
  });

  it('rejects TEST and DEMO transactions', () => {
    for (const environment of ['TEST', 'DEMO']) {
      const result = evaluateE2Eligibility({
        transaction: transaction({ environment }),
        session: session(),
        expectedSessionId: 'sess_1',
        authorizedDeploymentStoreIds: authorizedDeployments,
      });

      expect(result).toEqual({
        eligible: false,
        reason: 'TRANSACTION_NOT_PRODUCTION',
      });
    }
  });

  it('rejects a transaction without sessionId', () => {
    const txn = transaction();
    delete txn.sessionId;

    const result = evaluateE2Eligibility({
      transaction: txn,
      session: session(),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'SESSION_ID_MISSING',
    });
  });

  it('rejects a malformed Shopper Session', () => {
    const result = evaluateE2Eligibility({
      transaction: transaction(),
      session: session({ deploymentId: '' }),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'SESSION_INVALID',
    });
  });

  it('rejects a mismatched Session identity', () => {
    const result = evaluateE2Eligibility({
      transaction: transaction(),
      session: session({ sessionId: 'sess_other' }),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'SESSION_ID_MISMATCH',
    });
  });

  it('rejects a cross-retailer transaction', () => {
    const result = evaluateE2Eligibility({
      transaction: transaction({ retailerId: 'retailer_other' }),
      session: session(),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'RETAILER_MISMATCH',
    });
  });

  it('rejects a non-production Shopper Session', () => {
    const result = evaluateE2Eligibility({
      transaction: transaction(),
      session: session({ environment: 'DEMO' }),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'SESSION_NOT_PRODUCTION',
    });
  });

  it('rejects a Session whose Deployment is outside authorized scope', () => {
    const result = evaluateE2Eligibility({
      transaction: transaction(),
      session: session({ deploymentId: 'deployment_other' }),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'DEPLOYMENT_NOT_AUTHORIZED',
    });
  });

  it('rejects a transaction Store that contradicts the authoritative Deployment Store', () => {
    const result = evaluateE2Eligibility({
      transaction: transaction({ storeId: 'store_other' }),
      session: session(),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'STORE_MISMATCH',
    });
  });

  it('does not require transaction.storeId when Store authority comes from the Deployment', () => {
    const txn = transaction();
    delete txn.storeId;

    const result = evaluateE2Eligibility({
      transaction: txn,
      session: session(),
      expectedSessionId: 'sess_1',
      authorizedDeploymentStoreIds: authorizedDeployments,
    });

    expect(result.eligible).toBe(true);

    if (result.eligible) {
      expect(result.authoritativeStoreId).toBe('store_1');
    }
  });
});
