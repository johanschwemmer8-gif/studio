'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * LEGACY ROUTE REDIRECT
 * This route has been moved into the Admin Dashboard context for consistent navigation.
 */
export default function LegacyUserAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/identity-registry');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Redirecting to Identity Registry...
        </p>
    </div>
  );
}
