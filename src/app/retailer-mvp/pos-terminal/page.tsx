'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  Loader2,
  Monitor,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';

import {
  resolveCheckoutHandoff,
  type ResolveCheckoutHandoffOutput,
} from '@/ai/flows/resolve-checkout-handoff';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';

function extractCheckoutHandoffId(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('handoff_')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(
      /^\/checkout\/handoff\/([^/]+)\/?$/
    );

    if (!match) {
      return null;
    }

    const decoded = decodeURIComponent(match[1]);

    return decoded.startsWith('handoff_')
      ? decoded
      : null;
  } catch {
    return null;
  }
}

export default function CheckoutSyncReceiverPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [scanValue, setScanValue] = useState('');
  const [resolvedBasket, setResolvedBasket] =
    useState<ResolveCheckoutHandoffOutput | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handoff = searchParams.get('handoff');

    if (
      handoff &&
      handoff.startsWith('handoff_')
    ) {
      setScanValue(handoff);
    }
  }, [searchParams]);

  const handleResolve = async () => {
    if (!user || resolving) {
      return;
    }

    const checkoutHandoffId =
      extractCheckoutHandoffId(scanValue);

    if (!checkoutHandoffId) {
      setError(
        'Scan or enter a valid iNteract Checkout QR.'
      );
      return;
    }

    setResolving(true);
    setError(null);
    setResolvedBasket(null);

    try {
      const idToken = await user.getIdToken();

      const result = await resolveCheckoutHandoff({
        idToken,
        checkoutHandoffId,
      });

      setResolvedBasket(result);
    } catch (resolveError) {
      console.error(
        '[Checkout Sync] Failed to resolve Checkout Handoff:',
        resolveError,
      );

      const message =
        resolveError instanceof Error
          ? resolveError.message
          : '';

      if (message.includes('EXPIRED')) {
        setError(
          'This Checkout QR has expired. Ask the shopper to generate a new Checkout QR.'
        );
      } else if (
        message.includes('NOT_READY') ||
        message.includes('NOT_CHECKOUT_READY')
      ) {
        setError(
          'This Checkout QR is no longer available for handoff.'
        );
      } else if (
        message.includes('ACCESS_DENIED')
      ) {
        setError(
          'This Checkout QR belongs to a different retailer.'
        );
      } else {
        setError(
          'Unable to resolve this Checkout QR. Verify the code and try again.'
        );
      }
    } finally {
      setResolving(false);
    }
  };

  const handleReset = () => {
    setScanValue('');
    setResolvedBasket(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Monitor className="text-primary h-8 w-8" />
            Checkout Sync
          </h1>

          <p className="text-muted-foreground max-w-3xl text-sm">
            Resolve a shopper&apos;s temporary Checkout QR into authoritative GTIN and quantity data for checkout handoff.
          </p>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5 py-1.5 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Controlled Receiver
        </Badge>
      </div>

      <Alert className="bg-amber-50/60 border-amber-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          Production POS Connection Pending
        </AlertTitle>
        <AlertDescription className="text-xs">
          Checkout Sync currently provides the controlled iNteract handoff boundary. Final pricing, payment, sale completion and transaction evidence remain authoritative in the retailer POS.
        </AlertDescription>
      </Alert>

      <Separator />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                Receive Checkout QR
              </CardTitle>

              <CardDescription>
                Scan the shopper&apos;s Checkout QR with the retailer scanner, or enter the Checkout QR value below.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                value={scanValue}
                onChange={(event) =>
                  setScanValue(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleResolve();
                  }
                }}
                placeholder="Scan Checkout QR or enter handoff credential"
                autoComplete="off"
                spellCheck={false}
                disabled={resolving}
                className="h-14 font-mono"
              />

              <Button
                type="button"
                className="w-full h-14 font-black text-lg"
                onClick={handleResolve}
                disabled={
                  resolving ||
                  !user ||
                  scanValue.trim().length === 0
                }
              >
                {resolving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resolving Checkout...
                  </>
                ) : (
                  <>
                    <ScanLine className="mr-2 h-5 w-5" />
                    Resolve Checkout QR
                  </>
                )}
              </Button>

              {!user ? (
                <p className="text-sm text-destructive font-medium">
                  An authenticated retailer session is required to resolve Checkout QR codes.
                </p>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    Checkout QR not resolved
                  </AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          {resolvedBasket ? (
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Checkout Handoff Resolved
                    </CardTitle>

                    <CardDescription>
                      Authoritative basket product identities and quantities received.
                    </CardDescription>
                  </div>

                  <Badge variant="secondary">
                    {resolvedBasket.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="p-4">
                          Product
                        </th>
                        <th className="p-4">
                          GTIN
                        </th>
                        <th className="p-4 text-center">
                          Quantity
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {resolvedBasket.items.map(
                        (item) => (
                          <tr
                            key={item.gtin}
                            className="border-b last:border-b-0"
                          >
                            <td className="p-4 font-medium">
                              {item.productName ??
                                'Product'}
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-2 font-mono">
                                <Barcode className="h-4 w-4 text-muted-foreground" />
                                {item.gtin}
                              </div>
                            </td>

                            <td className="p-4 text-center font-black">
                              {item.quantity}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t p-4">
                <p className="text-xs text-muted-foreground max-w-xl">
                  GTIN and quantity are transferred by iNteract. Retailer POS pricing, payment and completed-sale evidence are not created by this receiver.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Receive Next Basket
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>

                <div>
                  <p className="font-bold">
                    Awaiting Checkout QR
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    The shopper presents the temporary Checkout QR. The authenticated receiver resolves the authoritative basket server-side.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Handoff Integrity
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                <span>
                  Retailer authentication is required before basket data is released.
                </span>
              </div>

              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                <span>
                  The Checkout QR carries only an opaque temporary handoff identity.
                </span>
              </div>

              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                <span>
                  Basket authority is resolved server-side and restricted to the authenticated retailer.
                </span>
              </div>

              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                <span>
                  Product transfer uses GTIN and quantity; final commerce remains with the retailer POS.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
