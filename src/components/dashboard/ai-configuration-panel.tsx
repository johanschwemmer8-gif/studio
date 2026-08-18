
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  MessageSquare,
  Palette,
  Percent,
  PlusCircle,
  Save,
  Send,
  Settings,
  Sparkles,
  Zap,
  TrendingUp,
  Gift,
  ImageIcon,
  Languages,
  Link2,
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
import { Skeleton } from '../ui/skeleton';

// Define Zod schema for form validation
const formSchema = z.object({
  assistantName: z.string().default('Store Assistant'),
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
  welcomeMessage: z.string().max(200).default('Hi there! How can I help you with this product?'),
  faqCategories: z.array(z.string()).default(['product-information', 'store-policies']),
  enableHandoff: z.boolean().default(false),
  webhookUrl: z.string().optional(),
  escalationKeywords: z.string().optional(),
  ecommercePlatform: z.string().default('shopify'),
});

type FormValues = z.infer<typeof formSchema>;

// Right Panel: Live Preview & Testing
function LivePreviewPanel({ config }: { config: FormValues }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversation, setConversation] = useState(sampleConversation);
  const [isReplying, setIsReplying] = useState(false);
  const [selectedQr, setSelectedQr] = useState(sampleQrCodes[0].id);

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
        <CardDescription>See your AI configuration through the customer's eyes.</CardDescription>
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
                  
                  {/* Recommendations Preview */}
                   <div className="bg-muted p-3 rounded-lg my-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3 text-accent" /> Buying Guidance</h4>
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

                   {/* Promotional Offer Preview */}
                   <div className="border-2 border-dashed border-accent/50 bg-accent/5 p-3 rounded-lg my-4 text-center">
                        <h4 className="text-[10px] font-black flex items-center gap-2 justify-center text-accent-foreground uppercase tracking-widest"><Gift className="h-3 w-3" /> {sampleOffer.name}</h4>
                        <p className="text-[9px] mt-1 text-muted-foreground">{sampleOffer.description}</p>
                    </div>
                  
                  {/* Chat Preview */}
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
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center self-start"><Bot className="h-4 w-4 text-white" /></div>
                            <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-muted border border-primary/5 flex items-center gap-1">
                                <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    }
                  </div>
                </div>
              </ScrollArea>
            </PhoneMockup>
          </div>
           <Separator />
           {/* Bottom 40%: Testing */}
           <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> AI Sandbox</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedQr} onValueChange={setSelectedQr}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select QR..." /></SelectTrigger>
                      <SelectContent>
                        {sampleQrCodes.map(qr => <SelectItem key={qr.id} value={qr.id}>{qr.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                     <Select defaultValue="new-customer">
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Scenario..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-customer">New Customer</SelectItem>
                        <SelectItem value="returning-customer">Returning Customer</SelectItem>
                        <SelectItem value="vip-customer">VIP Customer</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Input placeholder="Ask AI a test question..." value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="h-9 text-sm" />
                    <Button onClick={handleSendMessage} size="sm"><Send className="h-4 w-4"/></Button>
                </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function AIConfigurationPanel() {
  const { watch, control, register, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assistantName: 'Store Assistant',
      personality: 'Friendly & Casual',
      tone: 'Conversational',
      language: 'en',
      recommendationStrategy: 'ai-personalized',
      recommendationCount: 3,
      includePrice: true,
      showAvailability: true,
      recommendationTrigger: 'immediate',
      welcomeMessage: 'Hi there! How can I help you with this product?',
      faqCategories: ['product-information', 'store-policies'],
      enableHandoff: false,
      ecommercePlatform: 'shopify',
    }
  });

  const watchedConfig = watch();
  const [showCustomPersonality, setShowCustomPersonality] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  
  const handlePersonalityChange = (value: string) => {
    setValue('personality', value);
    setShowCustomPersonality(value === 'Custom');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Left Panel: Configuration */}
      <div className="space-y-6">
        {/* Section 1: AI Personality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> AI Personality</CardTitle>
            <CardDescription>Define how your assistant sounds and interacts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assistant-name">Display Name</Label>
                <Input id="assistant-name" {...register('assistantName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personality">Base Personality</Label>
                <Select onValueChange={handlePersonalityChange} value={watchedConfig.personality}>
                  <SelectTrigger id="personality"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional & Helpful">Professional & Helpful</SelectItem>
                    <SelectItem value="Friendly & Casual">Friendly & Casual</SelectItem>
                    <SelectItem value="Expert & Knowledgeable">Expert & Knowledgeable</SelectItem>
                    <SelectItem value="Enthusiastic & Energetic">Enthusiastic & Energetic</SelectItem>
                    <SelectItem value="Custom">Custom Prompt...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {showCustomPersonality && (
              <div className="space-y-2">
                <Label htmlFor="custom-personality">System Instructions (Personality)</Label>
                <Textarea id="custom-personality" {...register('customPersonality')} placeholder="e.g., You are a luxury concierge who values discretion and heritage..."/>
              </div>
            )}
             <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Preferred Tone</Label>
                    <Controller name="tone" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Formal" id="t-formal"/><Label htmlFor="t-formal" className="font-normal">Formal</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Conversational" id="t-convo"/><Label htmlFor="t-convo" className="font-normal">Conversational</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Warm & Personal" id="t-warm"/><Label htmlFor="t-warm" className="font-normal">Warm & Personal</Label></div>
                        </RadioGroup>
                    )}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="language">Primary Language</Label>
                    <Select {...register('language')}>
                        <SelectTrigger id="language"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="en">English (Global)</SelectItem><SelectItem value="af">Afrikaans</SelectItem><SelectItem value="zu">Zulu</SelectItem><SelectItem value="xh">Xhosa</SelectItem></SelectContent>
                    </Select>
                </div>
             </div>
              <div className="space-y-2">
                <Label htmlFor="brand-voice">Brand Voice Alignment</Label>
                <Textarea id="brand-voice" {...register('brandVoice')} placeholder="Describe specific phrases to use or avoid..."/>
              </div>
          </CardContent>
        </Card>

        {/* Section 2: Strategy & Triggers */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/> AI Strategy & Triggers</CardTitle>
                <CardDescription>Control when and what information is provided.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="recommendations" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="recommendations" title="Recommendations"><Sparkles className="h-4 w-4"/></TabsTrigger>
                        <TabsTrigger value="chat" title="Chat Interface"><MessageSquare className="h-4 w-4"/></TabsTrigger>
                        <TabsTrigger value="promotions" title="Promotional Offers"><Gift className="h-4 w-4"/></TabsTrigger>
                        <TabsTrigger value="cross-sell" title="Business Growth"><TrendingUp className="h-4 w-4"/></TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="recommendations" className="pt-4 space-y-6">
                        <div className="space-y-3">
                            <Label className="font-bold">Recommendation Logic</Label>
                            <RadioGroup {...register('recommendationStrategy')} className="flex flex-col gap-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="similar" id="r-sim"/><Label htmlFor="r-sim" className="font-normal">Similar products (same category)</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="complementary" id="r-comp"/><Label htmlFor="r-comp" className="font-normal">Complementary items (cross-sell)</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="popular" id="r-pop"/><Label htmlFor="r-pop" className="font-normal">Popular in this store location</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="ai-personalized" id="r-ai"/><Label htmlFor="r-ai" className="font-normal">AI-powered (Personalized per shopper)</Label></div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-4">
                            <Label>Maximum items to show: {watchedConfig.recommendationCount}</Label>
                            <Controller name="recommendationCount" control={control} render={({ field }) => (
                                <Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} min={1} max={6} step={1} />
                            )}/>
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                            <div className="flex items-center justify-between border-b pb-2"><Label htmlFor="inc-price">Display item prices</Label><Controller name="includePrice" control={control} render={({ field }) => (<Switch id="inc-price" checked={field.value} onCheckedChange={field.onChange}/>)}/></div>
                            <div className="flex items-center justify-between border-b pb-2"><Label htmlFor="show-avail">Display stock availability</Label><Controller name="showAvailability" control={control} render={({ field }) => (<Switch id="show-avail" checked={field.value} onCheckedChange={field.onChange}/>)}/></div>
                        </div>
                    </TabsContent>

                    <TabsContent value="chat" className="pt-4 space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="welcome-msg">First-Scan Welcome Message (Max 200)</Label>
                            <Textarea id="welcome-msg" {...register('welcomeMessage')} rows={3} />
                         </div>
                         <div className="space-y-2">
                            <Label>AI Knowledge Base Categories</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {(['Product Specs', 'Store Policies', 'Payment Info', 'Live Promotions', 'Warranty', 'Usage Guides']).map(cat => (
                                    <div key={cat} className="flex items-center space-x-2"><Checkbox id={`faq-${cat}`} defaultChecked /><Label htmlFor={`faq-${cat}`} className="font-normal text-xs">{cat}</Label></div>
                                ))}
                            </div>
                         </div>
                         <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                            <div className="space-y-0.5">
                                <Label htmlFor="enable-handoff">Enable Staff Handoff</Label>
                                <p className="text-[10px] text-muted-foreground">Alert store manager for complex queries.</p>
                            </div>
                            <Controller name="enableHandoff" control={control} render={({ field }) => (<Switch id="enable-handoff" checked={field.value} onCheckedChange={field.onChange}/>)}/>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="promotions" className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="font-bold">Dynamic Offer Delivery</Label>
                            <Card className='bg-muted/30 border-dashed'>
                                <CardContent className="flex flex-col items-center justify-center p-8 text-center gap-3">
                                    <Gift className="h-8 w-8 text-muted-foreground/50" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">No active promotions linked to AI.</p>
                                        <p className="text-xs text-muted-foreground">AI can automatically suggest coupons based on sentiment.</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/>Create AI-Driven Offer</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="cross-sell" className="pt-4 space-y-4">
                         <div className="space-y-3">
                            <Label className="font-bold">Growth Modules</Label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-lg"><div className="space-y-0.5"><Label>Product Bundling</Label><p className="text-[10px] text-muted-foreground">Suggest kits and sets.</p></div><Switch defaultChecked /></div>
                                <div className="flex items-center justify-between p-3 border rounded-lg"><div className="space-y-0.5"><Label>Seasonal Intelligence</Label><p className="text-[10px] text-muted-foreground">Auto-adjust triggers by season.</p></div><Switch defaultChecked /></div>
                                <div className="flex items-center justify-between p-3 border rounded-lg"><div className="space-y-0.5"><Label>Conversion A/B Testing</Label><p className="text-[10px] text-muted-foreground">Test different AI tones for ROI.</p></div><Switch /></div>
                            </div>
                         </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
        
         {/* Section 3: Integration */}
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="text-primary"/> Data Integration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="platform">E-commerce / PIM Source</Label>
                    <Select {...register('ecommercePlatform')}>
                        <SelectTrigger id="platform"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="shopify">Shopify</SelectItem><SelectItem value="woocommerce">WooCommerce</SelectItem><SelectItem value="custom">Custom API Feed</SelectItem><SelectItem value="csv">Static CSV Upload</SelectItem></SelectContent>
                    </Select>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs font-semibold">Connection Status</p>
                    <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-50">SYNCED & ACTIVE</Badge>
                 </div>
            </CardContent>
        </Card>
      </div>

      {/* Right Panel: Live Preview */}
      <div>
        <LivePreviewPanel config={watchedConfig} />
      </div>

      {/* Bottom Action Bar */}
      <div className="lg:col-span-2 flex flex-wrap gap-2 justify-end sticky bottom-0 bg-background/90 backdrop-blur-md p-6 border-t -mx-8 -mb-8 z-50">
        <Button variant="ghost" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Reset Defaults</Button>
        <Button variant="outline" onClick={() => setIsAdvancedSettingsOpen(true)} className="gap-2 font-bold uppercase text-[10px] tracking-widest"><Settings className="h-4 w-4"/>Model Advanced</Button>
        <Button variant="default" className="gap-2 font-black uppercase text-[10px] tracking-widest px-12 shadow-xl"><Save className="h-4 w-4"/>Save AI Ecosystem</Button>
      </div>

        {/* Advanced Settings Modal */}
        <Dialog open={isAdvancedSettingsOpen} onOpenChange={setIsAdvancedSettingsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>AI Model Management</DialogTitle></DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="space-y-3">
                         <Label className="font-bold">Intelligence Engine Selection</Label>
                         <RadioGroup defaultValue="gpt-3.5" className="grid gap-3">
                            <div className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-muted/50"><RadioGroupItem value="gpt-3.5" id="m-fast"/><Label htmlFor="m-fast" className="flex-1 cursor-pointer"><div className="font-bold">Gemini 2.5 Flash</div><div className="text-xs text-muted-foreground">Balanced speed and cost-effective guidance.</div></Label><Badge variant="outline">Recommended</Badge></div>
                            <div className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-muted/50"><RadioGroupItem value="gpt-4" id="m-adv"/><Label htmlFor="m-adv" className="flex-1 cursor-pointer"><div className="font-bold">Gemini 4 PRO</div><div className="text-xs text-muted-foreground">Deep analysis for luxury or high-complexity products.</div></Label></div>
                        </RadioGroup>
                    </div>
                </div>
                 <DialogFooter>
                    <Button onClick={() => setIsAdvancedSettingsOpen(false)}>Apply to Network</Button>
                 </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
