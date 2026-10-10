import fs from 'fs';
import path from 'path';

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(
    path.join(root, relativePath),
    'utf8'
  );
}

describe('Admin AI Rules architecture integrity', () => {
  const aiRules = read(
    'src/app/dashboard/ai-policy/page.tsx'
  );

  const admin = read(
    'src/app/dashboard/admin/page.tsx'
  );

  const manager = read(
    'src/components/dashboard/platform-ai-governance-manager.tsx'
  );

  it('makes AI Rules the canonical Platform Governance administration surface', () => {
    expect(aiRules).toContain(
      'PlatformAiGovernanceManager'
    );

    expect(aiRules).toContain(
      '<PlatformAiGovernanceManager />'
    );

    expect(admin).not.toContain(
      'PlatformAiGovernanceManager'
    );
  });

  it('preserves the real Platform Governance lifecycle manager', () => {
    expect(manager).toContain(
      'initializePlatformAiGovernanceV1'
    );

    expect(manager).toContain(
      'approvePlatformAiGovernanceV1'
    );

    expect(manager).toContain(
      'activatePlatformAiGovernanceV1'
    );
  });

  it('states the canonical governance authority chain', () => {
    expect(aiRules).toContain(
      'Platform AI Governance → Active Governance Authority'
    );

    expect(aiRules).toContain(
      'Retailer Additive Governance'
    );

    expect(aiRules).toContain(
      'Governed AI'
    );

    expect(aiRules).toContain(
      'Capability Resolution'
    );

    expect(aiRules).toMatch(
      /Governance\s+Provenance/
    );
  });

  it('does not claim policy activation proves control effectiveness', () => {
    expect(aiRules).toContain(
      'does not, by itself, prove'
    );

    expect(aiRules).toContain('DEFINED');
    expect(aiRules).toContain('IMPLEMENTED');
    expect(aiRules).toContain('VERIFIED');
    expect(aiRules).toContain('MONITORED');
  });

  it('removes fabricated bias and browser-only governance controls', () => {
    const forbidden = [
      'globalAiPrompt',
      'localStorage',
      'affluent',
      'township',
      'Bias Alert',
      'Maximum acceptable variance',
      'Automated bias report generation',
      'internal AI ethics team',
      'Ethics committee',
      'ethics committee',
      'Data Retention Period (Days)',
      'Configuration for this section coming soon',
    ];

    for (const value of forbidden) {
      expect(aiRules).not.toContain(value);
    }
  });

  it('does not recreate unsupported governance configuration widgets', () => {
    expect(aiRules).not.toContain('<Switch');
    expect(aiRules).not.toContain('<Checkbox');
    expect(aiRules).not.toContain('<Textarea');
    expect(aiRules).not.toContain(
      'The global AI instruction prompt has been updated.'
    );
  });

  it('preserves the distinction between governance and unsupported assurance claims', () => {
    expect(aiRules).toContain(
      'Production fairness or bias findings.'
    );

    expect(aiRules).toContain(
      'Continuous AI health or performance monitoring.'
    );

    expect(aiRules).toContain(
      'Independent audit or certification status.'
    );

    expect(aiRules).toContain(
      'Not asserted without evidence'
    );
  });
});
