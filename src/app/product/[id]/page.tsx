
'use client';

import { findProductById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Star, ShieldCheck, PlayCircle, Settings, ShieldAlert, RotateCcw, Info } from 'lucide-react';
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
            toast({ title: "Continuity Synced", description: `Your ${type.replace('_', ' ')} event was saved to your profile.` });
        }
    } catch (e) {
        console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
            <Button asChild variant="ghost" className="-ml-4">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Scanner
                </Link>
            </Button>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3">
                <ShieldCheck className="h-3.5 w-3.5" /> Continuity Engine Active
            </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-8">
          <div>
            <div className="aspect-square relative rounded-2xl overflow-hidden border shadow-2xl">
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
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1 font-medium">{product.category}</Badge>
                <div className="flex items-center text-yellow-500 bg-yellow-500/5 px-2 py-1 rounded-full border border-yellow-500/10">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-xs font-bold ml-1 text-foreground">4.8</span>
                </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{product.name}</h1>
            <p className="text-4xl font-black text-primary">
              R{product.price.toFixed(2)}
            </p>
            
            <p className="text-muted-foreground leading-relaxed text-lg">
                {product.description}
            </p>

            <ShopperProfileCta product={product} />

            <div className="grid grid-cols-2 gap-3 mt-2">
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => logContinuityEvent('reorder')}>
                    <RotateCcw className="h-4 w-4 text-muted-foreground" /> 1-Tap Reorder
                </Button>
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => logContinuityEvent('tutorial_view')}>
                    <PlayCircle className="h-4 w-4 text-muted-foreground" /> Tutorial
                </Button>
                 <Button variant="outline" className="justify-start gap-3 h-12">
                    <Settings className="h-4 w-4 text-muted-foreground" /> Setup Guide
                </Button>
                 <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => logContinuityEvent('warranty_activate')}>
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" /> Warranty
                </Button>
            </div>

            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>
        </div>

        <Tabs defaultValue="guidance" className="w-full mt-12">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-max h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="guidance" className="rounded-lg py-2.5">Buying Guidance</TabsTrigger>
                <TabsTrigger value="lifecycle" className="rounded-lg py-2.5">Continuity</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg py-2.5">Reviews</TabsTrigger>
                <TabsTrigger value="recipes" className="rounded-lg py-2.5">Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="guidance" className="mt-8">
                <Card className="border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Info className="h-5 w-5 text-primary" />
                              </div>
                              Decision Intelligence Guidance
                            </div>
                            {user && <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-500/20">Continuity Active</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-muted-foreground">
                        <div className="p-4 bg-muted/30 rounded-xl border italic text-sm">
                          {user ? 
                            `Welcome back, ${user.displayName}. Leveraging your lifecycle memory to provide specialized guidance.` : 
                            "Connect your Smart Profile to unlock persistent lifecycle features like reorder reminders."}
                        </div>
                        <ul className="grid sm:grid-cols-2 gap-4">
                            <li className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <p><strong className="text-foreground">Lifecycle Phase:</strong> Exploration. Our AI recommends this for daily intensive use.</p>
                            </li>
                            <li className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <p><strong className="text-foreground">Continuity Factor:</strong> Shoppers who buy this typically reorder refills every 45 days.</p>
                            </li>
                            <li className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <p><strong className="text-foreground">Decision Support:</strong> Top-rated for durability in your preferred Lifestyle category.</p>
                            </li>
                            <li className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <p><strong className="text-foreground">Sync Status:</strong> Viewable across all iNteract infrastructure stores.</p>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="lifecycle" className="mt-8">
                 <Card className="border-primary/10 shadow-lg">
                    <CardHeader><CardTitle>Persistent Continuity Services</CardTitle></CardHeader>
                    <CardContent className="p-8 grid sm:grid-cols-3 gap-6">
                        <div className="p-4 bg-muted rounded-xl text-center space-y-2">
                            <RotateCcw className="h-8 w-8 mx-auto text-primary" />
                            <h4 className="font-bold">Subscription</h4>
                            <p className="text-xs text-muted-foreground">Automate refills every 30-45 days.</p>
                            <Button size="sm" variant="outline" className="w-full">Enable</Button>
                        </div>
                         <div className="p-4 bg-muted rounded-xl text-center space-y-2">
                            <PlayCircle className="h-8 w-8 mx-auto text-primary" />
                            <h4 className="font-bold">Lifecycle Tutorials</h4>
                            <p className="text-xs text-muted-foreground">Expert guides for setup and maintenance.</p>
                            <Button size="sm" variant="outline" className="w-full">Watch</Button>
                        </div>
                         <div className="p-4 bg-muted rounded-xl text-center space-y-2">
                            <ShieldAlert className="h-8 w-8 mx-auto text-primary" />
                            <h4 className="font-bold">Warranty</h4>
                            <p className="text-xs text-muted-foreground">Persistent digital activation for 24 months.</p>
                            <Button size="sm" variant="outline" className="w-full">Activate</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        {optionalModules.aiRecommendations && (
            <div className="mt-20">
                <AiRecommendations product={product} />
            </div>
        )}

        {optionalModules.retailMediaNetwork && <SponsoredProduct />}
      </div>
    </div>
  );
}
