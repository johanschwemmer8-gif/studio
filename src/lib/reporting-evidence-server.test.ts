import {
  resolveAuthorizedDeploymentStoreIds,
} from './reporting-evidence-server';

function timestamp(iso: string) {
  const date = new Date(iso);
  const millis = date.getTime();

  return {
    seconds: Math.floor(millis / 1000),
    nanoseconds: (millis % 1000) * 1_000_000,
    toDate: () => date,
    toMillis: () => millis,
  };
}

function deployment(
  deploymentId: string,
  retailerId: string,
  storeId: string,
) {
  const createdAt = timestamp('2026-09-01T00:00:00.000Z');

  return {
    id: deploymentId,
    data: {
      deploymentId,
      retailerId,
      activationId: `activation-${deploymentId}`,
      campaignId: `campaign-${deploymentId}`,
      storeId,
      storeName: `Store ${storeId}`,
      placement: {},
      status: 'DEPLOYED',
      createdAt,
      createdBy: 'user-test',
      updatedAt: createdAt,
      updatedBy: 'user-test',
    },
  };
}

describe('Reporting evidence deployment authority', () => {
  it('includes deployments belonging to authorised stores', () => {
    const result = resolveAuthorizedDeploymentStoreIds(
      'retailer-1',
      new Set(['store-1', 'store-2']),
      [
        deployment('deployment-1', 'retailer-1', 'store-1'),
        deployment('deployment-2', 'retailer-1', 'store-2'),
      ],
    );

    expect([...result.entries()]).toEqual([
      ['deployment-1', 'store-1'],
      ['deployment-2', 'store-2'],
    ]);
  });

  it('excludes deployments outside the authorised store scope', () => {
    const result = resolveAuthorizedDeploymentStoreIds(
      'retailer-1',
      new Set(['store-1']),
      [
        deployment('deployment-1', 'retailer-1', 'store-1'),
        deployment('deployment-2', 'retailer-1', 'store-2'),
      ],
    );

    expect([...result.entries()]).toEqual([
      ['deployment-1', 'store-1'],
    ]);
  });

  it('fails closed on a cross-tenant deployment document', () => {
    expect(() =>
      resolveAuthorizedDeploymentStoreIds(
        'retailer-1',
        new Set(['store-1']),
        [
          deployment(
            'deployment-hostile',
            'retailer-2',
            'store-1',
          ),
        ],
      ),
    ).toThrow('DEPLOYMENT_TENANT_MISMATCH');
  });

  it('returns no deployment authority when scope has no stores', () => {
    const result = resolveAuthorizedDeploymentStoreIds(
      'retailer-1',
      new Set(),
      [
        deployment('deployment-1', 'retailer-1', 'store-1'),
      ],
    );

    expect(result.size).toBe(0);
  });
});
