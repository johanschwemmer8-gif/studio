
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getScanInteraction, type GetScanInteractionOutput } from '@/ai/flows';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
        <div className="bg-muted rounded-xl p-3 max-w-[85%] self-start">
            {isTyping ? <TypingIndicator /> : <p className="text-sm text-foreground">{text}</p>}
        </div>
    );
}

export default function QrScanInteraction({ qrId }: QrScanInteractionProps) {
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
        const result = await getScanInteraction({ qrId });
        
        const hasCampaignContent = result.mediaUrl || result.headline || result.subhead;
        const hasGlobalContent = savedHeadline || savedSubheading;
        const hasMessages = result.messages && result.messages.length > 0;

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
  }, [qrId]);
  
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
      }, 1500); // Delay between messages
      return () => clearInterval(interval);
    }
  }, [data]);

  const handleContinue = () => {
    if (data?.destinationUrl) {
      console.log(`Interaction complete for ${qrId}. Redirecting...`);
      window.location.href = data.destinationUrl;
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
            <div className="w-full max-w-sm mx-auto animate-pulse">
                <Skeleton className="w-full aspect-video rounded-lg mb-4" />
                 <div className="flex items-start space-x-3">
                    <Skeleton className="rounded-full h-10 w-10" />
                    <div className="flex-1 space-y-4 py-1">
                        <Skeleton className="h-6 bg-muted rounded w-3/4" />
                        <Skeleton className="h-6 bg-muted rounded w-1/2" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
            <Alert variant="destructive" className="max-w-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Could not load interaction. Please try scanning again. <br />
                <span className="text-xs font-mono mt-2 block">{error}</span>
              </AlertDescription>
            </Alert>
        </div>
    );
  }
  
  const displayHeadline = data?.headline || globalContent.headline;
  const displaySubhead = data?.subhead || globalContent.subhead;
  const showContinueButton = !data?.messages?.length || displayedMessages.length === data.messages.length;

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-end">
        {/* Media and Headline Section */}
        {(data?.mediaUrl || displayHeadline || displaySubhead) && (
            <div className="mb-6 text-center">
                {data?.mediaType === 'video' ? (
                    <video src={data.mediaUrl} controls autoPlay muted loop className="w-full rounded-lg shadow-lg aspect-video object-cover" />
                ) : data?.mediaUrl ? (
                    <Image src={data.mediaUrl} alt={data.headline || 'Campaign Media'} width={400} height={225} className="w-full rounded-lg shadow-lg object-cover aspect-video" />
                ) : null}
                {displayHeadline && <h1 className="text-2xl font-bold mt-4">{displayHeadline}</h1>}
                {displaySubhead && <p className="text-muted-foreground mt-1">{displaySubhead}</p>}
            </div>
        )}
        
        {/* Chat Section */}
        {data?.messages && data.messages.length > 0 && (
             <div className="space-y-4">
                {displayedMessages.map((msg, index) => (
                    <div key={index} className="flex items-end space-x-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <Avatar className="h-10 w-10 border-2 border-accent shrink-0">
                            <AvatarImage src={data?.retailerLogoUrl} alt="Retailer Logo" />
                            <AvatarFallback><Sparkles className="text-accent"/></AvatarFallback>
                        </Avatar>
                        <MessageBubble text={msg} isTyping={false} />
                    </div>
                ))}
                {!showContinueButton && (
                        <div className="flex items-end space-x-3">
                            <Avatar className="h-10 w-10 border-2 border-accent shrink-0">
                                <AvatarImage src={data?.retailerLogoUrl} alt="Retailer Logo" />
                                <AvatarFallback><Sparkles className="text-accent"/></AvatarFallback>
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
            "w-full transition-opacity duration-500",
            showContinueButton ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          Continue to Product
        </Button>
      </div>
    </div>
  );
}
