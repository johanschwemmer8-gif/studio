
'use client';

import { findProductById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Star, ShieldCheck, PlayCircle, Settings, ShieldAlert, RotateCcw, Info, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ProductChatbot from '@/components/product/product-chatbot';
import theme from '@/config/theme.json';
import SponsoredProduct from '@/components/product/sponsored-product';
import ShopperProfileCta from '@/components/shopper/shopper-profile-cta';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = findProductById(params.id);
  const { user } = useAuth();
  const { toast } = useToast();

  if (!product) {
    notFound();
  }

  const { optionalModules } = theme;

  const logContinuityEvent = async (type: string) => {
    if (!db) return;
    try {
        const interactionRef = doc(db, 'product_interactions', `${type}_${Date.now()}`);
        setDoc(interactionRef, {
            shopperId: user?.uid || 'guest',
            productId: product.id,
            retailerId: 'simulated-retailer-id',
            type: type,
            timestamp: serverTimestamp(),
            metadata: { productName: product.name, category: product.category }
        });
        
        if (user) {
            toast({ title: "Continuity Event Saved", description: `Your ${type.replace('_', ' ')} interaction is now part of your smart profile.` });
        }
    } catch (e) {
        console.error("Infrastructure friction:", e);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Mobile-First Header */}
        <div className="flex items-center justify-between mb-8">
            <Button asChild variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted">
                <Link href="/">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
            </Button>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10"><Heart className="h-5 w-5"/></Button>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10"><Share2 className="h-5 w-5"/></Button>
            </div>
        </div>

        <div className="space-y-8">
          {/* Main Visual Layer */}
          <div className="relative group">
            <div className="aspect-square relative rounded-3xl overflow-hidden border-4 border-card shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]">
              <Image
                src={product.image.src}
                alt={product.name}
                width={product.image.width}
                height={product.image.height}
                className="object-cover"
                data-ai-hint={product['data-ai-hint']}
                priority
              />
              <div className="absolute top-4 right-4">
                  <Badge className="bg-white/90 text-primary hover:bg-white shadow-sm font-black rounded-xl px-3 py-1 text-xs">
                      NEW ARRIVAL
                  </Badge>
              </div>
            </div>
          </div>

          {/* Identity & Discovery Layer */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <Badge variant="secondary" className="px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-lg border-primary/5">{product.category}</Badge>
                <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-black text-foreground">4.8</span>
                </div>
            </div>
            
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter leading-tight">{product.name}</h1>
                <p className="text-5xl font-black text-primary tracking-tighter">
                  R{product.price.toFixed(2)}
                </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed text-lg font-medium opacity-90">
                {product.description}
            </p>

            {/* Persistent Memory Module */}
            <ShopperProfileCta product={product} />

            {/* Continuity Action Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="justify-center gap-3 h-14 rounded-2xl border-2 font-bold transition-all hover:bg-primary/5" onClick={() => logContinuityEvent('reorder')}>
                    <RotateCcw className="h-5 w-5 text-primary" /> 1-Tap Reorder
                </Button>
                <Button variant="outline" className="justify-center gap-3 h-14 rounded-2xl border-2 font-bold transition-all hover:bg-primary/5" onClick={() => logContinuityEvent('tutorial_view')}>
                    <PlayCircle className="h-5 w-5 text-primary" /> Tutorials
                </Button>
                 <Button variant="outline" className="justify-center gap-3 h-14 rounded-2xl border-2 font-bold transition-all hover:bg-primary/5">
                    <Settings className="h-5 w-5 text-primary" /> Setup Guide
                </Button>
                 <Button variant="outline" className="justify-center gap-3 h-14 rounded-2xl border-2 font-bold transition-all hover:bg-primary/5" onClick={() => logContinuityEvent('warranty_activate')}>
                    <ShieldAlert className="h-5 w-5 text-primary" /> Warranty
                </Button>
            </div>

            {/* Decision Assistant Module */}
            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>

          {/* Intelligence Tab Layer */}
          <Tabs defaultValue="guidance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-muted/30 rounded-[2rem] border border-primary/5">
                <TabsTrigger value="guidance" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Guidance</TabsTrigger>
                <TabsTrigger value="lifecycle" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Continuity</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Social</TabsTrigger>
                <TabsTrigger value="specs" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Specs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="guidance" className="mt-8">
                <Card className="border-none bg-primary/5 shadow-none rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                                <Sparkles className="h-5 w-5 text-primary" />
                              </div>
                              <span className="font-black">Decision Intelligence</span>
                            </div>
                            {user && <Badge className="bg-green-500/10 text-green-700 border-green-500/20 uppercase text-[9px] font-black tracking-widest px-2">Memory Synced</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-5 bg-white/60 backdrop-blur-sm rounded-[1.5rem] italic text-sm font-medium leading-relaxed border border-primary/5">
                          {user ? 
                            `Welcome back, ${user.displayName}. Leveraging your lifecycle memory to provide specialized buying guidance.` : 
                            "Connect your Smart Profile to unlock persistent lifecycle features like reorder reminders and warranty tracking."}
                        </div>
                        <div className="grid gap-4">
                            <div className="flex gap-4 items-start">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0 shadow-sm" />
                              <p className="text-sm"><strong className="font-black">Lifecycle Phase:</strong> Exploration. Our AI indicates this fits your high-intensity usage pattern.</p>
                            </div>
                            <div className="flex gap-4 items-start">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0 shadow-sm" />
                              <p className="text-sm"><strong className="font-black">Continuity Factor:</strong> Shoppers who buy this typically reorder refills every 45 days.</p>
                            </div>
                            <div className="flex gap-4 items-start">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0 shadow-sm" />
                              <p className="text-sm"><strong className="font-black">Ecosystem Status:</strong> Verified genuine product with persistent digital warranty available.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="lifecycle" className="mt-8">
                 <Card className="border-none bg-muted/20 rounded-[2rem]">
                    <CardHeader><CardTitle className="font-black">Persistent Services</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="p-6 bg-white rounded-2xl text-center space-y-3 shadow-sm border border-primary/5">
                            <div className="h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                                <RotateCcw className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-black text-sm">Subscription</h4>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Auto-Refill: 30 Days</p>
                            <Button size="sm" className="w-full rounded-xl font-bold">Enable</Button>
                        </div>
                         <div className="p-6 bg-white rounded-2xl text-center space-y-3 shadow-sm border border-primary/5">
                            <div className="h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                                <PlayCircle className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-black text-sm">Tutorials</h4>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">4 Guided Modules</p>
                            <Button size="sm" variant="outline" className="w-full rounded-xl font-bold">Watch</Button>
                        </div>
                         <div className="p-6 bg-white rounded-2xl text-center space-y-3 shadow-sm border border-primary/5">
                            <div className="h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                                <ShieldAlert className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-black text-sm">Warranty</h4>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">24 Month Cover</p>
                            <Button size="sm" variant="outline" className="w-full rounded-xl font-bold">Activate</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
          
          {/* AI-Matched Recommendations */}
          {optionalModules.aiRecommendations && (
              <div className="mt-20">
                  <AiRecommendations product={product} />
              </div>
          )}

          {/* Media Monetisation Layer */}
          {optionalModules.retailMediaNetwork && <SponsoredProduct />}
        </div>
      </div>
    </div>
  );
}
