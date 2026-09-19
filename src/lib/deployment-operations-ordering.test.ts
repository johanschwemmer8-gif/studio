import { compareDeploymentOperations } from './deployment-operations-ordering';

type TestDeployment = {
  deploymentId: string;
  storeName: string;
  activationName: string;
  createdAt: string;
  updatedAt: string;
};

function sortDeployments(
  deployments: TestDeployment[]
): TestDeployment[] {
  return [...deployments].sort(compareDeploymentOperations);
}

describe('Deployment Operations ordering', () => {
  test('orders newer Deployments first within the same store even when Activation names are identical', () => {
    const older: TestDeployment = {
      deploymentId: 'deployment-old',
      storeName: 'Kimberley Mall',
      activationName: 'Nike Video Test',
      createdAt: '2026-09-19T16:00:00.000Z',
      updatedAt: '2026-09-19T18:00:00.000Z',
    };

    const newer: TestDeployment = {
      deploymentId: 'deployment-new',
      storeName: 'Kimberley Mall',
      activationName: 'Nike Video Test',
      createdAt: '2026-09-19T17:30:00.000Z',
      updatedAt: '2026-09-19T17:30:00.000Z',
    };

    expect(sortDeployments([older, newer]).map((item) => item.deploymentId)).toEqual([
      'deployment-new',
      'deployment-old',
    ]);
  });

  test('does not allow a later update to make an older Deployment appear newer', () => {
    const olderButUpdatedLater: TestDeployment = {
      deploymentId: 'deployment-old',
      storeName: 'Kimberley Mall',
      activationName: 'Nike Video Test',
      createdAt: '2026-09-19T16:00:00.000Z',
      updatedAt: '2026-09-20T12:00:00.000Z',
    };

    const newer: TestDeployment = {
      deploymentId: 'deployment-new',
      storeName: 'Kimberley Mall',
      activationName: 'Nike Video Test',
      createdAt: '2026-09-19T17:30:00.000Z',
      updatedAt: '2026-09-19T17:30:00.000Z',
    };

    expect(
      sortDeployments([olderButUpdatedLater, newer]).map(
        (item) => item.deploymentId
      )
    ).toEqual(['deployment-new', 'deployment-old']);
  });

  test('uses Deployment identity as the deterministic final tie-breaker', () => {
    const common = {
      storeName: 'Kimberley Mall',
      activationName: 'Nike Video Test',
      createdAt: '2026-09-19T17:30:00.000Z',
      updatedAt: '2026-09-19T17:30:00.000Z',
    };

    expect(
      sortDeployments([
        { ...common, deploymentId: 'deployment-b' },
        { ...common, deploymentId: 'deployment-a' },
      ]).map((item) => item.deploymentId)
    ).toEqual(['deployment-a', 'deployment-b']);
  });
});
