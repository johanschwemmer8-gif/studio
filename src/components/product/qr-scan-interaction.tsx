'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import {
  beginQrShopperSession,
  getScanInteraction,
  productChat,
  type GetScanInteractionOutput,
} from '@/ai/flows';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Sparkles,
  ShieldCheck,
  Loader2,
  Send,
  MessageSquare,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { recordSponsoredMediaEvent } from '@/lib/sponsored-media-event-server';

type Message = {
    role: 'user' | 'model';
    content: string;
};

function TypingIndicator() {
    return (
        <div className="flex items-center space-x-1 py-1 px-2">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"></span>
        </div>
    )
}

export default function QrScanInteraction({ qrId }: { qrId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<GetScanInteractionOutput | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionRetailerId, setSessionRetailerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [sponsoredMediaDismissed, setSponsoredMediaDismissed] = useState(false);
  const [isPendingChat, startChatTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
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
            if (result.messages?.length) {
                setIsTyping(true);
                let current = 0;
                const interval = setInterval(() => {
                    if (current < result.messages.length) {
                        setMessages(prev => [...prev, { role: 'model', content: result.messages[current] }]);
                        current++;
                    } else {
                        setIsTyping(false);
                        clearInterval(interval);
                    }
                }, 800);
            }
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
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [messages, isTyping]);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || isPendingChat || isTyping) return;

    const userMessage = userInput.trim();
    const destination = data?.destinationUrl || 'https://interactaoe.co.za';
    
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    startChatTransition(async () => {
        try {
            const hasConsent = localStorage.getItem('consent-behavioral-analysis') !== 'false';

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

            const res = await productChat({
                url: destination,
                history: [...messages, { role: 'user', content: userMessage }],
                shopperUid: user?.uid,
                hasConsent,
                sessionId: activeSessionId,
                retailerId: activeRetailerId,
            });
            setMessages(prev => [...prev, { role: 'model', content: res.message }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: "I'm still synchronizing with the network. Please feel free to continue to the product page while I reconnect." }]);
        } finally {
            setIsTyping(false);
        }
    });
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
      <header className="p-4 flex justify-center border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
            <ShieldCheck className="h-3.5 w-3.5" /> Ari - Online
        </Badge>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="max-w-md mx-auto flex flex-col space-y-4 pb-20">
            {(data?.mediaUrl || data?.headline) && (
                <div className="mb-6 text-center animate-in fade-in zoom-in-95 duration-700">
                    {data?.mediaType === 'video' ? (
                        <video src={data.mediaUrl} autoPlay muted loop className="w-full rounded-2xl shadow-xl aspect-video object-cover border" />
                    ) : data?.mediaUrl ? (
                        <div className="relative w-full rounded-2xl shadow-xl overflow-hidden aspect-video border bg-muted">
                            <Image src={data.mediaUrl} alt={data.headline || 'Content'} fill className="object-cover" />
                        </div>
                    ) : null}
                    {data?.headline && <h1 className="text-2xl font-black mt-4 leading-tight tracking-tight">{data.headline}</h1>}
                </div>
            )}

            {messages.length === 0 && !isTyping && !loading && (
                <div className="p-8 text-center text-muted-foreground italic text-sm">
                    Initializing conversation...
                </div>
            )}

            {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-end space-x-3", msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "justify-start animate-in slide-in-from-left-2")}>
                    {msg.role === 'model' && (
                        <Avatar className="h-8 w-8 border-2 border-accent shrink-0 shadow-sm">
                            <AvatarImage src={data?.retailerLogoUrl} />
                            <AvatarFallback className="bg-primary text-white font-black text-[10px]">AR</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn(
                        "rounded-2xl p-4 max-w-[85%] text-sm leading-relaxed border",
                        msg.role === 'user' ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted border-primary/5 text-foreground"
                    )}>
                        {msg.content}
                    </div>
                </div>
            ))}
            
            {isTyping && (
                <div className="flex items-end space-x-3 animate-in fade-in">
                    <Avatar className="h-8 w-8 border-2 border-accent shrink-0">
                        <AvatarFallback className="bg-primary text-white font-black text-[10px]">AR</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl p-3 border border-primary/5">
                        <TypingIndicator />
                    </div>
                </div>
            )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t space-y-4 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
        <form onSubmit={handleSend} className="max-w-md mx-auto flex gap-2">
            <div className="relative flex-1">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Ask Ari about this..." 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="h-12 pl-10 rounded-xl bg-muted/50 border-none shadow-none text-sm focus-visible:ring-primary/20"
                    disabled={isTyping}
                />
            </div>
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0 shadow-lg bg-primary hover:bg-primary/90" disabled={!userInput.trim() || isTyping}>
                {isPendingChat ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </form>
        
      </div>

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
