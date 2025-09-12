
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  Bot,
  Calendar,
  ChevronDown,
  Circle,
  Eye,
  FileJson,
  Gift,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  Languages,
  Link2,
  MessageSquare,
  Palette,
  Percent,
  Play,
  PlusCircle,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Zap,
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
        <CardTitle>Live Preview & Testing</CardTitle>
        <CardDescription>See your AI configuration in action.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Top 60%: Preview */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <PhoneMockup>
              <ScrollArea className="h-full">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{sampleProducts[0].name}</h3>
                      <p className="text-sm text-muted-foreground">{sampleProducts[0].category}</p>
                    </div>
                  </div>
                  
                  {/* Recommendations Preview */}
                   <div className="bg-muted p-3 rounded-lg my-4">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Sparkles className="h-4 w-4 text-accent" /> You Might Also Like...</h4>
                        <div className="space-y-2">
                            {sampleRecommendations.slice(0, config.recommendationCount).map(rec => (
                                <div key={rec.id} className="flex items-center gap-2 text-xs">
                                    <img src={rec.image} alt={rec.name} className="h-8 w-8 rounded-sm object-cover"/>
                                    <div className='flex-1'>
                                        <p className="font-medium truncate">{rec.name}</p>
                                        {config.includePrice && <p className="text-muted-foreground">R{rec.price}</p>}
                                    </div>
                                    {config.showAvailability && <Badge variant={rec.available ? 'default' : 'destructive'} className={cn(rec.available && 'bg-success text-white')}>{rec.available ? 'In Stock' : 'Out'}</Badge>}
                                </div>
                            ))}
                        </div>
                    </div>

                   {/* Promotional Offer Preview */}
                   <div className="border-2 border-dashed border-accent text-accent p-3 rounded-lg my-4 text-center">
                        <h4 className="font-bold flex items-center gap-2 justify-center"><Gift className="h-4 w-4" /> {sampleOffer.name}</h4>
                        <p className="text-xs mt-1">{sampleOffer.description}</p>
                    </div>
                  
                  {/* Chat Preview */}
                  <div className="space-y-3">
                    {conversation.map((msg, i) => (
                      <div key={i} className={cn('flex items-end gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        {msg.role === 'assistant' && <Bot className="h-6 w-6 text-primary self-start" />}
                        <p className={cn('max-w-[80%] rounded-lg px-3 py-2 text-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                          {msg.content}
                        </p>
                      </div>
                    ))}
                    {isReplying && 
                        <div className="flex items-end gap-2 justify-start">
                            <Bot className="h-6 w-6 text-primary self-start" />
                            <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted"><Skeleton className="h-4 w-24"/></div>
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
                <h3 className="font-semibold text-center">Testing Suite</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedQr} onValueChange={setSelectedQr}>
                      <SelectTrigger><SelectValue placeholder="Select QR..." /></SelectTrigger>
                      <SelectContent>
                        {sampleQrCodes.map(qr => <SelectItem key={qr.id} value={qr.id}>{qr.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                     <Select defaultValue="new-customer">
                      <SelectTrigger><SelectValue placeholder="Select Scenario..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-customer">New Customer</SelectItem>
                        <SelectItem value="returning-customer">Returning Customer</SelectItem>
                        <SelectItem value="vip-customer">VIP Customer</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Input placeholder="Send test message..." value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()}/>
                    <Button onClick={handleSendMessage}><Send className="h-4 w-4"/></Button>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setConversation([])}>Reset Conversation</Button>
                    <span>AI Response Time: 1.2s</span>
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
  const personality = watch('personality');

  useState(() => {
    setShowCustomPersonality(personality === 'Custom');
  });

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
            <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> AI Personality Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assistant-name">AI Assistant Name</Label>
                <Input id="assistant-name" {...register('assistantName')} />
              </div>
              <div>
                <Label htmlFor="personality">Personality</Label>
                <Select onValueChange={handlePersonalityChange} value={watchedConfig.personality}>
                  <SelectTrigger id="personality"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional & Helpful">Professional & Helpful</SelectItem>
                    <SelectItem value="Friendly & Casual">Friendly & Casual</SelectItem>
                    <SelectItem value="Expert & Knowledgeable">Expert & Knowledgeable</SelectItem>
                    <SelectItem value="Enthusiastic & Energetic">Enthusiastic & Energetic</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {showCustomPersonality && (
              <div>
                <Label htmlFor="custom-personality">Custom Personality Description</Label>
                <Textarea id="custom-personality" {...register('customPersonality')} placeholder="e.g., A witty robot sidekick who loves fashion..."/>
              </div>
            )}
             <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <Label>Tone</Label>
                    <Controller name="tone" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="mt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="Formal" id="t-formal"/><Label htmlFor="t-formal">Formal</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Conversational" id="t-convo"/><Label htmlFor="t-convo">Conversational</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Warm & Personal" id="t-warm"/><Label htmlFor="t-warm">Warm & Personal</Label></div></RadioGroup>
                    )}/>
                </div>
                <div>
                    <Label htmlFor="language">Language</Label>
                    <Select {...register('language')}>
                        <SelectTrigger id="language"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="af">Afrikaans</SelectItem><SelectItem value="zu">Zulu</SelectItem><SelectItem value="xh">Xhosa</SelectItem></SelectContent>
                    </Select>
                </div>
             </div>
              <div>
                <Label htmlFor="brand-voice">Brand Voice</Label>
                <Textarea id="brand-voice" {...register('brandVoice')} placeholder="Describe your brand's communication style..."/>
              </div>
          </CardContent>
        </Card>

        {/* Section 2: Interaction Triggers */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/> Interaction Triggers</CardTitle>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="recommendations" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="recommendations"><Sparkles className="h-4 w-4"/></TabsTrigger>
                        <TabsTrigger value="chat"><MessageSquare className="h-4 w-4"/></TabsTrigger>
                        <TabsTrigger value="promotions"><Gift className="h-4 w-4"/></TabsTrigger>
                        <TabsTrigger value="cross-sell"><TrendingUp className="h-4 w-4"/></TabsTrigger>
                    </TabsList>
                    <TabsContent value="recommendations" className="pt-4 space-y-4">
                        <h4 className="font-semibold">Product Recommendations</h4>
                        <RadioGroup {...register('recommendationStrategy')}>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="similar" id="r-sim"/><Label htmlFor="r-sim">Similar products (category)</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="complementary" id="r-comp"/><Label htmlFor="r-comp">Complementary items (cross-sell)</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="popular" id="r-pop"/><Label htmlFor="r-pop">Popular in store (bestsellers)</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="price-upsell" id="r-price"/><Label htmlFor="r-price">Price-based upsell</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="ai-personalized" id="r-ai"/><Label htmlFor="r-ai">AI-powered personalized</Label></div>
                        </RadioGroup>
                        <div>
                            <Label>Number of recommendations: {watchedConfig.recommendationCount}</Label>
                            <Controller name="recommendationCount" control={control} render={({ field }) => (
                                <Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} min={1} max={6} step={1} />
                            )}/>
                        </div>
                        <div className="flex items-center space-x-2"><Controller name="includePrice" control={control} render={({ field }) => (<Switch id="inc-price" checked={field.value} onCheckedChange={field.onChange}/>)}/><Label htmlFor="inc-price">Include price</Label></div>
                        <div className="flex items-center space-x-2"><Controller name="showAvailability" control={control} render={({ field }) => (<Switch id="show-avail" checked={field.value} onCheckedChange={field.onChange}/>)}/><Label htmlFor="show-avail">Show availability</Label></div>
                    </TabsContent>
                     <TabsContent value="chat" className="pt-4 space-y-4">
                        <h4 className="font-semibold">Customer Service Chat</h4>
                         <div>
                            <Label htmlFor="welcome-msg">Welcome Message (Max 200)</Label>
                            <Textarea id="welcome-msg" {...register('welcomeMessage')}/>
                         </div>
                         <div>
                            <Label>FAQ Categories</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {(['Product information', 'Store policies', 'Store hours', 'Payment methods', 'Promotions', 'Availability']).map(cat => (
                                    <div key={cat} className="flex items-center space-x-2"><Checkbox id={`faq-${cat}`}/><Label htmlFor={`faq-${cat}`} className="font-normal">{cat}</Label></div>
                                ))}
                            </div>
                         </div>
                         <div className="flex items-center space-x-2"><Controller name="enableHandoff" control={control} render={({ field }) => (<Switch id="enable-handoff" checked={field.value} onCheckedChange={field.onChange}/>)}/><Label htmlFor="enable-handoff">Enable human handoff</Label></div>

                    </TabsContent>
                    <TabsContent value="promotions" className="pt-4 space-y-4">
                        <h4 className="font-semibold">Promotional Offers</h4>
                        <Card className='bg-muted/50'>
                            <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Active Promotions</CardTitle><Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add</Button></CardHeader>
                            <CardContent>
                                <p className="text-sm text-center text-muted-foreground py-4">No active promotions.</p>
                            </CardContent>
                        </Card>
                         <div>
                            <Label>Personalization Level</Label>
                            <Slider defaultValue={[50]}/>
                         </div>
                    </TabsContent>
                    <TabsContent value="cross-sell" className="pt-4 space-y-4">
                         <h4 className="font-semibold">Cross-sell & Upsell</h4>
                         <div className="flex items-center space-x-2"><Switch id="bundle-rec"/><Label htmlFor="bundle-rec">Bundle recommendations</Label></div>
                         <div className="flex items-center space-x-2"><Switch id="seasonal-rec"/><Label htmlFor="seasonal-rec">Seasonal recommendations</Label></div>
                          <div className="flex items-center space-x-2"><Switch id="ab-testing"/><Label htmlFor="ab-testing">A/B test different approaches</Label></div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
        
         {/* Section 3: E-commerce Integration */}
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="text-primary"/> E-commerce Integration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select {...register('ecommercePlatform')}>
                        <SelectTrigger id="platform"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="shopify">Shopify</SelectItem><SelectItem value="woocommerce">WooCommerce</SelectItem><SelectItem value="custom">Custom API</SelectItem><SelectItem value="csv">CSV Import</SelectItem><SelectItem value="manual">Manual Management</SelectItem></SelectContent>
                    </Select>
                 </div>
                 <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="store-url">Store URL</Label><Input id="store-url"/></div>
                    <div><Label htmlFor="api-key">API Key</Label><Input id="api-key" type="password"/></div>
                 </div>
                 <div className="flex items-center justify-between"><Button variant="secondary">Test Connection</Button><Badge variant="outline" className="text-yellow-600 border-yellow-500/30">Not Connected</Badge></div>
            </CardContent>
        </Card>
      </div>

      {/* Right Panel: Live Preview */}
      <div>
        <LivePreviewPanel config={watchedConfig} />
      </div>

      {/* Bottom Action Bar */}
      <div className="lg:col-span-2 flex flex-wrap gap-2 justify-end sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t -mx-8 -mb-8">
        <Button variant="default"><Save className="mr-2 h-4 w-4"/>Save Configuration</Button>
        <Button variant="outline">Apply to Selected QRs</Button>
        <Button variant="outline" onClick={() => setIsAdvancedSettingsOpen(true)}><Settings className="mr-2 h-4 w-4"/>Advanced</Button>
      </div>

        {/* Advanced Settings Modal */}
        <Dialog open={isAdvancedSettingsOpen} onOpenChange={setIsAdvancedSettingsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Advanced Settings</DialogTitle></DialogHeader>
                <div className="py-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">AI Model Selection</CardTitle></CardHeader>
                        <CardContent>
                             <RadioGroup defaultValue="gpt-3.5">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="gpt-3.5" id="m-fast"/><Label htmlFor="m-fast">Gemini 2.5 Flash (Fast, Cost-effective)</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="gpt-4" id="m-adv"/><Label htmlFor="m-adv">Gemini 4 (Advanced, Higher cost)</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="m-custom"/><Label htmlFor="m-custom">Custom Fine-tuned Model</Label></div>
                            </RadioGroup>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Analytics & Tracking</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <div className="flex items-center space-x-2"><Switch id="log-interactions"/><Label htmlFor="log-interactions">Enable detailed interaction logging</Label></div>
                             <div className="flex items-center space-x-2"><Switch id="perf-monitor"/><Label htmlFor="perf-monitor">Enable performance monitoring</Label></div>
                        </CardContent>
                    </Card>
                </div>
                 <DialogFooter>
                    <Button onClick={() => setIsAdvancedSettingsOpen(false)}>Save & Close</Button>
                 </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
