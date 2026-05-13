
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Sparkles, QrCode, X, Loader2, Info } from 'lucide-react';
import type { Product } from '@/lib/data';
import { productChat, type ProductChatInput } from '@/ai/flows';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import QrScannerCamera from '../qr-scanner-camera';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

type ProductChatbotProps = {
  product: Product;
};

export default function ProductChatbot({ product }: ProductChatbotProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    startTransition(async () => {
      const chatInput: ProductChatInput = {
        product: {
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            gtin: product.gtin,
        },
        history: newMessages,
        shopperUid: user?.uid,
      };
      
      try {
          const result = await productChat(chatInput);
          setMessages((prev) => [...prev, { role: 'model', content: result.message }]);

          // --- Infrastructure Layer: Interaction Log (Enforced GTIN) ---
          if (db) {
              const conversationId = `convo_${Date.now()}`;
              const conversationRef = doc(db, 'ai_conversations', conversationId);
              setDoc(conversationRef, {
                  conversationId,
                  shopperId: user?.uid || 'guest',
                  gtin: product.gtin,
                  transcript: [...newMessages, { role: 'model', content: result.message }],
                  timestamp: serverTimestamp(),
                  aiModel: 'gemini-2.5-flash'
              }).catch(console.error);

              const interactionRef = doc(db, 'product_interactions', `chat_${Date.now()}`);
              setDoc(interactionRef, {
                  shopperId: user?.uid || 'guest',
                  gtin: product.gtin,
                  type: 'chat_interaction',
                  timestamp: serverTimestamp(),
                  metadata: { conversationId }
              }).catch(console.error);
          }
      } catch (err) {
          console.error("Assistant Logic Friction:", err);
          setMessages((prev) => [...prev, { role: 'model', content: "Friction in Decision Intelligence layer. Synchronizing..." }]);
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
            <SheetTitle className="flex items-center gap-3 text-2xl font-black">
              <BotIcon />
              Decision Assistant
            </SheetTitle>
            <SheetDescription className="text-sm font-medium">
              {user ? `Analysing history for ${user.displayName}...` : 'AI-powered in-store buying consultant.'}
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
                    <Avatar className="h-10 w-10 border-2 border-accent shrink-0 shadow-sm">
                      <AvatarFallback className="bg-primary text-white font-bold">iN</AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl px-4 py-3 bg-muted text-sm leading-relaxed border border-primary/5">
                      Hello! I've initialized your session for <strong>{product.name}</strong>. How can I assist your decision?
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
                        <Avatar className="h-10 w-10 border-2 border-accent shrink-0 shadow-sm">
                        <AvatarFallback className="bg-primary text-white font-bold">iN</AvatarFallback>
                        </Avatar>
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
                        <Avatar className="h-10 w-10 border-2 border-accent shrink-0">
                        <AvatarFallback className="bg-primary text-white font-bold">iN</AvatarFallback>
                        </Avatar>
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
                        <Badge variant="outline" className="text-[8px] bg-accent/10 border-accent/20 text-accent-foreground font-black px-1.5 py-0 h-4">BEHAVIOURAL MEMORY</Badge>
                    </div>
                    <form onSubmit={handleSendMessage} className="flex w-full gap-2 pb-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about specs or comparison..."
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
    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shadow-inner">
      <Sparkles className="h-5 w-5 text-accent-foreground" />
    </div>
  );
}
