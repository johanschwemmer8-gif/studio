import fs from 'fs';
import path from 'path';

describe('Firebase Storage retailer authorization contract', () => {
  const rules = fs.readFileSync(
    path.join(process.cwd(), 'storage.rules'),
    'utf8'
  );

  test('scopes retailer assets by retailer ID', () => {
    expect(rules).toContain(
      'match /retailer-assets/{retailerId}/{allPaths=**}'
    );
  });

  test('requires an authenticated caller for retailer asset writes', () => {
    expect(rules).toContain(
      'allow write: if request.auth != null'
    );
  });

  test('uses the authoritative retailer user profile for tenant identity', () => {
    expect(rules).toContain(
      '/databases/(default)/documents/users/$(request.auth.uid)'
    );
    expect(rules).toContain(
      ').data.uid == request.auth.uid'
    );
    expect(rules).toContain(
      ').data.retailerId == retailerId'
    );
  });

  test('requires the authoritative retailer user profile to be active', () => {
    expect(rules).toContain(
      ').data.isActive == true'
    );
  });

  test('does not trust retailer authorization from custom claims', () => {
    expect(rules).not.toContain(
      'request.auth.token.retailerId'
    );
  });

  test('does not grant Storage authority through legacy admin role claims', () => {
    expect(rules).not.toContain(
      "request.auth.token.role == 'admin'"
    );
    expect(rules).not.toContain(
      'request.auth.token.role == "admin"'
    );
  });

  test('does not introduce generic Platform Operator Storage bypass authority', () => {
    expect(rules).not.toContain('platformOperators');
    expect(rules).not.toContain('platformOperator');
    expect(rules).not.toContain('isPlatformOperator');
  });
});

describe('Retailer asset upload path contract', () => {
  const organizationManager = fs.readFileSync(
    path.join(
      process.cwd(),
      'src/components/dashboard/organization-manager.tsx'
    ),
    'utf8'
  );

  const uiManagement = fs.readFileSync(
    path.join(
      process.cwd(),
      'src/app/retailer-mvp/ui-management/page.tsx'
    ),
    'utf8'
  );

  const qrTemplateDesigner = fs.readFileSync(
    path.join(
      process.cwd(),
      'src/components/dashboard/brand-qr-template-designer.tsx'
    ),
    'utf8'
  );

  test('organization logo remains retailer namespaced', () => {
    expect(organizationManager).toContain(
      'retailer-assets/${effectiveRetailerId}/organization/'
    );
  });

  test('Retailer MVP brand logo remains retailer namespaced', () => {
    expect(uiManagement).toContain(
      'retailer-assets/${user.retailerId}/brand-logo-'
    );
  });

  test('QR template logo remains retailer namespaced', () => {
    expect(qrTemplateDesigner).toContain(
      'retailer-assets/${retailerId}/qr-templates/'
    );
  });
});
