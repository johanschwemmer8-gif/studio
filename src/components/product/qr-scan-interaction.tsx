'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { getScanInteraction, productChat, type GetScanInteractionOutput } from '@/ai/flows';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Sparkles, ShieldCheck, Loader2, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

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
  const [clientDestinationUrl, setClientDestinationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isPendingChat, startChatTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInteraction = async () => {
      try {
        // 1. Client-side fetch for the destination URL (Bypasses Admin SDK sync issues)
        if (db) {
            const qrDoc = await getDoc(doc(db, 'qrcodes', qrId));
            if (qrDoc.exists()) {
                const qrData = qrDoc.data();
                if (qrData.redirectUrl) {
                    setClientDestinationUrl(qrData.redirectUrl);
                }
            }
        }

        // 2. Call the Genkit flow for the AI greeting and personality
        const result = await getScanInteraction({ qrId, shopperUid: user?.uid });
        
        // Log the session if DB is available
        if (db) {
            const sessionId = `sess_${Date.now()}`;
            setDoc(doc(db, 'sessions', sessionId), {
                sessionId,
                shopperId: user?.uid || 'guest',
                startTime: serverTimestamp(),
                entryQrId: qrId,
                retailerId: 'simulated-retailer-id'
            }).catch(() => {});
        }

        if (result) {
            setData(result);
            if (result.messages?.length) {
                // Sequence messages with typing simulation
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
        console.warn('Intelligence Layer Handshake Friction:', e);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isPendingChat || isTyping) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    startChatTransition(async () => {
        try {
            const res = await productChat({
                product: {
                    gtin: '06001234567891', // Standard fallback
                    name: 'Product Details',
                    description: 'Interactive buyer guidance.',
                    category: 'Shopping',
                    price: 0
                },
                history: [...messages, { role: 'user', content: userMessage }],
                shopperUid: user?.uid
            });
            setMessages(prev => [...prev, { role: 'model', content: res.message }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: "I'm still synchronizing with the network. Please feel free to continue to the product page." }]);
        } finally {
            setIsTyping(false);
        }
    });
  };

  const handleContinue = () => {
    // Priority: 1. Client-fetched URL, 2. Flow-fetched URL, 3. Hardcoded fallback
    const destination = clientDestinationUrl || data?.destinationUrl || 'https://interactaoe.co.za';
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
            <ShieldCheck className="h-3.5 w-3.5" /> Ari - Intelligence Active
        </Badge>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="max-w-md mx-auto flex flex-col space-y-4 pb-20">
            {/* Optional Campaign Media */}
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

            {/* Chat History */}
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
                    placeholder="Ask Ari about this product..." 
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
        
        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full max-w-md mx-auto flex h-14 rounded-2xl text-lg font-bold shadow-xl bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
        >
          {shopperFirstName ? `Continue, ${shopperFirstName}` : 'Proceed to Product'}
          <Sparkles className="h-4 w-4 opacity-70" />
        </Button>
      </div>
    </div>
  );
}
