import fs from 'fs';
import path from 'path';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('System Connections integrity contract', () => {
  const hub = read('src/app/dashboard/core-integration/page.tsx');
  const erp = read('src/app/dashboard/core-integration/erp/page.tsx');
  const pim = read('src/app/dashboard/core-integration/pim/page.tsx');
  const cloud = read('src/app/dashboard/core-integration/cloud/page.tsx');

  const allPages = [hub, erp, pim, cloud].join('\n');

  it('defines System Connections as capability and readiness governance', () => {
    expect(hub).toContain('Integration Capability Register');
    expect(hub).toContain('Connection authority boundary');
    expect(hub).toContain('authoritative integration mechanism');
    expect(hub).toContain('verifiable evidence');
  });

  it('does not expose prototype connection-test controls', () => {
    expect(allPages).not.toContain('Test Connection');
    expect(allPages).not.toContain('Connection Successful');
    expect(allPages).not.toContain('Successfully connected');
    expect(allPages).not.toContain('handleTestConnection');
  });

  it('does not collect raw external credentials in System Connections', () => {
    expect(allPages).not.toContain('id="api-key"');
    expect(allPages).not.toContain('id="api-secret"');
    expect(allPages).not.toContain('type="password"');
    expect(allPages).not.toContain('API Endpoint URL');
  });

  it('represents ERP and PIM truthfully as not configured', () => {
    expect(erp).toContain('Production connector not configured');
    expect(erp).toContain('No live connection');
    expect(pim).toContain('Production connector not configured');
    expect(pim).toContain('No live connection');
  });

  it('represents cloud and AI as platform-managed runtime', () => {
    expect(cloud).toContain('Platform-managed runtime');
    expect(cloud).toContain('Firebase App Hosting');
    expect(cloud).toContain('Google Cloud');
    expect(cloud).toContain('AI Rules');
  });

  it('keeps System Connections separate from Platform Health', () => {
    expect(hub).toContain(
      'Platform Health separately answers whether the iNteract'
    );
    expect(cloud).toContain(
      'belong to Platform Health rather than System Connections'
    );
  });

  it('uses capability viewing rather than fake configuration actions', () => {
    expect(hub).toContain('View capability');
    expect(hub).not.toContain('Configure ERP');
    expect(hub).not.toContain('Configure PIM');
    expect(hub).not.toContain('Configure Cloud');
  });
});
