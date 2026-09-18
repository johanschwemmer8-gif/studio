import {
  aggregateRetailMediaMetrics,
} from './retail-media-reporting';
import type {
  SponsoredMediaEvent,
  SponsoredMediaEventType,
} from './schemas/sponsored-media-event';

const timestamp = {
  seconds: 1,
  nanoseconds: 0,
};

function event(
  eventType: SponsoredMediaEventType,
  overrides: Partial<SponsoredMediaEvent> = {}
): SponsoredMediaEvent {
  return {
    eventId: `event_${eventType}`,
    presentationId: 'presentation_1',
    eventType,
    retailerId: 'retailer_a',
    campaignId: 'campaign_1',
    activationId: 'activation_1',
    deploymentId: 'deployment_1',
    qrCodeId: 'qr_1',
    partnerId: 'partner_nike',
    creativeId: 'creative_nike',
    format: 'VIDEO',
    configurationVersion: 1,
    environment: 'PRODUCTION',
    timestamp,
    ...overrides,
  };
}

describe('aggregateRetailMediaMetrics', () => {
  it('returns factual zero counts and N/A rates for no events', () => {
    expect(aggregateRetailMediaMetrics([])).toEqual({
      eligible: 0,
      impressions: 0,
      deliveryRate: null,
      videoStarts: 0,
      videoCompletions: 0,
      completionRate: null,
      dismissals: 0,
      dismissalRate: null,
      replays: 0,
      replayedPresentations: 0,
      replayRate: null,
      clicks: 0,
      ctr: null,
    });
  });

  it('calculates canonical sponsored media metrics', () => {
    const events = [
      event('ELIGIBLE', { eventId: 'eligible_1' }),
      event('ELIGIBLE', {
        eventId: 'eligible_2',
        presentationId: 'presentation_2',
      }),
      event('IMPRESSION', { eventId: 'impression_1' }),
      event('STARTED', {
        eventId: 'started_1',
        playbackOrdinal: 1,
      }),
      event('COMPLETED', {
        eventId: 'completed_1',
        playbackOrdinal: 1,
      }),
      event('DISMISSED', { eventId: 'dismissed_1' }),
      event('CLICKED', { eventId: 'clicked_1' }),
    ];

    expect(aggregateRetailMediaMetrics(events)).toEqual({
      eligible: 2,
      impressions: 1,
      deliveryRate: 0.5,
      videoStarts: 1,
      videoCompletions: 1,
      completionRate: 1,
      dismissals: 1,
      dismissalRate: 1,
      replays: 0,
      replayedPresentations: 0,
      replayRate: 0,
      clicks: 1,
      ctr: 1,
    });
  });

  it('does not let replay playback inflate initial start or completion rates', () => {
    const events = [
      event('ELIGIBLE'),
      event('IMPRESSION'),
      event('STARTED', {
        eventId: 'started_initial',
        playbackOrdinal: 1,
      }),
      event('COMPLETED', {
        eventId: 'completed_initial',
        playbackOrdinal: 1,
      }),
      event('REPLAYED', {
        eventId: 'replayed_2',
        playbackOrdinal: 2,
      }),
      event('STARTED', {
        eventId: 'started_2',
        playbackOrdinal: 2,
      }),
      event('COMPLETED', {
        eventId: 'completed_2',
        playbackOrdinal: 2,
      }),
    ];

    const result = aggregateRetailMediaMetrics(events);

    expect(result.videoStarts).toBe(1);
    expect(result.videoCompletions).toBe(1);
    expect(result.completionRate).toBe(1);
    expect(result.replays).toBe(1);
    expect(result.replayedPresentations).toBe(1);
    expect(result.replayRate).toBe(1);
  });

  it('counts replay actions separately from replayed presentations', () => {
    const events = [
      event('ELIGIBLE'),
      event('IMPRESSION'),
      event('STARTED', {
        eventId: 'started_initial',
        playbackOrdinal: 1,
      }),
      event('COMPLETED', {
        eventId: 'completed_initial',
        playbackOrdinal: 1,
      }),
      event('REPLAYED', {
        eventId: 'replayed_2',
        playbackOrdinal: 2,
      }),
      event('STARTED', {
        eventId: 'started_2',
        playbackOrdinal: 2,
      }),
      event('COMPLETED', {
        eventId: 'completed_2',
        playbackOrdinal: 2,
      }),
      event('REPLAYED', {
        eventId: 'replayed_3',
        playbackOrdinal: 3,
      }),
      event('STARTED', {
        eventId: 'started_3',
        playbackOrdinal: 3,
      }),
      event('COMPLETED', {
        eventId: 'completed_3',
        playbackOrdinal: 3,
      }),
    ];

    const result = aggregateRetailMediaMetrics(events);

    expect(result.replays).toBe(2);
    expect(result.replayedPresentations).toBe(1);
    expect(result.replayRate).toBe(1);
  });

  it('reports video metrics as N/A when no video playback exists', () => {
    const events = [
      event('ELIGIBLE', { format: 'BRAND_STRIP' }),
      event('IMPRESSION', { format: 'BRAND_STRIP' }),
      event('CLICKED', { format: 'BRAND_STRIP' }),
    ];

    const result = aggregateRetailMediaMetrics(events);

    expect(result.videoStarts).toBe(0);
    expect(result.videoCompletions).toBe(0);
    expect(result.completionRate).toBeNull();
    expect(result.replays).toBe(0);
    expect(result.replayedPresentations).toBe(0);
    expect(result.replayRate).toBeNull();
    expect(result.ctr).toBe(1);
  });

  it('does not manufacture commerce or financial metrics', () => {
    const result = aggregateRetailMediaMetrics([
      event('ELIGIBLE'),
      event('IMPRESSION'),
    ]);

    expect(result).not.toHaveProperty('revenue');
    expect(result).not.toHaveProperty('turnover');
    expect(result).not.toHaveProperty('conversions');
    expect(result).not.toHaveProperty('margin');
    expect(result).not.toHaveProperty('roi');
  });
});
