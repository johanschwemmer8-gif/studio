'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmbeddedChatProps = {
  isThumbnail?: boolean;
};

type Message = {
    role: 'user' | 'assistant';
    text: string;
};

export default function EmbeddedChat({ isThumbnail }: EmbeddedChatProps) {
  const [messages, setMessages] = useState<Message[]>([
      { role: 'assistant', text: 'Hi! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Thanks for your message! This is a simulated response.' }]);
    }, 1000);
  };

  if (isThumbnail) {
    return (
        <div className="w-full h-full bg-muted/30 rounded-md p-1 flex flex-col justify-end">
             <div className="flex items-center gap-1 p-0.5 rounded bg-background/50">
                <div className="flex-1 h-2 bg-muted rounded-sm" />
                <div className="h-3 w-3 bg-primary rounded-sm" />
            </div>
        </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background p-2 rounded-lg border">
        <div className="flex-1 space-y-2 overflow-y-auto pr-2">
            {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                     {msg.role === 'assistant' && <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Bot size={16} /></div>}
                     <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                        {msg.text}
                    </div>
                </div>
            ))}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t mt-2">
            <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="h-9"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                <Send size={16} />
            </Button>
        </form>
    </div>
  );
}
