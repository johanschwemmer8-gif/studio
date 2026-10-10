import fs from 'fs';
import path from 'path';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Platform Health integrity contract', () => {
  const page = read('src/app/dashboard/platform-security/page.tsx');
  const server = read('src/lib/platform-health-server.ts');

  it('requires Platform Operator authorization', () => {
    expect(server).toContain('verifyPlatformOperator(idToken)');
  });

  it('identifies the real managed runtime without asserting health', () => {
    expect(server).toContain("hosting: 'Firebase App Hosting'");
    expect(server).toContain("cloudPlatform: 'Google Cloud'");
    expect(server).toContain('healthAssertion: null');
    expect(page).toContain('Authoritative health feed not configured');
  });

  it('represents missing monitoring explicitly', () => {
    expect(server).toContain('authoritativeHealthFeedConfigured: false');
    expect(page).toContain('Authoritative monitoring not configured');
    expect(page).toContain(
      'it is not interpreted as evidence that the platform'
    );
  });

  it('does not claim absence of incidents without an incident source', () => {
    expect(server).toContain(
      'authoritativeIncidentRegisterConfigured: false'
    );
    expect(server).toContain(
      'No authoritative platform incident register is currently configured.'
    );
    expect(page).toContain(
      'This does not mean that no incidents have occurred.'
    );
  });

  it('recognises governance audit evidence without treating it as health telemetry', () => {
    expect(server).toContain('auditLogArchitectureAvailable: true');
    expect(server).toContain(
      'Audit logs are evidence records and are not a substitute for operational health telemetry.'
    );
  });

  it('keeps operational domains separated', () => {
    expect(page).toContain('Update Manager');
    expect(page).toContain('System Connections');
    expect(page).toContain('Test Laboratory');
    expect(page).toContain('Operational Authority Boundary');
  });

  it('provides the ISO 27001 monitoring path', () => {
    expect(page).toContain('ISO 27001 Monitoring Path');
    expect(page).toContain('control-effectiveness evidence');
  });

  it('removes the previous simulation dashboard', () => {
    expect(page).not.toContain('System Monitoring Status: Simulation');
    expect(page).not.toContain('Simulation Baseline');
    expect(page).not.toContain('Latency Benchmarks');
    expect(page).not.toContain('Map Visualization - Offline');
    expect(page).not.toContain('Top Identifiers');
    expect(page).not.toContain('Operational Activity Feed');
    expect(page).not.toContain('recharts');
  });

  it('contains no fabricated uptime or healthy-state claim', () => {
    expect(page).not.toMatch(/99\.\d+%/);
    expect(page).not.toContain('All Systems Operational');
    expect(page).not.toContain('System Healthy');
    expect(server).not.toMatch(/uptime:\s*\d/);
  });
});
