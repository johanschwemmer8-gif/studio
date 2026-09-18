import {
  ActivationExperienceConfigSchema,
  ActivationSponsoredMediaSchema,
} from './activation';

describe('ActivationSponsoredMediaSchema', () => {
  it('accepts valid VIDEO sponsored media', () => {
    const result = ActivationSponsoredMediaSchema.parse({
      format: 'VIDEO',
      sponsorName: 'Sunlight',
      mediaUrl: 'https://example.com/sunlight-video.mp4',
      headline: 'Tough on grease',
      destinationUrl: 'https://example.com/sunlight',
    });

    expect(result.format).toBe('VIDEO');
    expect(result.sponsorName).toBe('Sunlight');
  });

  it('accepts valid BRAND_STRIP sponsored media', () => {
    const result = ActivationSponsoredMediaSchema.parse({
      format: 'BRAND_STRIP',
      sponsorName: 'Sunlight',
      mediaUrl: 'https://example.com/sunlight-strip.png',
    });

    expect(result.format).toBe('BRAND_STRIP');
  });

  it('rejects an unsupported sponsored-media format', () => {
    expect(() =>
      ActivationSponsoredMediaSchema.parse({
        format: 'FULL_SCREEN',
        sponsorName: 'Sunlight',
        mediaUrl: 'https://example.com/creative.png',
      })
    ).toThrow();
  });

  it('rejects a blank sponsor name', () => {
    expect(() =>
      ActivationSponsoredMediaSchema.parse({
        format: 'VIDEO',
        sponsorName: '   ',
        mediaUrl: 'https://example.com/video.mp4',
      })
    ).toThrow();
  });

  it('rejects an invalid media URL', () => {
    expect(() =>
      ActivationSponsoredMediaSchema.parse({
        format: 'VIDEO',
        sponsorName: 'Sunlight',
        mediaUrl: 'not-a-url',
      })
    ).toThrow();
  });

  it('rejects an invalid destination URL', () => {
    expect(() =>
      ActivationSponsoredMediaSchema.parse({
        format: 'BRAND_STRIP',
        sponsorName: 'Sunlight',
        mediaUrl: 'https://example.com/strip.png',
        destinationUrl: 'not-a-url',
      })
    ).toThrow();
  });
});

describe('ActivationExperienceConfigSchema sponsored-media compatibility', () => {
  it('accepts an experience with no sponsored media', () => {
    const result = ActivationExperienceConfigSchema.parse({
      persona: 'Helpful product expert',
      scanDestination: 'AI',
    });

    expect(result.sponsoredMedia).toBeUndefined();
  });

  it('accepts sponsored media inside the canonical experience config', () => {
    const result = ActivationExperienceConfigSchema.parse({
      persona: 'Helpful product expert',
      scanDestination: 'AI',
      sponsoredMedia: {
        format: 'VIDEO',
        sponsorName: 'Sunlight',
        mediaUrl: 'https://example.com/video.mp4',
      },
    });

    expect(result.sponsoredMedia?.format).toBe('VIDEO');
  });

  it('continues to accept the legacy/general media fields', () => {
    const result = ActivationExperienceConfigSchema.parse({
      scanDestination: 'AI',
      mediaType: 'video',
      mediaUrl: 'https://example.com/legacy-video.mp4',
      headline: 'Legacy headline',
      subhead: 'Legacy subhead',
    });

    expect(result.mediaType).toBe('video');
    expect(result.mediaUrl).toBe(
      'https://example.com/legacy-video.mp4'
    );
  });
});

describe('ActivationSponsoredMediaSchema Retail Media identity', () => {
  it('continues to accept legacy sponsored media without Partner or Creative identity', () => {
    const result = ActivationSponsoredMediaSchema.parse({
      format: 'VIDEO',
      sponsorName: 'Sunlight',
      mediaUrl: 'https://example.com/sunlight-video.mp4',
    });

    expect(result.partnerId).toBeUndefined();
    expect(result.creativeId).toBeUndefined();
  });

  it('accepts canonical sponsored media with Partner and Creative identity', () => {
    const result = ActivationSponsoredMediaSchema.parse({
      partnerId: 'partner_nike',
      creativeId: 'creative_nike_video_1',
      format: 'VIDEO',
      sponsorName: 'Nike',
      mediaUrl: 'https://example.com/nike-video.mp4',
    });

    expect(result.partnerId).toBe('partner_nike');
    expect(result.creativeId).toBe('creative_nike_video_1');
  });

  it('rejects Partner identity without Creative identity', () => {
    expect(() =>
      ActivationSponsoredMediaSchema.parse({
        partnerId: 'partner_nike',
        format: 'VIDEO',
        sponsorName: 'Nike',
        mediaUrl: 'https://example.com/nike-video.mp4',
      })
    ).toThrow();
  });

  it('rejects Creative identity without Partner identity', () => {
    expect(() =>
      ActivationSponsoredMediaSchema.parse({
        creativeId: 'creative_nike_video_1',
        format: 'VIDEO',
        sponsorName: 'Nike',
        mediaUrl: 'https://example.com/nike-video.mp4',
      })
    ).toThrow();
  });

  it('rejects blank canonical Retail Media identities', () => {
    expect(() =>
      ActivationSponsoredMediaSchema.parse({
        partnerId: '   ',
        creativeId: '   ',
        format: 'VIDEO',
        sponsorName: 'Nike',
        mediaUrl: 'https://example.com/nike-video.mp4',
      })
    ).toThrow();
  });
});
