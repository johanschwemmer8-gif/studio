
'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  generateCrossSellRecommendations,
  type GenerateCrossSellRecommendationsOutput,
} from '@/ai/flows';
import type { Product } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Terminal, ShoppingCart } from 'lucide-react';

type AiRecommendationsProps = {
  product: Product;
};

export default function AiRecommendations({ product }: AiRecommendationsProps) {
  const [recommendations, setRecommendations] =
    useState<GenerateCrossSellRecommendationsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await generateCrossSellRecommendations({
          productName: product.name,
          productDescription: product.description,
          productCategory: product.category,
          productPrice: product.price,
        });
        setRecommendations(result);
      } catch (e) {
        setError('Failed to generate recommendations. Please try again later.');
        console.error(e);
      }
    });
  }, [product]);

  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="text-accent" />
        You Might Also Like
      </h2>
      {isPending && <RecommendationSkeleton />}
      {error && <ErrorAlert message={error} />}
      {recommendations && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.recommendations.map((rec, index) => (
            <Card key={index} className="flex flex-col hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>{rec.name}</CardTitle>
                <CardDescription className="text-primary font-bold text-lg">
                  R{rec.price.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{rec.description}</p>
                <div>
                  <Badge variant="secondary" className="w-fit mb-2">{rec.category}</Badge>
                  <p className="text-sm border-l-2 border-accent pl-3 italic text-accent-foreground/80">
                    {rec.reason}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Smart Trolley
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-1/3 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
