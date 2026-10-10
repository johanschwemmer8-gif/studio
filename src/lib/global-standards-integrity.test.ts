import fs from 'fs';
import path from 'path';

describe('Global Standards architecture integrity', () => {
  const pagePath = path.join(
    process.cwd(),
    'src/app/dashboard/gs1-conformance/page.tsx'
  );

  const resolverPath = path.join(
    process.cwd(),
    'src/app/resolve/[id]/route.ts'
  );

  const page = fs.readFileSync(pagePath, 'utf8');
  const resolver = fs.readFileSync(resolverPath, 'utf8');

  // JSX formatting may split rendered prose across source lines.
  // Normalise whitespace so these tests protect architectural meaning
  // rather than Prettier/TSX line wrapping.
  const normalizedPage = page.replace(/\s+/g, ' ').trim();
  const normalizedResolver = resolver.replace(/\s+/g, ' ').trim();

  test('preserves canonical identity-domain separation', () => {
    expect(normalizedPage).toContain('GS1 identifies the product.');
    expect(normalizedPage).toContain(
      'Campaign → Activation → Deployment → QR'
    );
    expect(normalizedPage).toContain(
      'GTIN provides product identity and context'
    );
    expect(normalizedPage).toContain(
      'it does not replace Activation, Deployment, QR or Session identity'
    );
  });

  test('represents scan as exposure rather than automatic session creation', () => {
    expect(normalizedPage).toContain(
      'It does not itself create a shopper session.'
    );
    expect(normalizedPage).toContain(
      'Treat successful QR resolution as an exposure event'
    );

    expect(normalizedResolver).toContain(
      'Resolving/scanning a QR is an exposure event.'
    );
    expect(normalizedResolver).toContain(
      'It does NOT itself create a'
    );
  });

  test('preserves the production QR identity authority', () => {
    expect(normalizedResolver).toContain(
      'Campaign -> Activation -> Deployment -> QR'
    );

    expect(normalizedPage).toContain(
      'Campaign → Activation → Deployment → QR'
    );
  });

  test('does not restore obsolete GS1-wide identity claims', () => {
    expect(normalizedPage).not.toContain(
      'All cross-layer handshakes use GS1 standards'
    );
    expect(normalizedPage).not.toContain('PLATFORM AUDIT READY');
    expect(normalizedPage).not.toContain('Official proof');
    expect(normalizedPage).not.toContain('Session Initialization');
    expect(normalizedPage).not.toContain(
      'Redirects to Experience Layer (/p/{gtin})'
    );
  });

  test('does not claim independent GS1 certification', () => {
    expect(normalizedPage).toContain(
      'It does not represent independent GS1 certification.'
    );
    expect(normalizedPage).toContain(
      'External certification status must only be asserted'
    );
  });

  test('retains the real GS1 validator', () => {
    expect(page).toContain(
      "import Gs1TestSuite from '@/components/dashboard/gs1-test-suite'"
    );
    expect(page).toContain('<Gs1TestSuite />');
  });
});
