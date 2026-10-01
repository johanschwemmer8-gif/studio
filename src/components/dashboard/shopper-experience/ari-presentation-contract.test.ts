import fs from 'fs';
import path from 'path';

describe('canonical shopper Ari presentation contract', () => {
  const templateRoot = path.join(
    process.cwd(),
    'src/components/dashboard/shopper-experience/templates'
  );

  const templates = [
    'ari-signature.tsx',
    'product-spotlight.tsx',
    'conversation-first.tsx',
    'compare-and-decide.tsx',
    'visual-discovery.tsx',
    'expert-advisor.tsx',
    'quick-assist.tsx',
    'brand-immersive.tsx',
    'retail-media-premium.tsx',
  ];

  it('propagates ariPresentation through all nine canonical templates', () => {
    for (const template of templates) {
      const source = fs.readFileSync(
        path.join(templateRoot, template),
        'utf8'
      );

      expect(source).toContain('ariPresentation,');
      expect(source).toContain(
        'ariPresentation={ariPresentation}'
      );
    }
  });

  it('uses configurable identity in the shared conversation surface', () => {
    const source = fs.readFileSync(
      path.join(templateRoot, 'ari-signature-conversation.tsx'),
      'utf8'
    );

    expect(source).toContain(
      'ariPresentation?.assistantName?.trim() || "Ari"'
    );
    expect(source).toContain(
      'ariPresentation?.welcomeMessage?.trim()'
    );
    expect(source).toContain('{assistantName}');
    expect(source).toContain('{starterPrompt}');
  });

  it('uses configurable identity in the canonical greeting surfaces', () => {
    for (const template of [
      'ari-signature.tsx',
      'conversation-first.tsx',
    ]) {
      const source = fs.readFileSync(
        path.join(templateRoot, template),
        'utf8'
      );

      expect(source).toContain(
        'ariPresentation?.assistantName?.trim()'
      );
      expect(source).toContain(
        'ariPresentation?.welcomeMessage?.trim()'
      );
      expect(source).toContain(
        '{assistantName} · Shopping Assistant'
      );
      expect(source).toContain('{welcomeMessage}');
    }
  });
});
