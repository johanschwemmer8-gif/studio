
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
import { MessageCircle, Send, Sparkles, QrCode } from 'lucide-react';
import type { Product } from '@/lib/data';
import { productChat, type ProductChatInput } from '@/ai/flows';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

type ProductChatbotProps = {
  product: Product;
};

export default function ProductChatbot({ product }: ProductChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      };
      const result = await productChat(chatInput);
      setMessages((prev) => [...prev, { role: 'model', content: result.message }]);
    });
  };

  const handleSimulateScan = () => {
    const otherProductId = product.id === '1' ? '2' : '1';
    setIsOpen(false);
    // A slight delay to allow the sheet to close before navigating
    setTimeout(() => {
        router.push(`/product/${otherProductId}`);
    }, 200);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        })
    }
  }, [messages])

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full mt-4">
        <MessageCircle className="mr-2" /> Chat with an Assistant
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Your AI Sales Assistant</SheetTitle>
            <SheetDescription>
              Ask me anything about the "{product.name}".
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-4 -mr-6" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
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
                        <Sparkles className="text-accent" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 max-w-[80%]',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
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
                        <Sparkles className="text-accent" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-3 py-2 bg-muted space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="flex-col gap-2 pt-4">
            <Button variant="outline" onClick={handleSimulateScan}>
              <QrCode className="mr-2 h-4 w-4" />
              Scan Another Item
            </Button>
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Is this waterproof?"
                disabled={isPending}
              />
              <Button type="submit" disabled={isPending || !input.trim()}>
                <Send />
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
