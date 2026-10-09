'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * LEGACY ROUTE REDIRECT
 * This legacy route is retained for backwards compatibility.
 * Platform retailer user administration is centralized in /dashboard/admin.
 */
export default function UserAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/admin');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Redirecting to Active User Management...
        </p>
    </div>
  );
}
