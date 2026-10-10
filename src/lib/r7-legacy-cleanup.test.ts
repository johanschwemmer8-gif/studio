import fs from 'fs';

function read(path: string) {
  return fs.readFileSync(path, 'utf8');
}

describe('R7 legacy cleanup contract', () => {
  test('obsolete sponsored-product browser implementation remains removed', () => {
    expect(
      fs.existsSync('src/components/product/sponsored-product.tsx')
    ).toBe(false);

    const productPage = read('src/app/p/[gtin]/page.tsx');

    expect(productPage).not.toContain('SponsoredProduct');
  });

  test('obsolete ad click and purchase conversion flows remain removed', () => {
    expect(fs.existsSync('src/ai/flows/log-ad-click.ts')).toBe(false);
    expect(
      fs.existsSync('src/ai/flows/log-purchase-conversion.ts')
    ).toBe(false);

    const index = read('src/ai/flows/index.ts');
    const dev = read('src/ai/dev.ts');

    expect(index).not.toContain('logAdClick');
    expect(index).not.toContain('logPurchaseConversion');
    expect(dev).not.toContain('log-ad-click');
    expect(dev).not.toContain('log-purchase-conversion');
  });

  test('shopper profile does not write legacy product_interactions', () => {
    const source = read(
      'src/components/shopper/shopper-profile-cta.tsx'
    );

    expect(source).not.toContain("'product_interactions'");
    expect(source).not.toContain('"product_interactions"');
  });

  test('historical product_interactions reads are not deleted by this cleanup', () => {
    const source = read('src/ai/flows/get-scan-interaction.ts');

    expect(source).toContain("collection('product_interactions')");
  });

  test('integration configuration does not claim that configuration equals production connectivity', () => {
    const admin = read(
      'src/app/dashboard/core-integration/page.tsx'
    );
    const retailer = read(
      'src/app/retailer-mvp/system-integration/page.tsx'
    );

    expect(admin).toContain('Integration Configuration');
    expect(admin).toContain(
      'does not by itself indicate that a production integration is active'
    );
    expect(retailer).toContain(
      'does not by itself indicate that a production integration is active'
    );
  });

  test('intentional migration bridges remain present', () => {
    expect(
      fs.existsSync('src/app/dashboard/user-admin/page.tsx')
    ).toBe(true);

    expect(
      fs.existsSync('src/app/product/[id]/page.tsx')
    ).toBe(true);

    expect(
      fs.existsSync('src/app/track/[qrCodeId]/route.ts')
    ).toBe(true);
  });
});
