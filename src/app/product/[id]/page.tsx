
'use client';

import { findProductById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { 
    ArrowLeft, Sparkles, Star, ShieldCheck, PlayCircle, Settings, 
    ShieldAlert, RotateCcw, Info, Share2, Heart, ShoppingCart, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ProductChatbot from '@/components/product/product-chatbot';
import theme from '@/config/theme.json';
import SponsoredProduct from '@/components/product/sponsored-product';
import ShopperProfileCta from '@/components/shopper/shopper-profile-cta';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = findProductById(params.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  if (!product) {
    notFound();
  }

  const { optionalModules } = theme;

  const handleAddToTrolley = async () => {
      if (!user) {
          toast({ title: "Identification Required", description: "Please identify yourself to use the Virtual Smart Trolley." });
          return;
      }
      if (!db) return;

      setIsAdding(true);
      try {
          const basketId = `basket_${user.uid}`;
          const basketRef = doc(db, 'baskets', basketId);
          const basketDoc = await getDoc(basketRef);

          const item = {
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
              addedAt: new Date().toISOString(),
          };

          if (!basketDoc.exists()) {
              await setDoc(basketRef, {
                  basketId,
                  shopperId: user.uid,
                  retailerId: 'simulated-retailer-id',
                  items: [item],
                  total: product.price,
                  status: 'active',
                  updatedAt: serverTimestamp(),
              });
          } else {
              await updateDoc(basketRef, {
                  items: arrayUnion(item),
                  total: increment(product.price),
                  updatedAt: serverTimestamp(),
              });
          }

          const interactionRef = doc(db, 'product_interactions', `trolley_${Date.now()}`);
          setDoc(interactionRef, {
              shopperId: user.uid,
              productId: product.id,
              type: 'add_to_trolley',
              timestamp: serverTimestamp(),
              metadata: { productName: product.name }
          });

          toast({ 
              title: "Added to Trolley", 
              description: `"${product.name}" is now in your digital basket.`,
              action: (
                  <Button asChild size="sm" variant="outline">
                      <Link href="/shopper/basket">View Basket</Link>
                  </Button>
              )
          });
      } catch (e) {
          console.error("Trolley Sync Friction:", e);
      } finally {
          setIsAdding(false);
      }
  };

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
    <div className="min-h-screen bg-background pb-32">
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
                <Button asChild variant="ghost" size="icon" className="rounded-full h-10 w-10 relative">
                    <Link href="/shopper/basket">
                        <ShoppingCart className="h-5 w-5"/>
                    </Link>
                </Button>
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
            </div>
          </div>

          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <Badge variant="secondary" className="px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-lg border-primary/5">{product.category}</Badge>
                <div className="flex items-center gap-1.5 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-black text-foreground">4.8</span>
                </div>
            </div>
            
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter leading-tight">{product.name}</h1>
                <p className="text-5xl font-black text-primary tracking-tighter">
                  R{product.price.toFixed(2)}
                </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed text-lg font-medium opacity-90">
                {product.description}
            </p>

            {/* PERSISTENT ACTION BAR (MOBILE POS) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-50 flex items-center justify-center">
                 <div className="w-full max-w-3xl flex gap-4">
                     <Button 
                        size="lg" 
                        onClick={handleAddToTrolley} 
                        disabled={isAdding}
                        className="flex-1 h-14 rounded-2xl text-lg font-black gap-3 shadow-2xl bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                        {isAdding ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShoppingCart className="h-6 w-6" />}
                        Add to Smart Trolley
                    </Button>
                 </div>
            </div>

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
            </div>

            {/* Decision Assistant Module */}
            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>

          {/* Intelligence Tab Layer */}
          <Tabs defaultValue="guidance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-muted/30 rounded-[2rem] border border-primary/5">
                <TabsTrigger value="guidance" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Guidance</TabsTrigger>
                <TabsTrigger value="lifecycle" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Continuity</TabsTrigger>
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
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shadow-sm" />
                              <p className="text-sm"><strong className="font-black">Continuity Factor:</strong> Shoppers who buy this typically reorder refills every 45 days.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="lifecycle" className="mt-8">
                 <Card className="border-none bg-muted/20 rounded-[2rem]">
                    <CardHeader><CardTitle className="font-black">Persistent Services</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
