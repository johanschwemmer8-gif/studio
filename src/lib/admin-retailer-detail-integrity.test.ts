import fs from 'fs';
import path from 'path';

describe('Admin retailer detail integrity', () => {
  const pagePath = path.join(
    process.cwd(),
    'src/app/dashboard/admin/view/[retailerName]/page.tsx'
  );

  const source = fs.readFileSync(pagePath, 'utf8');

  it('does not present unsupported retailer activity metrics as factual data', () => {
    expect(source).not.toContain('Tenant Activity Audit');
    expect(source).not.toContain('True Reach');
    expect(source).not.toContain('Assisted Sales');
    expect(source).not.toContain('Uplift Delta');
    expect(source).not.toContain('Active Points');
  });

  it('preserves canonical retailer lifecycle governance controls', () => {
    expect(source).toContain('Retailer Lifecycle');
    expect(source).toContain('Begin Offboarding');
    expect(source).toContain('Suspend Retailer Access');
    expect(source).toContain('Decommission Retailer');
    expect(source).toContain('Offboarding Checkpoints');
  });

  it('continues to normalize the authoritative tenant document', () => {
    expect(source).toContain('normalizeTenantDocument');
    expect(source).toContain("doc(db, 'tenants', id)");
  });
});
