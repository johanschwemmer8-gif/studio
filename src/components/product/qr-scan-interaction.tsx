'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getScanInteraction, type GetScanInteractionOutput } from '@/ai/flows';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertTriangle, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AI_CONTENT_HEADLINE_KEY = 'ai-content-headline';
const AI_CONTENT_SUBHEADING_KEY = 'ai-content-subheading';

type QrScanInteractionProps = {
  qrId: string;
};

function TypingIndicator() {
    return (
        <div className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"></span>
        </div>
    )
}

function MessageBubble({ text, isTyping }: { text: string, isTyping: boolean }) {
    return (
        <div className="bg-muted rounded-xl p-3 max-w-[85%] self-start border border-primary/5">
            {isTyping ? <TypingIndicator /> : <p className="text-sm text-foreground leading-relaxed">{text}</p>}
        </div>
    );
}

export default function QrScanInteraction({ qrId }: QrScanInteractionProps) {
  const { user } = useAuth();
  const [data, setData] = useState<GetScanInteractionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]);
  const router = useRouter();

  const [globalContent, setGlobalContent] = useState<{ headline: string | null; subhead: string | null }>({ headline: null, subhead: null });

  useEffect(() => {
    const fetchInteraction = async () => {
      const savedHeadline = localStorage.getItem(AI_CONTENT_HEADLINE_KEY);
      const savedSubheading = localStorage.getItem(AI_CONTENT_SUBHEADING_KEY);
      setGlobalContent({ headline: savedHeadline, subhead: savedSubheading });
      
      try {
        const result = await getScanInteraction({ qrId, shopperUid: user?.uid });
        
        // --- Infrastructure Layer: Initialize Session ---
        if (db) {
            const sessionId = `sess_${Date.now()}`;
            const sessionRef = doc(db, 'sessions', sessionId);
            setDoc(sessionRef, {
                sessionId,
                shopperId: user?.uid || 'guest',
                startTime: serverTimestamp(),
                entryQrId: qrId,
                retailerId: 'simulated-retailer-id'
            }).catch(console.error);

            // Log raw behavioural scan event
            const interactionRef = doc(db, 'product_interactions', `scan_${Date.now()}`);
            setDoc(interactionRef, {
                shopperId: user?.uid || 'guest',
                sessionId,
                type: 'scan',
                timestamp: serverTimestamp(),
                productId: result.destinationUrl.split('/').pop() || 'unknown'
            }).catch(console.error);
        }

        const hasCampaignContent = result.mediaUrl || result.headline || result.subhead;
        const hasGlobalContent = savedHeadline || savedSubheading;
        const hasMessages = result.messages && result.messages.length > 0;

        if (!hasCampaignContent && !hasGlobalContent && !hasMessages) {
           window.location.href = result.destinationUrl;
           return;
        }

        setData(result);
      } catch (e: any) {
        setError(e.message || 'Decision Intelligence timeout.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInteraction();
  }, [qrId, user]);
  
   useEffect(() => {
    if (data?.messages?.length) {
      let currentMessageIndex = 0;
      const interval = setInterval(() => {
        if (currentMessageIndex < data.messages.length) {
          setDisplayedMessages(prev => [...prev, data.messages[currentMessageIndex]]);
          currentMessageIndex++;
        } else {
          clearInterval(interval);
        }
      }, 1000); 
      return () => clearInterval(interval);
    }
  }, [data]);

  const handleContinue = () => {
    if (data?.destinationUrl) {
      window.location.href = data.destinationUrl;
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="space-y-2">
                <h2 className="text-xl font-bold">Ari is Synchronizing...</h2>
                <p className="text-sm text-muted-foreground">Identifying persistent behavioural memory.</p>
            </div>
            <div className="w-full max-w-sm mx-auto animate-pulse flex flex-col gap-6">
                <div className="h-48 w-full bg-muted rounded-2xl" />
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
            <Alert variant="destructive" className="max-w-sm rounded-2xl shadow-lg border-none bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900 font-bold">Ari Encountered Friction</AlertTitle>
              <AlertDescription className="text-red-800">
                The Decision Intelligence layer is currently under high load. Redirecting you shortly...
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="mt-6 rounded-xl h-12" onClick={() => handleContinue()}>Skip to Product</Button>
        </div>
    );
  }
  
  const displayHeadline = data?.headline || globalContent.headline;
  const displaySubhead = data?.subhead || globalContent.subhead;
  const showContinueButton = !data?.messages?.length || displayedMessages.length === data.messages.length;

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-end pb-12">
        <div className="mb-6 flex justify-center">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
                <ShieldCheck className="h-3.5 w-3.5" /> Ari - Persistent Intelligence Active
            </Badge>
        </div>

        {/* Media Section */}
        {(data?.mediaUrl || displayHeadline || displaySubhead) && (
            <div className="mb-8 text-center animate-in fade-in zoom-in-95 duration-700">
                {data?.mediaType === 'video' ? (
                    <video src={data.mediaUrl} controls autoPlay muted loop className="w-full rounded-2xl shadow-2xl aspect-video object-cover" />
                ) : data?.mediaUrl ? (
                    <Image src={data.mediaUrl} alt={data.headline || 'Brand Content'} width={400} height={225} className="w-full rounded-2xl shadow-2xl object-cover aspect-video" />
                ) : null}
                {displayHeadline && <h1 className="text-2xl font-black mt-6 tracking-tight leading-tight">{displayHeadline}</h1>}
                {displaySubhead && <p className="text-muted-foreground mt-2 px-4 leading-relaxed text-sm">{displaySubhead}</p>}
            </div>
        )}
        
        {/* Continuity Interaction */}
        {data?.messages && data.messages.length > 0 && (
             <div className="space-y-4">
                {displayedMessages.map((msg, index) => (
                    <div key={index} className="flex items-end space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Avatar className="h-10 w-10 border-2 border-accent shrink-0 shadow-sm">
                            <AvatarImage src={data?.retailerLogoUrl} alt="Ari - Intelligence Assistant" />
                            <AvatarFallback className="bg-primary text-white font-black">AR</AvatarFallback>
                        </Avatar>
                        <MessageBubble text={msg} isTyping={false} />
                    </div>
                ))}
                {!showContinueButton && (
                        <div className="flex items-end space-x-3">
                            <Avatar className="h-10 w-10 border-2 border-accent shrink-0 shadow-sm">
                                <AvatarImage src={data?.retailerLogoUrl} alt="Ari" />
                                <AvatarFallback className="bg-primary text-white font-black">AR</AvatarFallback>
                            </Avatar>
                            <MessageBubble text="" isTyping={true} />
                        </div>
                )}
            </div>
        )}
      </div>

      <div className="w-full max-w-sm mx-auto pt-8">
        <Button
          onClick={handleContinue}
          size="lg"
          className={cn(
            "w-full h-14 rounded-2xl text-lg font-bold shadow-xl transition-all duration-700",
            showContinueButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {user ? `Welcome back, ${user.displayName}` : 'View Ari\'s Guidance'}
        </Button>
      </div>
    </div>
  );
}
