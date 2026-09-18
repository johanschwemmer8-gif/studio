import { GetScanInteractionOutputSchema } from './scan-interaction';

const baseResponse = {
  messages: ['Hello! Ari here.'],
  destinationUrl: 'https://interactaoe.co.za',
};

describe('GetScanInteractionOutputSchema sponsored media', () => {
  it('accepts a response with no sponsored media', () => {
    const result = GetScanInteractionOutputSchema.parse(baseResponse);

    expect(result.sponsoredMedia).toBeUndefined();
  });

  it('accepts canonical VIDEO sponsored media', () => {
    const result = GetScanInteractionOutputSchema.parse({
      ...baseResponse,
      sponsoredMedia: {
        format: 'VIDEO',
        sponsorName: 'Sunlight',
        mediaUrl: 'https://example.com/sunlight-video.mp4',
        headline: 'Tough on grease',
        destinationUrl: 'https://example.com/sunlight',
      },
    });

    expect(result.sponsoredMedia?.format).toBe('VIDEO');
    expect(result.sponsoredMedia?.sponsorName).toBe('Sunlight');
  });

  it('accepts canonical BRAND_STRIP sponsored media', () => {
    const result = GetScanInteractionOutputSchema.parse({
      ...baseResponse,
      sponsoredMedia: {
        format: 'BRAND_STRIP',
        sponsorName: 'Sunlight',
        mediaUrl: 'https://example.com/sunlight-strip.png',
      },
    });

    expect(result.sponsoredMedia?.format).toBe('BRAND_STRIP');
  });

  it('rejects malformed sponsored media', () => {
    expect(() =>
      GetScanInteractionOutputSchema.parse({
        ...baseResponse,
        sponsoredMedia: {
          format: 'VIDEO',
          sponsorName: '',
          mediaUrl: 'not-a-url',
        },
      })
    ).toThrow();
  });

  it('continues to accept legacy/general media fields', () => {
    const result = GetScanInteractionOutputSchema.parse({
      ...baseResponse,
      mediaType: 'video',
      mediaUrl: 'https://example.com/legacy-video.mp4',
      headline: 'Legacy headline',
      subhead: 'Legacy subhead',
    });

    expect(result.mediaType).toBe('video');
    expect(result.sponsoredMedia).toBeUndefined();
  });
});
