import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import QrScanInteraction from './qr-scan-interaction';
import {
  beginQrShopperSession,
  getScanInteraction,
  productChat,
} from '@/ai/flows';
import { recordSponsoredMediaEvent } from '@/lib/sponsored-media-event-server';

jest.mock('@/ai/flows', () => ({
  beginQrShopperSession: jest.fn(),
  getScanInteraction: jest.fn(),
  productChat: jest.fn(),
}));

jest.mock('@/lib/sponsored-media-event-server', () => ({
  recordSponsoredMediaEvent: jest.fn(),
}));

jest.mock('@/components/dashboard/shopper-experience/shopper-experience-renderer', () => ({
  ShopperExperienceRenderer: (props: any) => (
    <div
      data-testid="canonical-shopper-renderer"
      data-template-id={props.templateId}
      data-mode={props.mode}
      data-retailer-id={props.retailerId ?? ''}
      data-activation-id={props.activationId ?? ''}
      data-session-id={props.sessionId ?? ''}
      data-logo-url={props.branding?.logoUrl ?? ''}
      data-header-background={props.branding?.headerBackgroundColor ?? ''}
      data-ari-image-url={props.ariImageUrl ?? ''}
    >
      <button
        type="button"
        onClick={() =>
          props.onSubmitConversationMessage?.(
            'Which option suits my needs?',
            []
          )
        }
      >
        Test canonical conversation
      </button>
    </div>
  ),
}));

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

const mockGetScanInteraction =
  getScanInteraction as jest.MockedFunction<typeof getScanInteraction>;

const mockBeginQrShopperSession =
  beginQrShopperSession as jest.MockedFunction<typeof beginQrShopperSession>;

const mockProductChat =
  productChat as jest.MockedFunction<typeof productChat>;

const mockRecordSponsoredMediaEvent =
  recordSponsoredMediaEvent as jest.MockedFunction<typeof recordSponsoredMediaEvent>;

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;

class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
  root = null;
  rootMargin = '0px';
  thresholds = [0.5];

  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

const canonicalResult = {
  retailerId: 'retailer-a',
  activationId: 'activation-a',
  gtin: '06001234567890',
  retailerName: 'Retailer A',
  destinationUrl: 'https://interactaoe.co.za',
  messages: [],
  shopperPresentation: {
    selectedTemplate: 'template8' as const,
    branding: {
      logoUrl: 'https://example.com/retailer-logo.png',
      logoWidth: 128,
      logoMaxHeight: 32,
      logoAlign: 'center' as const,
      logoPadding: 0,
      headerBackgroundColor: '#07162f',
    },
    ariPresentation: {
      assistantName: 'Ari',
      welcomeMessage: 'How can I help you today?',
    },
  },
  sponsoredMedia: {
    format: 'BRAND_STRIP' as const,
    sponsorName: 'Nike',
    mediaUrl: 'https://example.com/nike.jpg',
    headline: 'Nike',
    destinationUrl: 'https://example.com/nike',
    presentationId: 'smp_test_presentation',
  },
};

const legacyResult = {
  ...canonicalResult,
  sponsoredMedia: {
    format: 'BRAND_STRIP' as const,
    sponsorName: 'Nike',
    mediaUrl: 'https://example.com/nike.jpg',
    headline: 'Nike',
    destinationUrl: 'https://example.com/nike',
  },
};

function makeIntersectionEntry(
  isIntersecting: boolean,
  intersectionRatio: number
): IntersectionObserverEntry {
  return {
    isIntersecting,
    intersectionRatio,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    target: document.body,
    time: 0,
  };
}

describe('QrScanInteraction canonical live shopper experience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    observerCallback = null;
  });

  it('renders authoritative shopper presentation without creating a session on scan', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    render(<QrScanInteraction qrId="qr-test" />);

    const renderer = await screen.findByTestId('canonical-shopper-renderer');

    expect(renderer).toHaveAttribute('data-template-id', 'template8');
    expect(renderer).toHaveAttribute('data-mode', 'live');
    expect(renderer).toHaveAttribute('data-retailer-id', 'retailer-a');
    expect(renderer).toHaveAttribute('data-activation-id', 'activation-a');
    expect(renderer).toHaveAttribute(
      'data-logo-url',
      'https://example.com/retailer-logo.png'
    );
    expect(renderer).toHaveAttribute(
      'data-header-background',
      '#07162f'
    );
    expect(renderer).toHaveAttribute(
      'data-ari-image-url',
      '/brand/ari/ari-master.png'
    );
    expect(renderer).toHaveAttribute('data-session-id', '');

    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
    expect(mockProductChat).not.toHaveBeenCalled();
  });
  it('creates the Shopper Session only when canonical Ari conversation begins', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    mockBeginQrShopperSession.mockResolvedValue({
      sessionId: 'session-a',
      retailerId: 'retailer-a',
    } as Awaited<ReturnType<typeof beginQrShopperSession>>);

    mockProductChat.mockResolvedValue({
      message: 'Here is the supported product guidance.',
    } as Awaited<ReturnType<typeof productChat>>);

    render(<QrScanInteraction qrId="qr-test" />);

    await screen.findByTestId('canonical-shopper-renderer');

    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Test canonical conversation',
      })
    );

    await waitFor(() => {
      expect(mockBeginQrShopperSession).toHaveBeenCalledTimes(1);
    });

    expect(mockBeginQrShopperSession).toHaveBeenCalledWith({
      qrCodeId: 'qr-test',
    });

    await waitFor(() => {
      expect(mockProductChat).toHaveBeenCalledTimes(1);
    });

    expect(mockProductChat).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-a',
        retailerId: 'retailer-a',
        history: [],
      })
    );
  });
});

describe('QrScanInteraction sponsored media measurement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    observerCallback = null;

    mockRecordSponsoredMediaEvent.mockResolvedValue({
      eventId: 'sme_test',
    } as Awaited<ReturnType<typeof recordSponsoredMediaEvent>>);
  });

  it('does not count an impression merely because sponsored media rendered', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    render(<QrScanInteraction qrId="qr-test" />);

    await screen.findByLabelText('Sponsored content from Nike');

    expect(mockRecordSponsoredMediaEvent).not.toHaveBeenCalled();
    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });

  it('records IMPRESSION only after canonical sponsored media reaches 50% visibility', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    render(<QrScanInteraction qrId="qr-test" />);

    await screen.findByLabelText('Sponsored content from Nike');

    expect(observerCallback).not.toBeNull();

    act(() => {
      observerCallback?.(
        [makeIntersectionEntry(true, 0.5)],
        {} as IntersectionObserver
      );
    });

    await waitFor(() => {
      expect(mockRecordSponsoredMediaEvent).toHaveBeenCalledWith({
        qrId: 'qr-test',
        eventType: 'IMPRESSION',
        presentationId: 'smp_test_presentation',
      });
    });

    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });

  it('does not measure legacy sponsored media without presentationId', async () => {
    mockGetScanInteraction.mockResolvedValue(
      legacyResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    render(<QrScanInteraction qrId="qr-test" />);

    await screen.findByLabelText('Sponsored content from Nike');

    expect(observerCallback).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Dismiss sponsored content',
      })
    );

    expect(mockRecordSponsoredMediaEvent).not.toHaveBeenCalled();
    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });

  it('dismisses Ari sponsored media even when DISMISSED measurement fails', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    mockRecordSponsoredMediaEvent.mockRejectedValueOnce(
      new Error('measurement unavailable')
    );

    render(<QrScanInteraction qrId="qr-test" />);

    await screen.findByLabelText('Sponsored content from Nike');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Dismiss sponsored content',
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByLabelText('Sponsored content from Nike')
      ).not.toBeInTheDocument();
    });

    expect(mockRecordSponsoredMediaEvent).toHaveBeenCalledWith({
      qrId: 'qr-test',
      eventType: 'DISMISSED',
      presentationId: 'smp_test_presentation',
    });

    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });

  it('records CLICKED without creating a Shopper Session', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    render(<QrScanInteraction qrId="qr-test" />);

    await screen.findByLabelText('Sponsored content from Nike');

    fireEvent.click(
      screen.getByRole('link', {
        name: 'Learn more',
      })
    );

    expect(mockRecordSponsoredMediaEvent).toHaveBeenCalledWith({
      qrId: 'qr-test',
      eventType: 'CLICKED',
      presentationId: 'smp_test_presentation',
    });

    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });
});

describe('QrScanInteraction sponsored VIDEO lifecycle measurement', () => {
  const canonicalVideoResult = {
    ...canonicalResult,
    sponsoredMedia: {
      format: 'VIDEO' as const,
      sponsorName: 'Nike',
      mediaUrl: 'https://example.com/nike.mp4',
      headline: 'Nike Video',
      presentationId: 'smp_video_presentation',
    },
  };

  const legacyVideoResult = {
    ...canonicalResult,
    sponsoredMedia: {
      format: 'VIDEO' as const,
      sponsorName: 'Nike',
      mediaUrl: 'https://example.com/nike.mp4',
      headline: 'Nike Video',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    observerCallback = null;

    mockRecordSponsoredMediaEvent.mockResolvedValue({
      eventId: 'sme_video_test',
    } as Awaited<ReturnType<typeof recordSponsoredMediaEvent>>);
  });

  it('records the initial actual video play as STARTED ordinal 1', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalVideoResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    const { container } = render(
      <QrScanInteraction qrId="qr-video-test" />
    );

    await screen.findByLabelText('Sponsored content from Nike');

    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    fireEvent.play(video!);

    expect(mockRecordSponsoredMediaEvent).toHaveBeenCalledWith({
      qrId: 'qr-video-test',
      eventType: 'STARTED',
      presentationId: 'smp_video_presentation',
      playbackOrdinal: 1,
    });

    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });

  it('does not treat pause and resume as a replay or new playback', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalVideoResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    const { container } = render(
      <QrScanInteraction qrId="qr-video-test" />
    );

    await screen.findByLabelText('Sponsored content from Nike');

    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    fireEvent.play(video!);
    fireEvent.pause(video!);
    fireEvent.play(video!);

    const playbackCalls = mockRecordSponsoredMediaEvent.mock.calls
      .map(([input]) => input)
      .filter(
        input =>
          input.eventType === 'STARTED' ||
          input.eventType === 'REPLAYED'
      );

    expect(playbackCalls).toEqual([
      {
        qrId: 'qr-video-test',
        eventType: 'STARTED',
        presentationId: 'smp_video_presentation',
        playbackOrdinal: 1,
      },
    ]);

    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });

  it('records completion and deliberate replay with the next playback ordinal', async () => {
    mockGetScanInteraction.mockResolvedValue(
      canonicalVideoResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    const { container } = render(
      <QrScanInteraction qrId="qr-video-test" />
    );

    await screen.findByLabelText('Sponsored content from Nike');

    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    fireEvent.play(video!);
    fireEvent.ended(video!);
    fireEvent.play(video!);
    fireEvent.ended(video!);

    const playbackCalls = mockRecordSponsoredMediaEvent.mock.calls
      .map(([input]) => input)
      .filter(
        input =>
          input.eventType === 'STARTED' ||
          input.eventType === 'COMPLETED' ||
          input.eventType === 'REPLAYED'
      );

    expect(playbackCalls).toEqual([
      {
        qrId: 'qr-video-test',
        eventType: 'STARTED',
        presentationId: 'smp_video_presentation',
        playbackOrdinal: 1,
      },
      {
        qrId: 'qr-video-test',
        eventType: 'COMPLETED',
        presentationId: 'smp_video_presentation',
        playbackOrdinal: 1,
      },
      {
        qrId: 'qr-video-test',
        eventType: 'REPLAYED',
        presentationId: 'smp_video_presentation',
        playbackOrdinal: 2,
      },
      {
        qrId: 'qr-video-test',
        eventType: 'STARTED',
        presentationId: 'smp_video_presentation',
        playbackOrdinal: 2,
      },
      {
        qrId: 'qr-video-test',
        eventType: 'COMPLETED',
        presentationId: 'smp_video_presentation',
        playbackOrdinal: 2,
      },
    ]);

    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });

  it('does not emit canonical playback events for legacy 15A video', async () => {
    mockGetScanInteraction.mockResolvedValue(
      legacyVideoResult as Awaited<ReturnType<typeof getScanInteraction>>
    );

    const { container } = render(
      <QrScanInteraction qrId="qr-video-test" />
    );

    await screen.findByLabelText('Sponsored content from Nike');

    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    fireEvent.play(video!);
    fireEvent.ended(video!);
    fireEvent.play(video!);

    expect(mockRecordSponsoredMediaEvent).not.toHaveBeenCalled();
    expect(mockBeginQrShopperSession).not.toHaveBeenCalled();
  });
});
