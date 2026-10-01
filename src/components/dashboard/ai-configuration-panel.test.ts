import fs from 'fs';
import path from 'path';

describe('Ari Experience retailer control plane', () => {
  const source = fs.readFileSync(
    path.join(
      process.cwd(),
      'src/components/dashboard/ai-configuration-panel.tsx'
    ),
    'utf8'
  );

  it('exposes the canonical retailer Ari configuration controls', () => {
    const canonicalFields = [
      'assistantName',
      'personality',
      'tone',
      'brandVoice',
      'welcomeMessage',
      'recommendationCount',
      'includePrice',
      'showAvailability',
    ];

    for (const field of canonicalFields) {
      expect(source).toContain(field);
    }
  });

  it('does not expose obsolete prototype configuration fields', () => {
    const obsoleteFields = [
      'customPersonality',
      'recommendationStrategy',
      'recommendationTrigger',
      'faqCategories',
      'enableHandoff',
      'ecommercePlatform',
    ];

    for (const field of obsoleteFields) {
      expect(source).not.toContain(field);
    }
  });

  it('keeps language fixed to English rather than retailer-configurable', () => {
    expect(source).toContain('English is the supported Ari language for v1.');
    expect(source).not.toContain("register('language')");
    expect(source).not.toContain('name="language"');
  });

  it('uses authoritative Ari configuration read and write flows', () => {
    expect(source).toContain('getAiConfig({');
    expect(source).toContain('saveAiConfig({');
    expect(source).toContain('idToken');
    expect(source).toContain('retailerId');
  });

  it('does not retain the fabricated preview or sample-data sandbox', () => {
    const prohibitedPrototypeContent = [
      'LivePreviewPanel',
      'AI Sandbox',
      'sampleProducts',
      'sampleConversation',
      'sampleRecommendations',
      'sampleOffer',
      'setTimeout',
    ];

    for (const value of prohibitedPrototypeContent) {
      expect(source).not.toContain(value);
    }
  });

  it('states the governance and evidence boundary', () => {
    expect(source).toContain(
      'These preferences cannot override mandatory'
    );
    expect(source).toContain(
      'These settings do not create product'
    );
    expect(source).toContain(
      'Activation-specific Ari context is managed separately'
    );
  });
});
