'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export default function CheckoutHandoffLandingPage() {
  const params = useParams<{
    checkoutHandoffId: string;
  }>();
  const router = useRouter();

  const checkoutHandoffId =
    typeof params.checkoutHandoffId === 'string'
      ? params.checkoutHandoffId
      : '';

  const validCredential =
    checkoutHandoffId.startsWith('handoff_');

  useEffect(() => {
    if (!validCredential) {
      return;
    }

    const query = new URLSearchParams({
      handoff: checkoutHandoffId,
    });

    router.replace(
      `/retailer-mvp/pos-terminal?${query.toString()}`
    );
  }, [
    checkoutHandoffId,
    router,
    validCredential,
  ]);

  if (!validCredential) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <ScanLine className="h-12 w-12 mx-auto text-muted-foreground" />

            <div className="space-y-2">
              <h1 className="text-xl font-black">
                Invalid Checkout QR
              </h1>

              <p className="text-sm text-muted-foreground">
                This is not a valid iNteract Checkout Handoff credential.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-5">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />

          <div className="space-y-2">
            <h1 className="text-xl font-black">
              Opening Checkout Sync
            </h1>

            <p className="text-sm text-muted-foreground">
              The Checkout Handoff will be resolved only after retailer authentication and explicit confirmation.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            No basket data is contained in this page.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
