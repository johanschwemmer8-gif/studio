import { findProductById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductChatbot from '@/components/product/product-chatbot';
import theme from '@/config/theme.json';

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = findProductById(params.id);

  if (!product) {
    notFound();
  }

  const { optionalModules } = theme;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scanner
          </Link>
        </Button>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="aspect-square relative rounded-lg overflow-hidden border shadow-lg">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                data-ai-hint={product['data-ai-hint']}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-4">
            <Badge variant="outline" className="w-fit">{product.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
            <p className="text-3xl font-semibold text-primary">
              R{product.price.toFixed(2)}
            </p>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>
        </div>
        {optionalModules.aiRecommendations && (
            <div className="mt-12 lg:mt-16">
                <AiRecommendations product={product} />
            </div>
        )}
      </div>
    </div>
  );
}
