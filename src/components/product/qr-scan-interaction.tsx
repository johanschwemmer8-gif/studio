
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getScanInteraction, type GetScanInteractionOutput } from '@/ai/flows';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

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
        // Pass user UID for continuity greeting
        const result = await getScanInteraction({ qrId, shopperUid: user?.uid });
        
        const hasCampaignContent = result.mediaUrl || result.headline || result.subhead;
        const hasGlobalContent = savedHeadline || savedSubheading;
        const hasMessages = result.messages && result.messages.length > 0;

        // Auto-redirect if no interaction content is defined
        if (!hasCampaignContent && !hasGlobalContent && !hasMessages) {
           window.location.href = result.destinationUrl;
           return;
        }

        setData(result);
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
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
      }, 1200); 
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
            <div className="w-full max-w-sm mx-auto animate-pulse flex flex-col gap-6">
                <div className="h-48 w-full bg-muted rounded-2xl" />
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
            <Alert variant="destructive" className="max-w-sm rounded-2xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Friction Detected</AlertTitle>
              <AlertDescription>
                Could not load interaction. Please try scanning again. <br />
                <span className="text-xs font-mono mt-4 block p-2 bg-destructive/10 rounded">{error}</span>
              </AlertDescription>
            </Alert>
            <Button variant="ghost" className="mt-4" onClick={() => window.location.reload()}>Retry Scan</Button>
        </div>
    );
  }
  
  const displayHeadline = data?.headline || globalContent.headline;
  const displaySubhead = data?.subhead || globalContent.subhead;
  const showContinueButton = !data?.messages?.length || displayedMessages.length === data.messages.length;

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-end pb-12">
        {/* Media and Headline Section */}
        {(data?.mediaUrl || displayHeadline || displaySubhead) && (
            <div className="mb-8 text-center animate-in fade-in zoom-in-95 duration-700">
                {data?.mediaType === 'video' ? (
                    <video src={data.mediaUrl} controls autoPlay muted loop className="w-full rounded-2xl shadow-2xl aspect-video object-cover ring-1 ring-primary/5" />
                ) : data?.mediaUrl ? (
                    <Image src={data.mediaUrl} alt={data.headline || 'Campaign Media'} width={400} height={225} className="w-full rounded-2xl shadow-2xl object-cover aspect-video ring-1 ring-primary/5" />
                ) : null}
                {displayHeadline && <h1 className="text-2xl font-black mt-6 tracking-tight">{displayHeadline}</h1>}
                {displaySubhead && <p className="text-muted-foreground mt-2 px-4 leading-snug">{displaySubhead}</p>}
            </div>
        )}
        
        {/* Continuity Chat Section */}
        {data?.messages && data.messages.length > 0 && (
             <div className="space-y-4">
                {displayedMessages.map((msg, index) => (
                    <div key={index} className="flex items-end space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Avatar className="h-10 w-10 border-2 border-accent shrink-0 shadow-sm">
                            <AvatarImage src={data?.retailerLogoUrl} alt="Retailer Logo" />
                            <AvatarFallback className="bg-primary text-white"><Sparkles className="h-4 w-4 text-accent"/></AvatarFallback>
                        </Avatar>
                        <MessageBubble text={msg} isTyping={false} />
                    </div>
                ))}
                {!showContinueButton && (
                        <div className="flex items-end space-x-3">
                            <Avatar className="h-10 w-10 border-2 border-accent shrink-0 shadow-sm">
                                <AvatarImage src={data?.retailerLogoUrl} alt="Retailer Logo" />
                                <AvatarFallback className="bg-primary text-white"><Sparkles className="h-4 w-4 text-accent"/></AvatarFallback>
                            </Avatar>
                            <MessageBubble text="" isTyping={true} />
                        </div>
                )}
            </div>
        )}

      </div>
      <div className="w-full max-w-sm mx-auto pt-8 border-t border-primary/5">
        <Button
          onClick={handleContinue}
          size="lg"
          className={cn(
            "w-full h-14 rounded-2xl text-lg font-bold shadow-xl transition-all duration-700",
            showContinueButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {user ? `Continue for ${user.displayName}` : 'Continue to Product'}
        </Button>
      </div>
    </div>
  );
}
