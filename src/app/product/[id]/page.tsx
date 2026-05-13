
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { findProductByGtin } from '@/lib/data';
import { Loader2 } from 'lucide-react';

/**
 * COMPATIBILITY BRIDGE:
 * This route resolves legacy IDs by treating them as GTINs.
 * Direct ID lookups are deprecated in favour of GTIN-only identification.
 */
export default function LegacyProductRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();
  const product = findProductByGtin(params.id);

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
          <p className="font-bold text-sm uppercase tracking-widest opacity-50">Resolving Global Identity...</p>
      </div>
    </div>
  );
}
