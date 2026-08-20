'use client';

import { findProductByGtin } from '@/lib/data';
import { notFound, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { 
    Sparkles, Star, ShoppingCart, Loader2, Barcode, ShieldCheck, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ProductChatbot from '@/components/product/product-chatbot';
import defaultTheme from '@/config/theme.json';
import SponsoredProduct from '@/components/product/sponsored-product';
import ShopperProfileCta from '@/components/shopper/shopper-profile-cta';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, increment, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, use } from 'react';
import { BackButton } from '@/components/ui/back-button';

export default function ExperienceLayerPage({ params }: { params: Promise<{ gtin: string }> }) {
  const { gtin } = use(params);
  const searchParams = useSearchParams();
  const product = findProductByGtin(gtin);
  const sessionId = searchParams.get('session');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [retailerConfig, setRetailerConfig] = useState<any>(null);

  useEffect(() => {
    if (!db || !sessionId) return;

    // 1. Fetch Session to resolve Retailer context
    getDoc(doc(db, 'sessions', sessionId)).then(sessSnap => {
        if (docSnap.exists()) {
            const rid = sessSnap.data().retailerId;
            if (rid && rid !== 'unknown') {
                // 2. Fetch Published Brand Configuration
                const configRef = doc(db, 'configurations', `${rid}_brand`);
                return onSnapshot(configRef, (configSnap) => {
                    if (configSnap.exists()) {
                        setRetailerConfig(configSnap.data().data);
                    }
                });
            }
        }
    });

    if (product) {
        const eventId = `view_${Date.now()}`;
        setDoc(doc(db, 'events', eventId), {
            eventId,
            sessionId,
            gtin: product.gtin,
            eventType: 'view',
            timestamp: serverTimestamp(),
            metadata: { source: "experience_layer" }
        }).catch(() => {});
    }
  }, [sessionId, product]);

  if (!product) {
    notFound();
  }

  const theme = retailerConfig || defaultTheme;
  const optionalModules = theme.optionalModules || defaultTheme.optionalModules;

  const handleAddToTrolley = async () => {
      if (!user) {
          toast({ title: "Identification Required", description: "Please identify yourself to build your digital trolley." });
          return;
      }
      if (!db || !sessionId) return;

      setIsAdding(true);
      try {
          const basketId = `basket_${user.uid}`;
          const basketRef = doc(db, 'baskets', basketId);
          
          const item = {
              gtin: product.gtin,
              name: product.name,
              price: product.price,
              quantity: 1,
              addedAt: new Date().toISOString(),
          };

          const basketDoc = await getDoc(basketRef);
          if (!basketDoc.exists()) {
              await setDoc(basketRef, {
                  basketId,
                  shopperId: user.uid,
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

          const eventId = `cart_${Date.now()}`;
          await setDoc(doc(db, 'events', eventId), {
              eventId,
              sessionId,
              gtin: product.gtin,
              retailerId: retailerConfig?.retailerId || 'unknown',
              eventType: 'add_to_cart',
              timestamp: serverTimestamp(),
          });

          toast({ title: "Added to Trolley", description: `"${product.name}" added.` });
      } catch (e) {
          console.error(e);
      } finally {
          setIsAdding(false);
      }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="flex items-center justify-between mb-8">
            <BackButton fallback="/" label="Back" />
            {theme.logoUrl && (
                <Image src={theme.logoUrl} alt="Logo" width={theme.logoWidth || 100} height={40} className="h-8 w-auto object-contain" />
            )}
             <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="icon" className="rounded-full h-10 w-10 relative">
                    <Link href="/shopper/basket"><ShoppingCart className="h-5 w-5"/></Link>
                </Button>
            </div>
        </header>

        <div className="space-y-8">
          <div className="aspect-square relative rounded-3xl overflow-hidden border-4 border-card shadow-2xl">
              <Image src={product.image.src} alt={product.name} fill className="object-cover" priority />
          </div>

          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <Badge variant="secondary" className="w-fit text-[10px] font-black uppercase tracking-widest">{product.brand}</Badge>
                <div className="flex items-center gap-1.5 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-black text-foreground">4.8</span>
                </div>
            </div>
            
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter leading-tight">{product.name}</h1>
                <p className="text-5xl font-black text-primary tracking-tighter">R{product.price.toFixed(2)}</p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed text-lg font-medium opacity-90">{product.description}</p>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-50 flex justify-center">
                 <Button onClick={handleAddToTrolley} disabled={isAdding} className="w-full max-w-3xl h-14 rounded-2xl text-lg font-black gap-3 shadow-2xl">
                    {isAdding ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
                    Add to Smart Trolley
                </Button>
            </div>

            <ShopperProfileCta product={product} />

            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>

          <Tabs defaultValue="guidance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-muted/30 rounded-[2rem]">
                <TabsTrigger value="guidance" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Guidance</TabsTrigger>
                <TabsTrigger value="identifiers" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Identifiers</TabsTrigger>
                <TabsTrigger value="loyalty" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Loyalty</TabsTrigger>
            </TabsList>
            
            <TabsContent value="guidance" className="mt-8">
                <Card className="border-none bg-primary/5 rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm"><Sparkles className="text-primary" /></div>
                            <span className="font-black">Experience Intelligence</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-5 bg-white/60 backdrop-blur-sm rounded-[1.5rem] italic text-sm font-medium border border-primary/5">
                          Canonical product identity verified. Ready to guide your session.
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="identifiers" className="mt-8">
                 <Card className="border-none bg-muted/20 rounded-[2rem]">
                    <CardHeader><CardTitle className="font-black">Global Data Standard</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm font-medium">
                        <div className="flex justify-between items-center py-3 border-b border-black/5">
                            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">GTIN-14</span>
                            <span className="font-mono">{product.gtin}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-black/5">
                            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Brand</span>
                            <span>{product.brand}</span>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
          
          {optionalModules.aiRecommendations && <div className="mt-20"><AiRecommendations product={product} /></div>}
          {optionalModules.retailMediaNetwork && <SponsoredProduct />}
        </div>
      </div>
    </div>
  );
}