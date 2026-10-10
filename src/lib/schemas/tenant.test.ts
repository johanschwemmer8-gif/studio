import {
  normalizeTenantDocument,
  normalizeTenantLifecycleStatus,
  isTenantActive,
  isTenantOperational,
  getNextTenantLifecycleStatus,
  canTransitionTenantLifecycle,
  isTenantDecommissioningReady,
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

  it('treats canonical ACTIVE tenant as active', () => {
    expect(isTenantActive('ACTIVE', undefined)).toBe(true);
  });

  it('treats legacy active tenant as active', () => {
    expect(isTenantActive(undefined, 'active')).toBe(true);
  });

  it('treats suspended tenant as inactive', () => {
    expect(isTenantActive('SUSPENDED', 'active')).toBe(false);
  });

  it('fails closed for missing or unrecognized tenant lifecycle', () => {
    expect(isTenantActive(undefined, undefined)).toBe(false);
    expect(isTenantActive('UNKNOWN_STATE', undefined)).toBe(false);
  });

  it('treats ACTIVE and OFFBOARDING tenants as operational', () => {
    expect(isTenantOperational('ACTIVE', undefined)).toBe(true);
    expect(isTenantOperational('OFFBOARDING', undefined)).toBe(true);
  });

  it('treats legacy active tenant as operational', () => {
    expect(isTenantOperational(undefined, 'active')).toBe(true);
  });

  it('blocks SUSPENDED and DECOMMISSIONED tenants from runtime operation', () => {
    expect(isTenantOperational('SUSPENDED', undefined)).toBe(false);
    expect(isTenantOperational('DECOMMISSIONED', undefined)).toBe(false);
  });

  it('fails closed for missing or unrecognized operational lifecycle', () => {
    expect(isTenantOperational(undefined, undefined)).toBe(false);
    expect(isTenantOperational('UNKNOWN_STATE', undefined)).toBe(false);
  });

  it('enforces the canonical forward-only lifecycle transition sequence', () => {
    expect(getNextTenantLifecycleStatus('ACTIVE')).toBe('OFFBOARDING');
    expect(getNextTenantLifecycleStatus('OFFBOARDING')).toBe('SUSPENDED');
    expect(getNextTenantLifecycleStatus('SUSPENDED')).toBe('DECOMMISSIONED');
    expect(getNextTenantLifecycleStatus('DECOMMISSIONED')).toBeNull();
  });

  it('rejects skipped, reversed, and terminal lifecycle transitions', () => {
    expect(canTransitionTenantLifecycle('ACTIVE', 'OFFBOARDING')).toBe(true);
    expect(canTransitionTenantLifecycle('OFFBOARDING', 'SUSPENDED')).toBe(true);
    expect(canTransitionTenantLifecycle('SUSPENDED', 'DECOMMISSIONED')).toBe(true);

    expect(canTransitionTenantLifecycle('ACTIVE', 'SUSPENDED')).toBe(false);
    expect(canTransitionTenantLifecycle('ACTIVE', 'DECOMMISSIONED')).toBe(false);
    expect(canTransitionTenantLifecycle('OFFBOARDING', 'ACTIVE')).toBe(false);
    expect(canTransitionTenantLifecycle('SUSPENDED', 'ACTIVE')).toBe(false);
    expect(canTransitionTenantLifecycle('DECOMMISSIONED', 'ACTIVE')).toBe(false);
  });

  it('requires all offboarding checkpoints before decommissioning readiness', () => {
    expect(isTenantDecommissioningReady(undefined)).toBe(false);

    expect(
      isTenantDecommissioningReady({
        exportPreparation: {
          completed: true,
          completedAt: {},
          completedBy: 'operator-1',
        },
        handover: {
          completed: true,
          completedAt: {},
          completedBy: 'operator-1',
        },
      })
    ).toBe(false);

    expect(
      isTenantDecommissioningReady({
        exportPreparation: {
          completed: true,
          completedAt: {},
          completedBy: 'operator-1',
        },
        handover: {
          completed: true,
          completedAt: {},
          completedBy: 'operator-1',
        },
        retentionDecision: {
          decision: 'RETAIN',
          recordedAt: {},
          recordedBy: 'operator-1',
        },
      })
    ).toBe(true);
  });

  it('preserves canonical offboarding checkpoint evidence', () => {
    const tenant = normalizeTenantDocument('example-retailer', {
      name: 'Example Retailer',
      type: 'production',
      lifecycleStatus: 'SUSPENDED',
      createdAt: {},
      offboarding: {
        exportPreparation: {
          completed: true,
          completedAt: {},
          completedBy: 'operator-1',
        },
        handover: {
          completed: true,
          completedAt: {},
          completedBy: 'operator-1',
        },
        retentionDecision: {
          decision: 'DELETE_AFTER_RETENTION',
          recordedAt: {},
          recordedBy: 'operator-1',
        },
      },
    });

    expect(tenant.offboarding?.exportPreparation?.completed).toBe(true);
    expect(tenant.offboarding?.handover?.completed).toBe(true);
    expect(tenant.offboarding?.retentionDecision?.decision).toBe(
      'DELETE_AFTER_RETENTION'
    );
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
