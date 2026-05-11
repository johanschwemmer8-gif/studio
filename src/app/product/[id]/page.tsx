
import { findProductById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { ArrowLeft, Sparkles, MessageSquare, Star, ArrowRightLeft, BookOpen, Utensils, Tag, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductChatbot from '@/components/product/product-chatbot';
import theme from '@/config/theme.json';
import SponsoredProduct from '@/components/product/sponsored-product';
import ShopperProfileCta from '@/components/shopper/shopper-profile-cta';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = findProductById(params.id);

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
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                <Sparkles className="mr-1 h-3 w-3" /> iNteract Intelligence Active
            </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-8">
          <div>
            <div className="aspect-square relative rounded-xl overflow-hidden border shadow-xl">
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
            <div className="flex items-center gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium ml-1 text-foreground">4.8 (124 reviews)</span>
                </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-3xl font-semibold text-primary">
              R{product.price.toFixed(2)}
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
                {product.description}
            </p>

            <ShopperProfileCta product={product} />

            <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="outline" className="justify-start gap-2">
                    <ArrowRightLeft className="h-4 w-4" /> Compare
                </Button>
                <Button variant="outline" className="justify-start gap-2">
                    <BookOpen className="h-4 w-4" /> Reviews
                </Button>
                 <Button variant="outline" className="justify-start gap-2">
                    <Utensils className="h-4 w-4" /> Recipes
                </Button>
                 <Button variant="outline" className="justify-start gap-2">
                    <Tag className="h-4 w-4" /> Promotions
                </Button>
            </div>

            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>
        </div>

        <Tabs defaultValue="guidance" className="w-full mt-12">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-max">
                <TabsTrigger value="guidance">Buying Guidance</TabsTrigger>
                <TabsTrigger value="details">Specifications</TabsTrigger>
                <TabsTrigger value="reviews">Customer Reviews</TabsTrigger>
                <TabsTrigger value="recipes">Usage & Recipes</TabsTrigger>
            </TabsList>
            <TabsContent value="guidance" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" /> Expert Buying Guidance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>Our AI Assistant suggests this is a high-value purchase based on durability tests and category comparisons.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Best For:</strong> Daily intensive use, environmentally conscious shoppers.</li>
                            <li><strong>Maintenance:</strong> Top-rack dishwasher safe, but hand-wash recommended for logo longevity.</li>
                            <li><strong>Value Rank:</strong> Top 10% in the {product.category} category.</li>
                        </ul>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="details">
                 <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 text-sm border-b pb-2"><span className="text-muted-foreground">Material</span><span className="font-medium">Stainless Steel</span></div>
                        <div className="grid grid-cols-2 text-sm border-b pb-2"><span className="text-muted-foreground">Weight</span><span className="font-medium">350g</span></div>
                        <div className="grid grid-cols-2 text-sm border-b pb-2"><span className="text-muted-foreground">Dimensions</span><span className="font-medium">25cm x 7cm</span></div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        {optionalModules.aiRecommendations && (
            <div className="mt-16">
                <AiRecommendations product={product} />
            </div>
        )}

        {optionalModules.retailMediaNetwork && <SponsoredProduct />}
      </div>
    </div>
  );
}
