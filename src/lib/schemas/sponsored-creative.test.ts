import { SponsoredCreativeSchema } from './sponsored-creative';

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

describe('SponsoredCreativeSchema', () => {
  it('accepts a valid VIDEO creative', () => {
    const result = SponsoredCreativeSchema.parse({
      creativeId: 'creative_nike_video_1',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
      format: 'VIDEO',
      mediaUrl: 'https://example.com/nike-video.mp4',
      headline: 'Run your way',
      destinationUrl: 'https://example.com/nike',
      status: 'ACTIVE',
      createdAt: timestamp,
      createdBy: 'user_1',
      updatedAt: timestamp,
      updatedBy: 'user_1',
    });

    expect(result.creativeId).toBe('creative_nike_video_1');
    expect(result.partnerId).toBe('partner_nike');
    expect(result.format).toBe('VIDEO');
  });

  it('accepts a valid BRAND_STRIP creative', () => {
    const result = SponsoredCreativeSchema.parse({
      creativeId: 'creative_nike_strip_1',
      retailerId: 'retailer_a',
      partnerId: 'partner_nike',
      format: 'BRAND_STRIP',
      mediaUrl: 'https://example.com/nike-strip.png',
      status: 'DRAFT',
      createdAt: timestamp,
      createdBy: 'user_1',
      updatedAt: timestamp,
      updatedBy: 'user_1',
    });

    expect(result.format).toBe('BRAND_STRIP');
  });

  it('rejects an unsupported creative format', () => {
    expect(() =>
      SponsoredCreativeSchema.parse({
        creativeId: 'creative_1',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        format: 'FULL_SCREEN',
        mediaUrl: 'https://example.com/creative.png',
        status: 'ACTIVE',
        createdAt: timestamp,
        createdBy: 'user_1',
        updatedAt: timestamp,
        updatedBy: 'user_1',
      })
    ).toThrow();
  });

  it('rejects a creative without a Partner identity', () => {
    expect(() =>
      SponsoredCreativeSchema.parse({
        creativeId: 'creative_1',
        retailerId: 'retailer_a',
        partnerId: '   ',
        format: 'VIDEO',
        mediaUrl: 'https://example.com/video.mp4',
        status: 'ACTIVE',
        createdAt: timestamp,
        createdBy: 'user_1',
        updatedAt: timestamp,
        updatedBy: 'user_1',
      })
    ).toThrow();
  });

  it('rejects an invalid media URL', () => {
    expect(() =>
      SponsoredCreativeSchema.parse({
        creativeId: 'creative_1',
        retailerId: 'retailer_a',
        partnerId: 'partner_nike',
        format: 'VIDEO',
        mediaUrl: 'not-a-url',
        status: 'ACTIVE',
        createdAt: timestamp,
        createdBy: 'user_1',
        updatedAt: timestamp,
        updatedBy: 'user_1',
      })
    ).toThrow();
  });
});
