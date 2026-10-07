import fs from 'fs';
import path from 'path';

describe('OrganizationManager selected-retailer context contract', () => {
  const source = fs.readFileSync(
    path.join(
      process.cwd(),
      'src/components/dashboard/organization-manager.tsx'
    ),
    'utf8'
  );

  test('supports explicit Platform Operator retailer context', () => {
    expect(source).toContain('retailerId?: string');
    expect(source).toContain('platformContext?: boolean');
    expect(source).toContain(
      'const effectiveRetailerId = platformContext ? retailerId : user?.retailerId'
    );
  });

  test('uses effective retailer context for organization load and save', () => {
    expect(source).toContain(
      "doc(db, 'configurations', `${effectiveRetailerId}_org`)"
    );
    expect(source).toContain('retailerId: effectiveRetailerId');
  });

  test('does not use browser migration data in Platform context', () => {
    expect(source).toContain('} else if (!platformContext) {');
    expect(source).toContain(
      "localStorage.getItem('retail-organization-structure')"
    );
    expect(source).toMatch(
      /if\s*\(!platformContext\)\s*\{\s*localStorage\.removeItem\('retail-organization-structure'\);\s*\}/
    );
  });

  test('keeps retailer branding retailer-owned in Platform context', () => {
    expect(source).toContain('{platformContext ? (');
    expect(source).toContain(
      'Managed by the retailer through the Retailer MVP. Visible here for onboarding, support and verification.'
    );
    expect(source).toContain('disabled={isLogoUploading}');
    expect(source).not.toContain('disabled={isLogoUploading || platformContext}');
    expect(source).not.toContain('Platform Logo Upload Pending');
  });
});

describe('Admin View Network route contract', () => {
  const detailSource = fs.readFileSync(
    path.join(
      process.cwd(),
      'src/app/dashboard/admin/view/[retailerName]/page.tsx'
    ),
    'utf8'
  );

  const networkSource = fs.readFileSync(
    path.join(
      process.cwd(),
      'src/app/dashboard/admin/view/[retailerName]/network/page.tsx'
    ),
    'utf8'
  );

  test('connects View Network to selected retailer route', () => {
    expect(detailSource).toContain(
      'href={`/dashboard/admin/view/${retailer.id}/network`}'
    );
  });

  test('passes selected retailer explicitly without impersonation', () => {
    expect(networkSource).toContain('retailerId={retailer.id}');
    expect(networkSource).toContain('platformContext');
    expect(networkSource).not.toContain('setCustomUserClaims');
  });
});
