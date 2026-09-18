import {
  SponsoredMediaEventSchema,
  SponsoredMediaEventTypeSchema,
} from './sponsored-media-event';

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

const baseEvent = {
  eventId: 'event_1',
  presentationId: 'presentation_1',

  retailerId: 'retailer_1',
  campaignId: 'campaign_1',
  activationId: 'activation_1',
  deploymentId: 'deployment_1',
  qrCodeId: 'qr_1',

  partnerId: 'partner_nike',
  creativeId: 'creative_nike_video_1',

  format: 'VIDEO' as const,

  configurationVersion: 1,
  environment: 'PRODUCTION' as const,

  timestamp,
};

describe('SponsoredMediaEventTypeSchema', () => {
  it.each([
    'ELIGIBLE',
    'IMPRESSION',
    'STARTED',
    'COMPLETED',
    'DISMISSED',
    'REPLAYED',
    'CLICKED',
  ])('accepts canonical event type %s', (eventType) => {
    expect(SponsoredMediaEventTypeSchema.parse(eventType)).toBe(eventType);
  });

  it('rejects non-canonical conversion events', () => {
    expect(() =>
      SponsoredMediaEventTypeSchema.parse('PURCHASED')
    ).toThrow();
  });
});

describe('SponsoredMediaEventSchema', () => {
  it('accepts a canonical presentation-level event without a Shopper Session', () => {
    const result = SponsoredMediaEventSchema.parse({
      ...baseEvent,
      eventType: 'IMPRESSION',
    });

    expect(result.eventType).toBe('IMPRESSION');
    expect('sessionId' in result).toBe(false);
  });

  it('accepts a canonical playback event with a positive playback ordinal', () => {
    const result = SponsoredMediaEventSchema.parse({
      ...baseEvent,
      eventType: 'STARTED',
      playbackOrdinal: 1,
    });

    expect(result.playbackOrdinal).toBe(1);
  });

  it('accepts Brand Strip measurement without playback identity', () => {
    const result = SponsoredMediaEventSchema.parse({
      ...baseEvent,
      eventType: 'CLICKED',
      format: 'BRAND_STRIP',
    });

    expect(result.format).toBe('BRAND_STRIP');
    expect(result.playbackOrdinal).toBeUndefined();
  });

  it('rejects a missing presentation identity', () => {
    const { presentationId, ...withoutPresentationId } = baseEvent;

    expect(() =>
      SponsoredMediaEventSchema.parse({
        ...withoutPresentationId,
        eventType: 'IMPRESSION',
      })
    ).toThrow();
  });

  it('rejects a missing Partner identity', () => {
    const { partnerId, ...withoutPartnerId } = baseEvent;

    expect(() =>
      SponsoredMediaEventSchema.parse({
        ...withoutPartnerId,
        eventType: 'IMPRESSION',
      })
    ).toThrow();
  });

  it('rejects a missing Creative identity', () => {
    const { creativeId, ...withoutCreativeId } = baseEvent;

    expect(() =>
      SponsoredMediaEventSchema.parse({
        ...withoutCreativeId,
        eventType: 'IMPRESSION',
      })
    ).toThrow();
  });

  it('rejects zero playback ordinal', () => {
    expect(() =>
      SponsoredMediaEventSchema.parse({
        ...baseEvent,
        eventType: 'STARTED',
        playbackOrdinal: 0,
      })
    ).toThrow();
  });

  it('strips non-canonical shopper and financial fields', () => {
    const result = SponsoredMediaEventSchema.parse({
      ...baseEvent,
      eventType: 'IMPRESSION',

      sessionId: 'session_1',
      shopperId: 'shopper_1',
      uid: 'user_1',
      revenue: 999,
      turnover: 999,
      margin: 100,
      conversion: true,
      roi: 4.5,
    });

    expect(result).not.toHaveProperty('sessionId');
    expect(result).not.toHaveProperty('shopperId');
    expect(result).not.toHaveProperty('uid');
    expect(result).not.toHaveProperty('revenue');
    expect(result).not.toHaveProperty('turnover');
    expect(result).not.toHaveProperty('margin');
    expect(result).not.toHaveProperty('conversion');
    expect(result).not.toHaveProperty('roi');
  });

  it('rejects invalid configuration version', () => {
    expect(() =>
      SponsoredMediaEventSchema.parse({
        ...baseEvent,
        eventType: 'ELIGIBLE',
        configurationVersion: 0,
      })
    ).toThrow();
  });
});
