'use client';

import { useEffect, useState, useRef } from 'react';
import {
  beginQrShopperSession,
  getScanInteraction,
  productChat,
  type GetScanInteractionOutput,
} from '@/ai/flows';
import { Button } from '../ui/button';
import {
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { recordSponsoredMediaEvent } from '@/lib/sponsored-media-event-server';
import { ShopperExperienceRenderer } from '@/components/dashboard/shopper-experience/shopper-experience-renderer';

export default function QrScanInteraction({ qrId }: { qrId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<GetScanInteractionOutput | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionRetailerId, setSessionRetailerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sponsoredMediaDismissed, setSponsoredMediaDismissed] = useState(false);
  const sponsoredMediaRef = useRef<HTMLElement>(null);
  const sponsoredImpressionRecordedRef = useRef<string | null>(null);
  const sponsoredVideoPresentationRef = useRef<string | null>(null);
  const sponsoredVideoPlaybackOrdinalRef = useRef(0);
  const sponsoredVideoCurrentPlaybackStartedRef = useRef(false);
  const sponsoredVideoCompletedRef = useRef(false);

  useEffect(() => {
    setSponsoredMediaDismissed(false);

    const fetchInteraction = async () => {
      try {
        // A scan/exposure does not create a Shopper Session.
        // Bootstrap the experience through the canonical server-side resolver.
        const result = await getScanInteraction({
          qrId,
          shopperUid: user?.uid,
        });

        if (result) {
            setData(result);
        }
      } catch (e: any) {
        console.warn('Intelligence Layer Handshake Friction');
      } finally {
        setLoading(false);
      }
    };
    
    if (qrId) fetchInteraction();
  }, [qrId, user]);

  useEffect(() => {
    const sponsoredMedia = data?.sponsoredMedia;
    const element = sponsoredMediaRef.current;

    if (
      !sponsoredMedia ||
      !sponsoredMedia.presentationId ||
      sponsoredMediaDismissed ||
      !element
    ) {
      return;
    }

    const presentationId = sponsoredMedia.presentationId;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          !entry?.isIntersecting ||
          entry.intersectionRatio < 0.5 ||
          sponsoredImpressionRecordedRef.current === presentationId
        ) {
          return;
        }

        sponsoredImpressionRecordedRef.current = presentationId;
        observer.disconnect();

        void recordSponsoredMediaEvent({
          qrId,
          eventType: 'IMPRESSION',
          presentationId,
        }).catch(() => {
          // Retail Media measurement must never interrupt Ari.
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [data?.sponsoredMedia, qrId, sponsoredMediaDismissed]);

  const handleSponsoredMediaDismiss = () => {
    const presentationId = data?.sponsoredMedia?.presentationId;

    // Ari wins: dismiss immediately, independent of measurement.
    setSponsoredMediaDismissed(true);

    if (!presentationId) {
      return;
    }

    void recordSponsoredMediaEvent({
      qrId,
      eventType: 'DISMISSED',
      presentationId,
    }).catch(() => {
      // Retail Media measurement must never interrupt Ari.
    });
  };

  const handleSponsoredMediaClick = () => {
    const presentationId = data?.sponsoredMedia?.presentationId;

    if (!presentationId) {
      return;
    }

    // Navigation is owned by the anchor; measurement is best-effort only.
    void recordSponsoredMediaEvent({
      qrId,
      eventType: 'CLICKED',
      presentationId,
    }).catch(() => {
      // Retail Media measurement must never interrupt shopper navigation.
    });
  };

  const handleSponsoredVideoPlay = () => {
    const sponsoredMedia = data?.sponsoredMedia;
    const presentationId = sponsoredMedia?.presentationId;

    if (
      !sponsoredMedia ||
      sponsoredMedia.format !== 'VIDEO' ||
      !presentationId
    ) {
      return;
    }

    if (sponsoredVideoPresentationRef.current !== presentationId) {
      sponsoredVideoPresentationRef.current = presentationId;
      sponsoredVideoPlaybackOrdinalRef.current = 0;
      sponsoredVideoCurrentPlaybackStartedRef.current = false;
      sponsoredVideoCompletedRef.current = false;
    }

    // A repeated play event during the same playback, including pause/resume,
    // is not a new playback and is not a replay.
    if (
      sponsoredVideoCurrentPlaybackStartedRef.current &&
      !sponsoredVideoCompletedRef.current
    ) {
      return;
    }

    const isReplay = sponsoredVideoCompletedRef.current;

    sponsoredVideoPlaybackOrdinalRef.current += 1;
    const playbackOrdinal = sponsoredVideoPlaybackOrdinalRef.current;

    sponsoredVideoCurrentPlaybackStartedRef.current = true;
    sponsoredVideoCompletedRef.current = false;

    if (isReplay) {
      void recordSponsoredMediaEvent({
        qrId,
        eventType: 'REPLAYED',
        presentationId,
        playbackOrdinal,
      }).catch(() => {
        // Retail Media measurement must never interrupt Ari or playback.
      });
    }

    void recordSponsoredMediaEvent({
      qrId,
      eventType: 'STARTED',
      presentationId,
      playbackOrdinal,
    }).catch(() => {
      // Retail Media measurement must never interrupt Ari or playback.
    });
  };

  const handleSponsoredVideoEnded = () => {
    const sponsoredMedia = data?.sponsoredMedia;
    const presentationId = sponsoredMedia?.presentationId;

    if (
      !sponsoredMedia ||
      sponsoredMedia.format !== 'VIDEO' ||
      !presentationId ||
      sponsoredVideoPresentationRef.current !== presentationId ||
      !sponsoredVideoCurrentPlaybackStartedRef.current ||
      sponsoredVideoCompletedRef.current
    ) {
      return;
    }

    const playbackOrdinal = sponsoredVideoPlaybackOrdinalRef.current;

    sponsoredVideoCompletedRef.current = true;
    sponsoredVideoCurrentPlaybackStartedRef.current = false;

    void recordSponsoredMediaEvent({
      qrId,
      eventType: 'COMPLETED',
      presentationId,
      playbackOrdinal,
    }).catch(() => {
      // Retail Media measurement must never interrupt Ari or playback.
    });
  };

  const handleCanonicalConversation = async (
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }>,
  ): Promise<string> => {
    const userMessage = message.trim();

    if (!userMessage) {
      throw new Error('Conversation message is required.');
    }

    const destination =
      data?.destinationUrl || 'https://interactaoe.co.za';

    const hasConsent =
      localStorage.getItem('consent-behavioral-analysis') !== 'false';

    let activeSessionId = sessionId;
    let activeRetailerId = sessionRetailerId;

    if (!activeSessionId || !activeRetailerId) {
      const session = await beginQrShopperSession({
        qrCodeId: qrId,
        ...(activeSessionId ? { sessionId: activeSessionId } : {}),
      });

      activeSessionId = session.sessionId;
      activeRetailerId = session.retailerId;

      setSessionId(session.sessionId);
      setSessionRetailerId(session.retailerId);
    }

    const response = await productChat({
      ...(data?.gtin ? { gtin: data.gtin } : {}),
      url: destination,
      history,
      shopperUid: user?.uid,
      hasConsent,
      sessionId: activeSessionId,
      retailerId: activeRetailerId,
    });

    return response.message;
  };

  const handleContinue = () => {
    const destination = data?.destinationUrl || 'https://interactaoe.co.za';
    window.location.href = destination;
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-primary">Ari is Synchronizing...</h2>
                <p className="text-sm text-muted-foreground">Identifying persistent behavioural memory.</p>
            </div>
        </div>
    );
  }

  const shopperFirstName = (user && user.displayName) ? user.displayName.split(' ')[0] : null;

  return (
    <div className="flex flex-col h-svh bg-background overflow-hidden">
      {data?.shopperPresentation && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <ShopperExperienceRenderer
            templateId={data.shopperPresentation.selectedTemplate}
            mode="live"
            branding={data.shopperPresentation.branding}
            ariPresentation={data.shopperPresentation.ariPresentation}
            ariImageUrl="/brand/ari/ari-master.png"
            retailerId={data.retailerId}
            activationId={data.activationId}
            sessionId={sessionId ?? undefined}
            initialMediaMode="none"
            onSubmitConversationMessage={handleCanonicalConversation}
          />
        </div>
      )}

      {data?.sponsoredMedia && !sponsoredMediaDismissed && (
        <aside
          ref={sponsoredMediaRef}
          className={cn(
            "relative shrink-0 border-t bg-background",
            data.sponsoredMedia.format === "VIDEO"
              ? "max-h-[25svh]"
              : "max-h-[12.5svh]"
          )}
          aria-label={`Sponsored content from ${data.sponsoredMedia.sponsorName}`}
        >
          <div className="relative mx-auto h-full w-full max-w-md overflow-hidden">
            <div className="absolute left-3 top-2 z-20 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              Sponsored · {data.sponsoredMedia.sponsorName}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 z-30 h-8 w-8 rounded-full shadow-md"
              onClick={handleSponsoredMediaDismiss}
              aria-label="Dismiss sponsored content"
              title="Dismiss sponsored content"
            >
              <X className="h-4 w-4" />
            </Button>

            {data.sponsoredMedia.format === "VIDEO" ? (
              <video
                key={`${qrId}-${data.sponsoredMedia.mediaUrl}`}
                src={data.sponsoredMedia.mediaUrl}
                autoPlay
                muted
                playsInline
                controls
                preload="metadata"
                onPlay={handleSponsoredVideoPlay}
                onEnded={handleSponsoredVideoEnded}
                className="max-h-[25svh] w-full object-contain"
              />
            ) : (
              <div className="flex max-h-[12.5svh] min-h-16 items-center justify-center overflow-hidden">
                <img
                  src={data.sponsoredMedia.mediaUrl}
                  alt={
                    data.sponsoredMedia.headline ||
                    `${data.sponsoredMedia.sponsorName} sponsored content`
                  }
                  className="max-h-[12.5svh] w-full object-contain"
                />
              </div>
            )}

            {(data.sponsoredMedia.headline ||
              data.sponsoredMedia.destinationUrl) && (
              <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-background/90 px-3 py-2 backdrop-blur-sm">
                {data.sponsoredMedia.headline ? (
                  <p className="truncate text-xs font-semibold">
                    {data.sponsoredMedia.headline}
                  </p>
                ) : (
                  <span />
                )}

                {data.sponsoredMedia.destinationUrl && (
                  <a
                    href={data.sponsoredMedia.destinationUrl}
                    onClick={handleSponsoredMediaClick}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-bold text-primary underline-offset-4 hover:underline"
                  >
                    Learn more
                  </a>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      <div className="shrink-0 bg-background px-4 pb-4 pt-3">
        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full max-w-md mx-auto flex h-14 rounded-2xl text-lg font-bold shadow-xl bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
        >
          {shopperFirstName ? `Continue, ${shopperFirstName}` : 'Proceed to Website'}
          <Sparkles className="h-4 w-4 opacity-70" />
        </Button>
      </div>
    </div>
  );
}
