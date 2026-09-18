import type { SponsoredMediaEvent } from './schemas/sponsored-media-event';

export type RetailMediaMetrics = {
  eligible: number;
  impressions: number;
  deliveryRate: number | null;
  videoStarts: number;
  videoCompletions: number;
  completionRate: number | null;
  dismissals: number;
  dismissalRate: number | null;
  replays: number;
  replayedPresentations: number;
  replayRate: number | null;
  clicks: number;
  ctr: number | null;
};

function rate(
  numerator: number,
  denominator: number
): number | null {
  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

/**
 * Pure canonical Retail Media aggregation kernel.
 *
 * IMPORTANT:
 * - Input events must already be authorized/scoped by the server query layer.
 * - This function performs no authentication or Firestore I/O.
 * - Replay playback never inflates initial video start/completion metrics.
 * - A missing denominator is reported as null (N/A), never synthetic zero.
 * - Commerce, revenue, turnover, margin and ROI are deliberately excluded.
 */
export function aggregateRetailMediaMetrics(
  events: readonly SponsoredMediaEvent[]
): RetailMediaMetrics {
  const eligible = events.filter(
    event => event.eventType === 'ELIGIBLE'
  ).length;

  const impressions = events.filter(
    event => event.eventType === 'IMPRESSION'
  ).length;

  const videoStarts = events.filter(
    event =>
      event.eventType === 'STARTED' &&
      event.playbackOrdinal === 1
  ).length;

  const videoCompletions = events.filter(
    event =>
      event.eventType === 'COMPLETED' &&
      event.playbackOrdinal === 1
  ).length;

  const dismissals = events.filter(
    event => event.eventType === 'DISMISSED'
  ).length;

  const replayEvents = events.filter(
    event => event.eventType === 'REPLAYED'
  );

  const replays = replayEvents.length;

  const replayedPresentations = new Set(
    replayEvents.map(event => event.presentationId)
  ).size;

  const initiallyCompletedPresentations = new Set(
    events
      .filter(
        event =>
          event.eventType === 'COMPLETED' &&
          event.playbackOrdinal === 1
      )
      .map(event => event.presentationId)
  ).size;

  const clicks = events.filter(
    event => event.eventType === 'CLICKED'
  ).length;

  return {
    eligible,
    impressions,
    deliveryRate: rate(impressions, eligible),
    videoStarts,
    videoCompletions,
    completionRate: rate(videoCompletions, videoStarts),
    dismissals,
    dismissalRate: rate(dismissals, impressions),
    replays,
    replayedPresentations,
    replayRate: rate(
      replayedPresentations,
      initiallyCompletedPresentations
    ),
    clicks,
    ctr: rate(clicks, impressions),
  };
}
