import {
  normalizeTenantDocument,
  normalizeTenantLifecycleStatus,
} from './tenant';

describe('tenant schema compatibility', () => {
  it('normalizes legacy active status to ACTIVE', () => {
    expect(
      normalizeTenantLifecycleStatus(undefined, 'active')
    ).toBe('ACTIVE');
  });

  it('preserves canonical lifecycle status', () => {
    expect(
      normalizeTenantLifecycleStatus('OFFBOARDING', undefined)
    ).toBe('OFFBOARDING');
  });

  it('rejects a missing lifecycle state when no legacy active state exists', () => {
    expect(() =>
      normalizeTenantLifecycleStatus(undefined, undefined)
    ).toThrow('Tenant lifecycle status is missing or unrecognized.');
  });

  it('rejects an unrecognized lifecycle state', () => {
    expect(() =>
      normalizeTenantLifecycleStatus('UNKNOWN_STATE', undefined)
    ).toThrow('Tenant lifecycle status is missing or unrecognized.');
  });

  it('projects a legacy tenant into the canonical model', () => {
    const tenant = normalizeTenantDocument('heritage-vineyards', {
      name: 'Heritage Vineyards',
      type: 'production',
      status: 'active',
      createdAt: {},
    });

    expect(tenant.id).toBe('heritage-vineyards');
    expect(tenant.lifecycleStatus).toBe('ACTIVE');
    expect(tenant.type).toBe('production');
  });

  it('preserves canonical tenant lifecycle state', () => {
    const tenant = normalizeTenantDocument('example-retailer', {
      name: 'Example Retailer',
      type: 'production',
      lifecycleStatus: 'SUSPENDED',
      createdAt: {},
    });

    expect(tenant.lifecycleStatus).toBe('SUSPENDED');
  });
});
