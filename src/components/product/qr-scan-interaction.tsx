'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getScanInteraction, productChat, type GetScanInteractionOutput } from '@/ai/flows';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertTriangle, Sparkles, ShieldCheck, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isPendingChat, startChatTransition] = useTransition();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInteraction = async () => {
      try {
        const result = await getScanInteraction({ qrId, shopperUid: user?.uid });
        if (!result) throw new Error("No response from Ari.");

        // Log scan to Firestore (Safe Mode)
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
      } catch (e: any) {
        setError('Intelligence synchronization in progress.');
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
    if (!userInput.trim() || isPendingChat) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    startChatTransition(async () => {
        try {
            const res = await productChat({
                product: {
                    gtin: '06001234567891', // Fallback for test scans
                    name: 'Test Product',
                    description: 'Direct redirect target.',
                    category: 'Test',
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
    const destination = data?.destinationUrl || 'https://interactaoe.co.za';
    window.location.href = destination;
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight">Ari is Synchronizing...</h2>
                <p className="text-sm text-muted-foreground">Identifying persistent behavioural memory.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 flex justify-center border-b bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
            <ShieldCheck className="h-3.5 w-3.5" /> Ari - Intelligence Active
        </Badge>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="max-w-sm mx-auto flex flex-col space-y-4 pb-12">
            {/* Optional Campaign Media */}
            {(data?.mediaUrl || data?.headline) && (
                <div className="mb-6 text-center animate-in fade-in zoom-in-95 duration-700">
                    {data?.mediaType === 'video' ? (
                        <video src={data.mediaUrl} autoPlay muted loop className="w-full rounded-2xl shadow-xl aspect-video object-cover border" />
                    ) : data?.mediaUrl ? (
                        <div className="relative w-full rounded-2xl shadow-xl overflow-hidden aspect-video border">
                            <Image src={data.mediaUrl} alt={data.headline || 'Content'} fill className="object-cover" />
                        </div>
                    ) : null}
                    {data?.headline && <h1 className="text-xl font-black mt-4 leading-tight">{data.headline}</h1>}
                </div>
            )}

            {/* Chat History */}
            {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-end space-x-3", msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "justify-start")}>
                    {msg.role === 'model' && (
                        <Avatar className="h-8 w-8 border-2 border-accent shrink-0 shadow-sm">
                            <AvatarImage src={data?.retailerLogoUrl} />
                            <AvatarFallback className="bg-primary text-white font-black text-[10px]">AR</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn(
                        "rounded-2xl p-3 max-w-[85%] text-sm leading-relaxed border",
                        msg.role === 'user' ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted border-primary/5 text-foreground"
                    )}>
                        {msg.content}
                    </div>
                </div>
            ))}
            
            {isTyping && (
                <div className="flex items-end space-x-3">
                    <Avatar className="h-8 w-8 border-2 border-accent shrink-0">
                        <AvatarFallback className="bg-primary text-white font-black text-[10px]">AR</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl p-2 border border-primary/5">
                        <TypingIndicator />
                    </div>
                </div>
            )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t space-y-4">
        <form onSubmit={handleSend} className="max-w-sm mx-auto flex gap-2">
            <Input 
                placeholder="Ask Ari anything..." 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-none shadow-none text-sm"
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0" disabled={!userInput.trim() || isTyping}>
                <Send className="h-5 w-5" />
            </Button>
        </form>
        
        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full max-w-sm mx-auto block h-14 rounded-2xl text-lg font-bold shadow-xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {user?.displayName ? `Continue, ${user.displayName.split(' ')[0]}` : 'Proceed to Product'}
        </Button>
      </div>
    </div>
  );
}
