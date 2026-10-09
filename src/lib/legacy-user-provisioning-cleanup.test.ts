import fs from 'fs';
import path from 'path';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('legacy user provisioning cleanup contract', () => {
  test('obsolete provisioning implementation files remain removed', () => {
    expect(fs.existsSync(
      path.join(process.cwd(), 'src/app/create-admin/page.tsx')
    )).toBe(false);

    expect(fs.existsSync(
      path.join(process.cwd(), 'src/components/dashboard/user-management.tsx')
    )).toBe(false);

    expect(fs.existsSync(
      path.join(process.cwd(), 'src/components/dashboard/user-permissions.tsx')
    )).toBe(false);

    expect(fs.existsSync(
      path.join(process.cwd(), 'src/ai/flows/list-auth-users.ts')
    )).toBe(false);
  });

  test('platform User Access resolves to canonical retailer administration', () => {
    const layout = read('src/app/dashboard/layout.tsx');

    expect(layout).toContain('href="/dashboard/admin"');
    expect(layout).not.toContain('href="/create-admin"');
  });

  test('legacy user-admin route redirects to canonical retailer administration', () => {
    const legacyRoute = read('src/app/dashboard/user-admin/page.tsx');

    expect(legacyRoute).toContain("router.replace('/dashboard/admin')");
    expect(legacyRoute).not.toContain("router.replace('/create-admin')");
  });

  test('obsolete credential and claims provisioning cannot return through known surfaces', () => {
    const devBootstrap = read('src/ai/dev.ts');
    const flowIndex = read('src/ai/flows/index.ts');

    expect(devBootstrap).not.toContain('assign-user-claims');
    expect(flowIndex).not.toContain('list-auth-users');
    expect(flowIndex).not.toContain('listAuthUsers');
  });

  test('canonical provisioning remains server-authorized and credentialless', () => {
    const platform = read('src/lib/platform-user-management-server.ts');
    const retailer = read('src/lib/retailer-user-management-server.ts');

    expect(platform).toContain('verifyPlatformOperator');
    expect(platform).toContain('auth.createUser({');
    expect(retailer).toContain('auth.createUser({');

    expect(platform).not.toMatch(
      /auth\.createUser\(\{[\s\S]{0,500}?password\s*:/
    );

    expect(retailer).not.toMatch(
      /auth\.createUser\(\{[\s\S]{0,500}?password\s*:/
    );
  });
});
