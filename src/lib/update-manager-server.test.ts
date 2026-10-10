import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

describe('Update Manager architecture contract', () => {
  const server = readFileSync(
    join(root, 'src/lib/update-manager-server.ts'),
    'utf8'
  );

  const page = readFileSync(
    join(
      root,
      'src/app/dashboard/retailers-dashboards/page.tsx'
    ),
    'utf8'
  );

  test('requires Platform Operator authorization', () => {
    expect(server).toContain('verifyPlatformOperator(idToken)');
  });

  test('uses canonical tenant estate', () => {
    expect(server).toContain("collection('tenants')");
    expect(server).toContain('normalizeTenantDocument');
  });

  test('distinguishes production and test tenants', () => {
    expect(server).toContain("tenant.tenantType === 'production'");
    expect(server).toContain("tenant.tenantType === 'test'");
    expect(page).toContain('Production Tenants');
    expect(page).toContain('Test Tenants');
  });

  test('does not claim to deploy retailer dashboards', () => {
    expect(page).not.toContain('Update All Retailer Dashboards');
    expect(page).not.toContain(
      'Push new features, bug fixes, or UI changes to all retailer dashboards simultaneously.'
    );
    expect(page).not.toContain('Retailer MVP Edit');
    expect(page).not.toContain(
      'template that gets deployed to all retailers'
    );
  });

  test('states the real central delivery boundary', () => {
    expect(page).toContain('Platform Delivery Model');
    expect(page).toContain('Deployment authority boundary');
    expect(page).toContain('Deployment authority boundary');
    expect(page).toContain('provides governance and impact visibility');
    expect(page).toContain('parallel deployment mechanism');
  });

  test('does not fabricate release history or feature flags', () => {
    expect(server).toContain(
      'No authoritative release register is currently configured.'
    );
    expect(server).toContain(
      'No tenant-specific feature availability model is currently configured.'
    );
    expect(page).toContain('No release history');
    expect(page).toContain('has been fabricated or inferred.');
    expect(page).toContain('Update Manager does');
    expect(page).toContain(
      'not invent feature flags or tenant entitlements.'
    );
  });
});
