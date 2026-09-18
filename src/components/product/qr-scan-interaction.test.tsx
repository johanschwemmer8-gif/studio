import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import QrScanInteraction from './qr-scan-interaction';
import {
  beginQrShopperSession,
  getScanInteraction,
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
  retailerName: 'Retailer A',
  destinationUrl: 'https://interactaoe.co.za',
  messages: [],
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
