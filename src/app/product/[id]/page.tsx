
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { findProductById } from '@/lib/data';
import { Loader2 } from 'lucide-react';

/**
 * Backward compatibility redirect.
 * Internal IDs are deprecated; this route resolves them to GTINs.
 */
export default function LegacyProductRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();
  const product = findProductById(params.id);

  useEffect(() => {
    if (product) {
      router.replace(`/p/${product.gtin}`);
    } else {
      router.replace('/404');
    }
  }, [product, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="font-bold text-sm uppercase tracking-widest opacity-50">Resolving GS1 Identity...</p>
      </div>
    </div>
  );
}
