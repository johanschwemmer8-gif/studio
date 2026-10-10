import { readFileSync } from 'fs';
import { join } from 'path';

describe('Portfolio ROI architecture contract', () => {
  const root = process.cwd();

  const portfolioServer = readFileSync(
    join(root, 'src/lib/portfolio-roi-server.ts'),
    'utf8'
  );

  const evidenceServer = readFileSync(
    join(root, 'src/lib/profit-roi-evidence-server.ts'),
    'utf8'
  );

  test('requires Platform Operator authorization', () => {
    expect(portfolioServer).toContain('verifyPlatformOperator(idToken)');
  });

  test('enumerates the canonical tenant estate', () => {
    expect(portfolioServer).toContain("collection('tenants')");
    expect(portfolioServer).toContain('normalizeTenantDocument');
  });

  test('uses the canonical tenant-scoped Profit & ROI evidence kernel', () => {
    expect(portfolioServer).toContain('getProfitRoiEvidenceForScope');
    expect(evidenceServer).toContain(
      'export async function getProfitRoiEvidenceForScope'
    );
  });

  test('retailer authorization remains independently enforced', () => {
    expect(evidenceServer).toContain('verifyAuth(idToken)');
    expect(evidenceServer).toContain('ROI_ACCESS_DENIED');
  });

  test('contains no synthetic portfolio performance generation', () => {
    expect(portfolioServer).not.toContain('Math.random');
    expect(portfolioServer).not.toContain('Woolworths');
    expect(portfolioServer).not.toContain('TFG');
    expect(portfolioServer).not.toContain('Dis-Chem');
  });

  test('legacy simulated Executive ROI flow has been removed', () => {
    expect(() =>
      readFileSync(
        join(root, 'src/ai/flows/get-executive-roi-metrics.ts'),
        'utf8'
      )
    ).toThrow();
  });

  test('Portfolio ROI page contains no simulated-performance language', () => {
    const page = readFileSync(
      join(root, 'src/app/dashboard/executive-roi/page.tsx'),
      'utf8'
    );

    expect(page).not.toContain('Math.random');
    expect(page).not.toContain('SIMULATED');
    expect(page).not.toContain('calculated projection');
    expect(page).toContain('Portfolio ROI');
    expect(page).toContain('getPortfolioRoi');
    expect(page).toContain('getIdToken');
  });

  test('Portfolio ROI does not average retailer ROI percentages', () => {
    const page = readFileSync(
      join(root, 'src/app/dashboard/executive-roi/page.tsx'),
      'utf8'
    );

    expect(page).toContain('Portfolio ROI %');
    expect(page).toContain('Not aggregated');
    expect(page).toContain('are not averaged');
  });
});
