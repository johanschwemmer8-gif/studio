export type DeploymentOperationsOrderable = {
  deploymentId: string;
  storeName: string;
  createdAt: string;
  updatedAt: string;
};

export function compareDeploymentOperations(
  a: DeploymentOperationsOrderable,
  b: DeploymentOperationsOrderable
): number {
  const storeComparison = a.storeName.localeCompare(b.storeName);

  if (storeComparison !== 0) {
    return storeComparison;
  }

  const createdComparison =
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  if (createdComparison !== 0) {
    return createdComparison;
  }

  const updatedComparison =
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  if (updatedComparison !== 0) {
    return updatedComparison;
  }

  return a.deploymentId.localeCompare(b.deploymentId);
}
