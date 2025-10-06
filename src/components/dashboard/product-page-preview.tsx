
import { findProductById } from '@/lib/data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AiRecommendations from '@/components/product/ai-recommendations';
import ProductChatbot from '@/components/product/product-chatbot';
import theme from '@/config/theme.json';

export default function ProductPagePreview() {
  // We'll use the first product as a default for the preview
  const product = findProductById('1');

  if (!product) {
    return <div className="p-4 text-red-500">Preview product not found.</div>;
  }

  const { optionalModules } = theme;

  return (
    <div className="min-h-full bg-background text-foreground overflow-y-auto">
      <div className="p-2">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <div className="aspect-square relative rounded-md overflow-hidden border">
              <Image
                src={product.image.src}
                alt={product.name}
                width={product.image.width}
                height={product.image.height}
                className="object-cover"
                data-ai-hint={product['data-ai-hint']}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 p-2">
            <Badge variant="outline" className="w-fit text-xs">{product.category}</Badge>
            <h1 className="text-lg font-bold">{product.name}</h1>
            <p className="text-xl font-semibold text-primary">
              R{product.price.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
            {optionalModules.productChatbot && <ProductChatbot product={product} />}
          </div>
        </div>
        {optionalModules.aiRecommendations && (
            <div className="mt-6">
                <AiRecommendations product={product} />
            </div>
        )}
      </div>
    </div>
  );
}
