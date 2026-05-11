
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Sparkles, QrCode, X } from 'lucide-react';
import type { Product } from '@/lib/data';
import { productChat, type ProductChatInput } from '@/ai/flows';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import QrScannerCamera from '../qr-scanner-camera';
import { useAuth } from '@/context/auth-context';

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
        },
        history: newMessages,
        shopperUid: user?.uid, // Pass the identity for behavioral memory
      };
      const result = await productChat(chatInput);
      setMessages((prev) => [...prev, { role: 'model', content: result.message }]);
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
  
  useEffect(() => {
      if(isOpen && messages.length === 0) {
          // Optional: Initial greeting could be triggered here
      }
  }, [isOpen]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full mt-4 gap-2">
        <MessageCircle className="h-4 w-4" /> 
        {user ? 'Chat with your Assistant' : 'Ask a Question'}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BotIcon />
              {isScanning ? 'Scan a Product' : 'Retail Intelligence Assistant'}
            </SheetTitle>
            <SheetDescription>
              {user ? 'Leveraging your shopping memory for expert advice.' : 'Get instant product guidance and details.'}
            </SheetDescription>
          </SheetHeader>

          {isScanning ? (
            <div className="flex-1 flex flex-col justify-center items-center py-4">
              <QrScannerCamera onScan={handleScanSuccess} />
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4 -mr-6" ref={scrollAreaRef}>
                <div className="space-y-4 py-4">
                {messages.length === 0 && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border-2 border-accent">
                      <AvatarFallback><Sparkles className="text-accent h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-3 py-2 bg-muted text-sm">
                      Hi! I'm your iNteract assistant. ${user ? `Welcome back! I can see your saved interests in ${product.category}. ` : ''}How can I help you with the ${product.name}?
                    </div>
                  </div>
                )}
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={cn(
                        'flex items-start gap-3',
                        message.role === 'user' ? 'justify-end' : ''
                    )}
                    >
                    {message.role === 'model' && (
                        <Avatar className="h-8 w-8 border-2 border-accent">
                        <AvatarFallback>
                            <Sparkles className="text-accent h-4 w-4" />
                        </AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={cn(
                        'rounded-lg px-3 py-2 max-w-[80%]',
                        message.role === 'user'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-muted'
                        )}
                    >
                        <p className="text-sm">{message.content}</p>
                    </div>
                    </div>
                ))}
                {isPending && (
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 border-2 border-accent">
                        <AvatarFallback>
                            <Sparkles className="text-accent h-4 w-4" />
                        </AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg px-3 py-2 bg-muted space-y-2">
                            <Skeleton className="h-3 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
          )}

          <SheetFooter className="flex-col gap-2 pt-4 border-t">
            {isScanning ? (
                <Button variant="outline" onClick={() => setIsScanning(false)}>
                    <X className="mr-2 h-4 w-4" /> Cancel Scan
                </Button>
            ) : (
                <>
                    <Button variant="ghost" size="sm" onClick={handleStartScan} className="text-xs text-muted-foreground">
                    <QrCode className="mr-2 h-3 w-3" />
                    Scan Another Item
                    </Button>
                    <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for advice..."
                        disabled={isPending}
                        className="bg-muted/50 border-none shadow-none"
                    />
                    <Button type="submit" disabled={isPending || !input.trim()} size="icon">
                        <Send className="h-4 w-4" />
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
    <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
      <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
    </div>
  );
}
