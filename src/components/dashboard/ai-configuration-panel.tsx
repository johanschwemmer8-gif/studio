
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  MessageSquare,
  Palette,
  PlusCircle,
  Save,
  Send,
  Settings,
  Sparkles,
  Zap,
  TrendingUp,
  Gift,
  ImageIcon,
  Link2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PhoneMockup from './phone-mockup';
import { sampleQrCodes, sampleProducts, sampleConversation, sampleRecommendations, sampleOffer } from '@/lib/ai-config-data';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { saveAiConfig } from '@/ai/flows/save-ai-config';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  assistantName: z.string().default('Ari'),
  personality: z.string().default('Friendly & Casual'),
  customPersonality: z.string().optional(),
  tone: z.string().default('Conversational'),
  language: z.string().default('en'),
  brandVoice: z.string().optional(),
  recommendationStrategy: z.string().default('ai-personalized'),
  recommendationCount: z.number().min(1).max(6).default(3),
  includePrice: z.boolean().default(true),
  showAvailability: z.boolean().default(true),
  recommendationTrigger: z.string().default('immediate'),
  welcomeMessage: z.string().max(200).default('Hi! I\'m Ari. How can I help you with this product today?'),
  faqCategories: z.array(z.string()).default(['Product Specs', 'Store Policies']),
  enableHandoff: z.boolean().default(false),
  ecommercePlatform: z.string().default('shopify'),
});

type FormValues = z.infer<typeof formSchema>;

function LivePreviewPanel({ config }: { config: FormValues }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversation, setConversation] = useState(sampleConversation);
  const [isReplying, setIsReplying] = useState(false);

  const handleSendMessage = () => {
    if (!currentMessage) return;
    setConversation(prev => [...prev, { role: 'user', content: currentMessage }]);
    setCurrentMessage('');
    setIsReplying(true);
    setTimeout(() => {
      setConversation(prev => [...prev, { role: 'assistant', content: `Based on your question and my ${config.personality?.toLowerCase()} personality, here's my thoughtful response.` }]);
      setIsReplying(false);
    }, 1500);
  };
  
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Live Mobile Preview</CardTitle>
        <CardDescription>See your Ari configuration through the customer's eyes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-center">
            <PhoneMockup>
              <ScrollArea className="h-full">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold truncate">{sampleProducts[0].name}</h3>
                      <p className="text-[10px] text-muted-foreground">{sampleProducts[0].category}</p>
                    </div>
                  </div>
                  
                   <div className="bg-muted p-3 rounded-lg my-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3 text-accent" /> {config.assistantName}'s Guidance</h4>
                        <div className="space-y-2">
                            {sampleRecommendations.slice(0, config.recommendationCount).map(rec => (
                                <div key={rec.id} className="flex items-center gap-2 text-[10px]">
                                    <div className="h-8 w-8 rounded-sm bg-background border flex items-center justify-center shrink-0">
                                        <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <p className="font-bold truncate">{rec.name}</p>
                                        {config.includePrice && <p className="text-muted-foreground">R{rec.price}</p>}
                                    </div>
                                    {config.showAvailability && <Badge variant={rec.available ? 'secondary' : 'outline'} className="text-[8px] h-4 px-1">{rec.available ? 'Stock' : 'Out'}</Badge>}
                                </div>
                            ))}
                        </div>
                    </div>

                  <div className="space-y-3">
                    {conversation.map((msg, i) => (
                      <div key={i} className={cn('flex items-end gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        {msg.role === 'assistant' && <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center self-start shadow-sm"><Bot className="h-4 w-4 text-white" /></div>}
                        <div className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed', msg.role === 'user' ? 'bg-primary text-white shadow-md' : 'bg-muted border border-primary/5')}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isReplying && 
                        <div className="flex items-end gap-2 justify-start">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center self-start shadow-md"><Bot className="h-4 w-4 text-white" /></div>
                            <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-muted border border-primary/5 flex items-center gap-1">
                                <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce"></span>
                                <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]"></span>
                                <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]"></span>
                            </div>
                        </div>
                    }
                  </div>
                </div>
              </ScrollArea>
            </PhoneMockup>
          </div>
           <Separator />
           <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> AI Sandbox</h3>
                <div className="flex gap-2">
                    <Input placeholder="Ask a test question..." value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} className="h-9 text-sm" />
                    <Button onClick={handleSendMessage} size="sm"><Send className="h-4 w-4"/></Button>
                </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AIConfigurationPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assistantName: 'Ari',
      personality: 'Friendly & Casual',
      tone: 'Conversational',
      language: 'en',
      recommendationStrategy: 'ai-personalized',
      recommendationCount: 3,
      includePrice: true,
      showAvailability: true,
      welcomeMessage: 'Hi! I\'m Ari. How can I help you with this product today?',
      faqCategories: ['Product Specs', 'Store Policies'],
      enableHandoff: false,
    }
  });

  const watchedConfig = form.watch();

  useEffect(() => {
      if (!user?.retailerId || !db) return;
      const q = doc(db, 'configurations', `${user.retailerId}_ai`);
      const unsub = onSnapshot(q, (snap) => {
          if (snap.exists()) {
              form.reset(snap.data().data);
          }
      });
      return () => unsub();
  }, [user?.retailerId, form]);

  const handleSave = async () => {
    if (!user?.retailerId) return;
    setIsSaving(true);
    try {
        const idToken = await user.getIdToken();
        const res = await saveAiConfig({
            idToken,
            retailerId: user.retailerId,
            config: form.getValues()
        });
        if (res.success) {
            toast({ title: "Ari Updated", description: res.message });
        }
    } catch (e: any) {
        toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start pb-20">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> AI Personality</CardTitle>
            <CardDescription>Define how your assistant sounds and interacts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assistant-name">Display Name</Label>
                <Input id="assistant-name" {...form.register('assistantName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personality">Base Personality</Label>
                <Controller name="personality" control={form.control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Professional & Helpful">Professional & Helpful</SelectItem>
                            <SelectItem value="Friendly & Casual">Friendly & Casual</SelectItem>
                            <SelectItem value="Expert & Knowledgeable">Expert & Knowledgeable</SelectItem>
                            <SelectItem value="Enthusiastic & Energetic">Enthusiastic & Energetic</SelectItem>
                        </SelectContent>
                    </Select>
                )}/>
              </div>
            </div>
             <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Preferred Tone</Label>
                    <Controller name="tone" control={form.control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Formal" id="t-formal"/><Label htmlFor="t-formal" className="font-normal">Formal</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Conversational" id="t-convo"/><Label htmlFor="t-convo" className="font-normal">Conversational</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Warm & Personal" id="t-warm"/><Label htmlFor="t-warm" className="font-normal">Warm & Personal</Label></div>
                        </RadioGroup>
                    )}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="language">Primary Language</Label>
                    <Select {...form.register('language')}>
                        <SelectTrigger id="language"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="en">English (Global)</SelectItem><SelectItem value="af">Afrikaans</SelectItem><SelectItem value="zu">Zulu</SelectItem></SelectContent>
                    </Select>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/> Strategy & Strategy</CardTitle>
                <CardDescription>Control recommendation and engagement triggers.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="recommendations" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                        <TabsTrigger value="chat">Chat Experience</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="recommendations" className="pt-4 space-y-6">
                        <div className="space-y-3">
                            <Label className="font-bold">Recommendation Logic</Label>
                            <Controller name="recommendationStrategy" control={form.control} render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="similar" id="r-sim"/><Label htmlFor="r-sim" className="font-normal">Similar products</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="ai-personalized" id="r-ai"/><Label htmlFor="r-ai" className="font-normal">AI-powered (Personalized)</Label></div>
                                </RadioGroup>
                            )}/>
                        </div>
                        <div className="space-y-4">
                            <Label>Items to show: {watchedConfig.recommendationCount}</Label>
                            <Controller name="recommendationCount" control={form.control} render={({ field }) => (
                                <Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} min={1} max={6} step={1} />
                            )}/>
                        </div>
                    </TabsContent>

                    <TabsContent value="chat" className="pt-4 space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="welcome-msg">Welcome Message (Max 200)</Label>
                            <Textarea id="welcome-msg" {...form.register('welcomeMessage')} rows={3} />
                         </div>
                         <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                            <Label htmlFor="enable-handoff" className="text-xs">Enable Human Handoff</Label>
                            <Controller name="enableHandoff" control={form.control} render={({ field }) => (<Switch id="enable-handoff" checked={field.value} onCheckedChange={field.onChange}/>)}/>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </div>

      <div>
        <LivePreviewPanel config={watchedConfig} />
      </div>

      <div className="lg:col-span-2 flex justify-end sticky bottom-0 bg-background/90 backdrop-blur-md p-6 border-t -mx-8 -mb-8 z-50 shadow-2xl">
        <Button onClick={handleSave} disabled={isSaving} className="font-black uppercase text-xs tracking-widest px-12 h-12 shadow-xl gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
            Save Ari Ecosystem
        </Button>
      </div>
    </div>
  );
}
