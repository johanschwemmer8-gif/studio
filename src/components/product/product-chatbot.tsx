'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Sparkles, QrCode, X, Loader2, ShieldCheck, Info } from 'lucide-react';
import type { Product } from '@/lib/data';
import { productChat, type ProductChatInput } from '@/ai/flows';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import QrScannerCamera from '../qr-scanner-camera';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

type ProductChatbotProps = {
  product: Product;
};

export default function ProductChatbot({ product }: ProductChatbotProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isPending) return;

    const userText = input.trim();
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userText }];
    
    setMessages(newMessages);
    setInput('');

    startTransition(async () => {
      const chatInput: ProductChatInput = {
        gtin: product.gtin,
        url: typeof window !== 'undefined' ? window.location.href : '',
        history: newMessages,
        shopperUid: user?.uid,
      };
      
      try {
          const result = await productChat(chatInput);
          setMessages((prev) => [...prev, { role: 'model', content: result.message }]);

          if (db && sessionId) {
              const conversationId = `convo_${Date.now()}`;
              setDoc(doc(db, 'ai_conversations', conversationId), {
                  conversationId,
                  sessionId,
                  shopperId: user?.uid || 'guest',
                  gtin: product.gtin,
                  transcript: [...newMessages, { role: 'model', content: result.message }],
                  shopperContext: result.shopperContext,
                  timestamp: serverTimestamp(),
                  aiModel: 'gemini-2.5-flash',
              }).catch(() => {});

              if (result.rationale && result.rationale.confidence !== 'NONE') {
                  const recId = `rec_${Date.now()}`;
                  setDoc(doc(db, 'events', recId), {
                      eventId: recId,
                      sessionId,
                      gtin: product.gtin,
                      eventType: 'recommendation_event',
                      timestamp: serverTimestamp(),
                      metadata: result.rationale
                  }).catch(() => {});
              }

              const hasConsent = localStorage.getItem('consent-behavioral-analysis') !== 'false';
              
              if (hasConsent && result.signals && result.signals.length > 0) {
                  result.signals.forEach((signal) => {
                      if (signal.evidenceType === 'inferred' && signal.confidence === 'HIGH') {
                          signal.confidence = 'INFERRED';
                      }

                      const eventId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                      setDoc(doc(db, 'events', eventId), {
                          eventId,
                          sessionId,
                          gtin: product.gtin,
                          eventType: 'interaction_signal',
                          timestamp: serverTimestamp(),
                          metadata: {
                              ...signal,
                              sourceMessage: "[PII REDACTED]",
                          }
                      }).catch(() => {});
                  });
              }
          }
      } catch (err) {
          setMessages((prev) => [...prev, { role: 'model', content: "I'm still synchronizing with the network. Please feel free to ask another question or continue viewing product details." }]);
      }
    });
  };

  const handleScanSuccess = (url: string) => {
    setIsOpen(false);
    setIsScanning(false);
    router.push(url);
  };
  
  const handleStartScan = () => {
      setIsScanning(true);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        })
    }
  }, [messages]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full mt-4 h-14 rounded-xl text-lg font-black gap-3 shadow-lg hover:shadow-xl transition-all">
        <MessageCircle className="h-5 w-5" /> 
        {user ? 'Resume Buying Guidance' : 'Request Guidance'}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col sm:max-w-md border-none rounded-l-[2rem] shadow-2xl">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-3 text-2xl font-black">
                <BotIcon />
                Ari - Your Assistant
                </SheetTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-3">
                            <p className="font-bold text-xs uppercase mb-1">Evidence-Based Guidance</p>
                            <p className="text-[10px] leading-relaxed">
                                Ari uses strictly verified product facts and your explicit requirements to provide guidance. No commercial bias.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <SheetDescription className="text-sm font-medium">
              {user ? `Analysing session context for ${user.displayName}...` : 'Evidence-led shopping assistant.'}
            </SheetDescription>
          </SheetHeader>

          {isScanning ? (
            <div className="flex-1 flex flex-col justify-center items-center py-4">
              <QrScannerCamera onScan={handleScanSuccess} />
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4 -mr-6" ref={scrollAreaRef}>
                <div className="space-y-6 py-6">
                {messages.length === 0 && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm border-2 border-accent">
                      <span className="text-white font-black text-xs">AR</span>
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-muted text-sm leading-relaxed border border-primary/5">
                      Hello! I'm Ari. I've initialized a grounded session for <strong>{product.name}</strong>. How can I help with your decision today?
                    </div>
                  </div>
                )}
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={cn(
                        'flex items-start gap-4',
                        message.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                    >
                    {message.role === 'model' && (
                         <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm border-2 border-accent">
                            <span className="text-white font-black text-xs">AR</span>
                        </div>
                    )}
                    <div
                        className={cn(
                        'rounded-2xl px-4 py-3 max-w-[85%] border',
                        message.role === 'user'
                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                            : 'bg-muted border-primary/5'
                        )}
                    >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    </div>
                ))}
                {isPending && (
                    <div className="flex items-start gap-4">
                         <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm border-2 border-accent">
                            <span className="text-white font-black text-xs">AR</span>
                        </div>
                        <div className="rounded-2xl px-4 py-3 bg-muted space-y-2 w-48 border border-primary/5">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
          )}

          <SheetFooter className="flex-col gap-3 pt-6 border-t bg-background">
            {isScanning ? (
                <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full h-12 rounded-xl">
                    <X className="mr-2 h-4 w-4" /> Stop Scanning
                </Button>
            ) : (
                <>
                    <div className="flex justify-between items-center px-1">
                        <Button variant="ghost" size="sm" onClick={handleStartScan} className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground h-auto p-0 hover:bg-transparent hover:text-primary">
                            <QrCode className="mr-2 h-3.5 w-3.5" />
                            Compare Product
                        </Button>
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3 text-green-500" />
                            <span className="text-[8px] text-muted-foreground font-black uppercase tracking-tighter">Shopper Control Active</span>
                        </div>
                    </div>
                    <form onSubmit={handleSendMessage} className="flex w-full gap-2 pb-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about specs, budget, suitability..."
                            disabled={isPending}
                            className="bg-muted/80 border-none shadow-none h-12 rounded-xl text-sm"
                        />
                        <Button type="submit" disabled={isPending || !input.trim()} size="icon" className="h-12 w-12 rounded-xl shrink-0 shadow-lg">
                            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </form>
                </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function BotIcon() {
  return (
    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shadow-inner border border-accent-foreground/10">
      <Sparkles className="h-5 w-5 text-accent-foreground" />
    </div>
  );
}
