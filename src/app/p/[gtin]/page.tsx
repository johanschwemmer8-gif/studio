
'use client';

import { notFound, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { 
    Sparkles, Star, ShoppingCart, Loader2, Barcode, ShieldCheck, Info, AlertTriangle
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
import { getCanonicalProduct } from '@/services/product-service';
import type { Product } from '@/lib/data';

export default function ExperienceLayerPage({ params }: { params: Promise<{ gtin: string }> }) {
  const { gtin } = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [retailerConfig, setRetailerConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function resolveIdentityAndProduct() {
        setLoading(true);
        try {
            // 1. Fetch Canonical Product
            const canonicalProduct = await getCanonicalProduct(gtin);
            if (!canonicalProduct) {
                setError("PRODUCT_NOT_FOUND");
                setLoading(false);
                return;
            }

            // 2. If session is provided, verify tenant anchoring
            if (sessionId && db) {
                const sessSnap = await getDoc(doc(db, 'sessions', sessionId));
                
                // If session exists, use it to resolve branding and verify tenant
                if (sessSnap.exists()) {
                    const sessionData = sessSnap.data();
                    const rid = sessionData.retailerId;

                    // SECURITY GATE: Product must belong to the session retailer
                    if (rid && rid !== 'unknown' && canonicalProduct.retailerId && canonicalProduct.retailerId !== rid) {
                        console.error("[Security] Tenant Mismatch. Product:", canonicalProduct.retailerId, "Session:", rid);
                        setError("TENANT_MISMATCH");
                        setLoading(false);
                        return;
                    }

                    // 3. Resolve Branded Experience
                    if (rid && rid !== 'unknown') {
                        const configRef = doc(db, 'configurations', `${rid}_brand`);
                        const configSnap = await getDoc(configRef);
                        if (configSnap.exists()) {
                            setRetailerConfig(configSnap.data().data);
                        }
                    }

                    // 4. Log View Event
                    const eventId = `view_${crypto.randomUUID()}`;
                    setDoc(doc(db, 'events', eventId), {
                        eventId,
                        sessionId,
                        gtin: canonicalProduct.gtin,
                        retailerId: rid,
                        eventType: 'view',
                        timestamp: serverTimestamp(),
                        metadata: { source: "experience_layer" }
                    }).catch(() => {});
                } else {
                    // Stale session ID (common after a reset). We proceed without session-anchored branding.
                    console.warn("[Session] Stale or missing session ID detected. Proceeding as anonymous.");
                }
            }

            setProduct(canonicalProduct);
        } catch (e: any) {
            console.error("Resolution failure:", e);
            setError("SYSTEM_ERROR");
        } finally {
            setLoading(false);
        }
    }

    resolveIdentityAndProduct();
  }, [gtin, sessionId]);

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Resolving Identity...</p>
        </div>
    );
  }

  if (error || !product) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight">Product Unavailable</h1>
                <p className="text-muted-foreground max-w-xs mx-auto">
                    {error === 'TENANT_MISMATCH' 
                        ? "This product does not belong to the retailer associated with your session." 
                        : "We couldn't find the product details you're looking for. Please try scanning again."}
                </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl px-8 font-bold">
                <Link href="/">Back to Scan</Link>
            </Button>
        </div>
    );
  }

  const theme = retailerConfig || defaultTheme;
  const optionalModules = theme.optionalModules || defaultTheme.optionalModules;

  const handleAddToTrolley = async () => {
      if (!user) {
          toast({ title: "Identification Required", description: "Please identify yourself to build your digital trolley." });
          return;
      }
      if (!db || !sessionId) {
          toast({ title: "Session Error", description: "Missing authoritative session lineage.", variant: "destructive" });
          return;
      }

      setIsAdding(true);
      try {
          const basketId = `basket_${user.uid}`;
          const basketRef = doc(db, 'baskets', basketId);
          const activeRetailerId = retailerConfig?.retailerId || product.retailerId || 'unknown';
          
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
                  sessionId,
                  retailerId: activeRetailerId,
                  shopperId: user.uid,
                  items: [item],
                  total: product.price,
                  status: 'active',
                  updatedAt: serverTimestamp(),
              });
          } else {
              await updateDoc(basketRef, {
                  sessionId,
                  retailerId: activeRetailerId,
                  items: arrayUnion(item),
                  total: increment(product.price),
                  updatedAt: serverTimestamp(),
              });
          }

          const eventId = `cart_${crypto.randomUUID()}`;
          await setDoc(doc(db, 'events', eventId), {
              eventId,
              sessionId,
              gtin: product.gtin,
              retailerId: activeRetailerId,
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
                    <Link href={`/shopper/basket${sessionId ? `?session=${sessionId}` : ''}`}><ShoppingCart className="h-5 w-5"/></Link>
                </Button>
            </div>
        </header>

        <div className="space-y-8">
          <div className="aspect-square relative rounded-3xl overflow-hidden border-4 border-card shadow-2xl bg-muted">
              {product.image?.src ? (
                  <Image src={product.image.src} alt={product.name} fill className="object-cover" priority />
              ) : (
                  <div className="w-full h-full flex items-center justify-center"><Info className="h-12 w-12 text-muted-foreground/20" /></div>
              )}
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
                            <span className="font-black">Expert Sommelier Guidance Active</span>
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
