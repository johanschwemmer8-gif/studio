
'use client';

import { findProductByGtin } from '@/lib/data';
import { notFound, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { 
    ArrowLeft, Sparkles, Star, RotateCcw, 
    PlayCircle, ShoppingCart, Loader2, Barcode, ShieldCheck, Info
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

export default function GS1ProductPage({ params }: { params: { gtin: string } }) {
  const searchParams = useSearchParams();
  const product = findProductByGtin(params.gtin);
  const batch = searchParams.get('batch');
  const serial = searchParams.get('serial');
  
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
              gtin: product.gtin,
              name: product.name,
              price: product.price,
              quantity: 1,
              addedAt: new Date().toISOString(),
          };

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

          toast({ title: "Added to Trolley", description: `"${product.name}" added via GS1 sync.` });
      } catch (e) {
          console.error(e);
      } finally {
          setIsAdding(false);
      }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
            <Button asChild variant="ghost" size="icon" className="rounded-full h-10 w-10"><Link href="/"><ArrowLeft className="h-5 w-5" /></Link></Button>
             <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold uppercase tracking-widest text-[9px] px-2 py-1">
                    <ShieldCheck className="h-3 w-3 mr-1" /> GS1 Verified
                </Badge>
                <Button asChild variant="ghost" size="icon" className="rounded-full h-10 w-10 relative">
                    <Link href="/shopper/basket"><ShoppingCart className="h-5 w-5"/></Link>
                </Button>
            </div>
        </div>

        <div className="space-y-8">
          <div className="aspect-square relative rounded-3xl overflow-hidden border-4 border-card shadow-2xl">
              <Image src={product.image.src} alt={product.name} fill className="object-cover" priority />
          </div>

          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="w-fit text-[10px] font-black uppercase tracking-widest">{product.brand}</Badge>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Barcode className="h-3 w-3" />
                        <span className="text-[9px] font-mono font-bold tracking-tighter">GTIN: {product.gtin}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-black text-foreground">4.8</span>
                </div>
            </div>
            
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter leading-tight">{product.name}</h1>
                <p className="text-5xl font-black text-primary tracking-tighter">R{product.price.toFixed(2)}</p>
            </div>

            {(batch || serial) && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-xl border border-primary/5">
                    {batch && <div className="flex items-center gap-1.5"><Badge variant="outline" className="bg-white font-mono text-[9px]">AI 10: {batch}</Badge></div>}
                    {serial && <div className="flex items-center gap-1.5"><Badge variant="outline" className="bg-white font-mono text-[9px]">AI 21: {serial}</Badge></div>}
                </div>
            )}
            
            <p className="text-muted-foreground leading-relaxed text-lg font-medium opacity-90">{product.description}</p>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-50 flex justify-center">
                 <Button onClick={handleAddToTrolley} disabled={isAdding} className="w-full max-w-3xl h-14 rounded-2xl text-lg font-black gap-3 shadow-2xl bg-accent text-accent-foreground">
                    {isAdding ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
                    Add to Smart Trolley
                </Button>
            </div>

            <ShopperProfileCta product={product} />

            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>

          <Tabs defaultValue="guidance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-muted/30 rounded-[2rem] border border-primary/5">
                <TabsTrigger value="guidance" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Guidance</TabsTrigger>
                <TabsTrigger value="specs" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">GS1 Specs</TabsTrigger>
                <TabsTrigger value="loyalty" className="rounded-[1.5rem] py-3 text-xs font-black uppercase tracking-wider">Loyalty</TabsTrigger>
            </TabsList>
            
            <TabsContent value="guidance" className="mt-8">
                <Card className="border-none bg-primary/5 rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm"><Sparkles className="text-primary" /></div>
                            <span className="font-black">Expert Decision Guidance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-5 bg-white/60 backdrop-blur-sm rounded-[1.5rem] italic text-sm font-medium border border-primary/5">
                          Standardized identity confirmed. View instructions, recipes, and setup guides below.
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-14 rounded-2xl font-bold gap-2"><PlayCircle className="h-5 w-5" /> Video Guide</Button>
                            <Button variant="outline" className="h-14 rounded-2xl font-bold gap-2"><Info className="h-5 w-5" /> Setup Manual</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-8">
                 <Card className="border-none bg-muted/20 rounded-[2rem]">
                    <CardHeader><CardTitle className="font-black">Global Identification Data</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-black/5">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GTIN-14 (Primary Key)</span>
                            <span className="font-mono font-bold text-sm">{product.gtin}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-black/5">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Brand Reference</span>
                            <span className="font-bold text-sm">{product.brand}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category Code</span>
                            <span className="font-mono text-sm">{product.category}</span>
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
