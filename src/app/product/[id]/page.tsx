
'use client';

import { findProductById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Star, ArrowRightLeft, BookOpen, Utensils, Tag, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ProductChatbot from '@/components/product/product-chatbot';
import theme from '@/config/theme.json';
import SponsoredProduct from '@/components/product/sponsored-product';
import ShopperProfileCta from '@/components/shopper/shopper-profile-cta';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = findProductById(params.id);
  const { user } = useAuth();

  if (!product) {
    notFound();
  }

  const { optionalModules } = theme;

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
                <ShieldCheck className="h-3.5 w-3.5" /> Persistent Intelligence Active
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
                <Button variant="outline" className="justify-start gap-3 h-12">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> Compare
                </Button>
                <Button variant="outline" className="justify-start gap-3 h-12">
                    <BookOpen className="h-4 w-4 text-muted-foreground" /> Reviews
                </Button>
                 <Button variant="outline" className="justify-start gap-3 h-12">
                    <Utensils className="h-4 w-4 text-muted-foreground" /> Recipes
                </Button>
                 <Button variant="outline" className="justify-start gap-3 h-12">
                    <Tag className="h-4 w-4 text-muted-foreground" /> Promotions
                </Button>
            </div>

            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>
        </div>

        <Tabs defaultValue="guidance" className="w-full mt-12">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-max h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="guidance" className="rounded-lg py-2.5">Buying Guidance</TabsTrigger>
                <TabsTrigger value="details" className="rounded-lg py-2.5">Specifications</TabsTrigger>
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
                              Personalized Buying Guidance
                            </div>
                            {user && <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-500/20">Profile Connected</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-muted-foreground">
                        <div className="p-4 bg-muted/30 rounded-xl border italic text-sm">
                          {user ? 
                            "Our Intelligence Layer has analyzed your profile. This guidance is optimized based on your interest in stainless steel and lifestyle accessories." : 
                            "Connect your Smart Profile to unlock AI guidance tailored to your specific preferences and past purchases."}
                        </div>
                        <ul className="grid sm:grid-cols-2 gap-4">
                            <li className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <p><strong className="text-foreground">Best For:</strong> Daily intensive use, environmentally conscious shoppers.</p>
                            </li>
                            <li className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <p><strong className="text-foreground">Maintenance:</strong> Top-rack dishwasher safe, but hand-wash recommended for logo longevity.</p>
                            </li>
                            <li className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <p><strong className="text-foreground">Value Rank:</strong> Top 10% in the {product.category} category based on durability tests.</p>
                            </li>
                            <li className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <p><strong className="text-foreground">Cross-Store Memory:</strong> Saved comparisons are available at all iNteract partner locations.</p>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="details" className="mt-8">
                 <Card className="border-primary/10 shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-2 text-base border-b pb-4"><span className="text-muted-foreground">Material</span><span className="font-semibold">Stainless Steel</span></div>
                        <div className="grid grid-cols-2 text-base border-b pb-4"><span className="text-muted-foreground">Weight</span><span className="font-semibold">350g</span></div>
                        <div className="grid grid-cols-2 text-base border-b pb-4"><span className="text-muted-foreground">Dimensions</span><span className="font-semibold">25cm x 7cm</span></div>
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
