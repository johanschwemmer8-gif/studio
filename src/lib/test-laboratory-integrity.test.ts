import fs from 'fs';
import path from 'path';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Test Laboratory integrity contract', () => {
  const page = read('src/app/dashboard/system-integration/page.tsx');
  const server = read('src/lib/test-laboratory-server.ts');

  it('requires Platform Operator authorization', () => {
    expect(server).toContain('verifyPlatformOperator(idToken)');
  });

  it('defines only real pilot diagnostics', () => {
    expect(server).toContain('Platform Authorization');
    expect(server).toContain('Firestore Connectivity');
    expect(server).toContain('Runtime Configuration');
    expect(server).not.toContain('Database Integrity');
    expect(server).not.toContain('API Suite');
    expect(server).not.toContain('User Acceptance (UAT)');
  });

  it('executes a controlled Firestore read without mutation', () => {
    expect(server).toContain(
      "db.collection('tenants').limit(1).get()"
    );
    expect(server).not.toMatch(/\.add\(/);
    expect(server).not.toMatch(/\.set\(/);
    expect(server).not.toMatch(/\.update\(/);
    expect(server).not.toMatch(/\.delete\(/);
  });

  it('does not expose secret values', () => {
    expect(server).toContain('Boolean(process.env.GEMINI_API_KEY)');
    expect(server).not.toMatch(
      /evidence:\s*process\.env\.GEMINI_API_KEY/
    );
    expect(server).toContain('Secret values were not returned');
  });

  it('locks the point-in-time evidence boundary', () => {
    expect(server).toContain(
      'A PASS proves only that the defined diagnostic succeeded when executed.'
    );
    expect(page).toContain('Test evidence boundary');
    expect(page).toContain('point-in-time diagnostics');
  });

  it('starts diagnostics as NOT RUN in the UI', () => {
    expect(page).toContain('NOT RUN');
    expect(page).toContain('Run Diagnostic');
  });

  it('contains no simulated test execution', () => {
    expect(page).not.toContain('Math.random');
    expect(page).not.toContain('setTimeout');
    expect(page).not.toContain('Test Passed');
    expect(page).not.toContain('Test Failed');
    expect(page).not.toContain('QR Generation: Operational');
    expect(page).not.toContain('AI Services: Operational');
    expect(page).not.toContain('Database: Operational');
  });

  it('keeps Test Laboratory separate from Platform Health', () => {
    expect(page).toContain(
      'Platform Health owns continuous operational monitoring'
    );
    expect(page).toContain(
      'System Connections owns external integration capability'
    );
    expect(page).toContain(
      'Update Manager owns application change governance'
    );
  });

  it('removes the simulated performance and static scan-failure routes', () => {
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          'src/app/dashboard/system-integration/performance/page.tsx'
        )
      )
    ).toBe(false);

    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          'src/app/dashboard/system-integration/scan-failures/page.tsx'
        )
      )
    ).toBe(false);
  });
});
