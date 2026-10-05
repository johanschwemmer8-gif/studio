'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Barcode,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

import { manageShopperBasket } from '@/ai/flows/manage-shopper-basket';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import type { Basket } from '@/lib/schemas/basket';

const SHOPPER_SESSION_KEY = 'interact.currentShopperSessionId';

export default function ShoppingBasketPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [basket, setBasket] = useState<Basket | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutationGtin, setMutationGtin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBasket = useCallback(async (activeSessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await manageShopperBasket({
        command: 'GET',
        sessionId: activeSessionId,
      });

      setBasket(result);
    } catch (loadError) {
      console.error(
        '[Checkout Sync] Failed to load Shopping Basket:',
        loadError,
      );
      setBasket(null);
      setError('Unable to load your Shopping Basket. Please return to shopping and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeSessionId = sessionStorage.getItem(SHOPPER_SESSION_KEY);

    if (!activeSessionId) {
      setLoading(false);
      return;
    }

    setSessionId(activeSessionId);
    void loadBasket(activeSessionId);
  }, [loadBasket]);

  const handleSetQuantity = async (
    gtin: string,
    quantity: number,
  ) => {
    if (!sessionId || quantity < 1 || mutationGtin) {
      return;
    }

    setMutationGtin(gtin);
    setError(null);

    try {
      const result = await manageShopperBasket({
        command: 'SET_QUANTITY',
        sessionId,
        gtin,
        quantity,
      });

      setBasket(result);
    } catch (mutationError) {
      console.error(
        '[Checkout Sync] Failed to update basket quantity:',
        mutationError,
      );
      setError('Could not update this quantity. Please try again.');
    } finally {
      setMutationGtin(null);
    }
  };

  const handleRemoveItem = async (gtin: string) => {
    if (!sessionId || mutationGtin) {
      return;
    }

    setMutationGtin(gtin);
    setError(null);

    try {
      const result = await manageShopperBasket({
        command: 'REMOVE_ITEM',
        sessionId,
        gtin,
      });

      setBasket(result);
    } catch (mutationError) {
      console.error(
        '[Checkout Sync] Failed to remove basket item:',
        mutationError,
      );
      setError('Could not remove this product. Please try again.');
    } finally {
      setMutationGtin(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl font-black tracking-tight">
            Shopping Basket
          </h1>
          <p className="text-muted-foreground">
            Start a shopping session by scanning an iNteract product experience.
          </p>
        </div>

        <Button
          asChild
          className="w-full max-w-xs h-14 rounded-2xl text-lg font-bold"
        >
          <Link href="/">Return to Shopping</Link>
        </Button>
      </div>
    );
  }

  if (!basket || basket.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 border-b flex items-center gap-4">
          <BackButton
            fallback="/"
            label="Back to Shopping"
            className="mb-0"
          />
          <h1 className="text-xl font-black">Shopping Basket</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">
              Your Shopping Basket is empty
            </h2>
            <p className="text-muted-foreground">
              Add products from their iNteract shopping experience.
            </p>
          </div>

          <Button
            asChild
            variant="secondary"
            className="w-full max-w-xs h-14 rounded-2xl font-bold"
          >
            <Link href="/">Continue Shopping</Link>
          </Button>
        </main>
      </div>
    );
  }

  const displayedTotal = basket.items.reduce(
    (total, item) =>
      total +
      (typeof item.displayedUnitPrice === 'number'
        ? item.displayedUnitPrice * item.quantity
        : 0),
    0,
  );

  const hasCompleteDisplayedPricing = basket.items.every(
    (item) => typeof item.displayedUnitPrice === 'number',
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="p-4 bg-background border-b flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <BackButton
            fallback="/"
            label="Back"
            className="mb-0"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight">
              Shopping Basket
            </h1>
            <p className="text-xs text-muted-foreground">
              {basket.items.length} product line{basket.items.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-52">
        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          {basket.items.map((item) => {
            const mutating = mutationGtin === item.gtin;

            return (
              <Card
                key={item.gtin}
                className="border-none shadow-sm overflow-hidden"
              >
                <CardContent className="p-4 flex gap-4">
                  <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {item.productName ?? 'Product'}
                    </p>

                    <div className="flex items-center gap-1.5 opacity-60">
                      <Barcode className="h-3 w-3" />
                      <span className="text-[9px] font-mono font-bold">
                        {item.gtin}
                      </span>
                    </div>

                    {typeof item.displayedUnitPrice === 'number' && (
                      <p className="text-primary font-black text-lg">
                        R{item.displayedUnitPrice.toFixed(2)}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          disabled={mutating || item.quantity <= 1}
                          onClick={() =>
                            handleSetQuantity(
                              item.gtin,
                              item.quantity - 1,
                            )
                          }
                          aria-label={`Decrease quantity of ${item.productName ?? item.gtin}`}
                        >
                          {mutating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                        </Button>

                        <span className="font-bold text-sm">
                          {item.quantity}
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          disabled={mutating}
                          onClick={() =>
                            handleSetQuantity(
                              item.gtin,
                              item.quantity + 1,
                            )
                          }
                          aria-label={`Increase quantity of ${item.productName ?? item.gtin}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={mutating}
                        onClick={() => handleRemoveItem(item.gtin)}
                        aria-label={`Remove ${item.productName ?? item.gtin}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium">
              Product identity is retained by GTIN. Displayed prices are shopping context only; the retailer POS remains authoritative for checkout pricing and payment.
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t z-50">
        <div className="max-w-3xl mx-auto space-y-4">
          {hasCompleteDisplayedPricing ? (
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Displayed Basket Value
              </span>
              <span className="text-3xl font-black tracking-tighter">
                R{displayedTotal.toFixed(2)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Final pricing will be determined by the retailer POS.
            </p>
          )}

          <Button
            type="button"
            className="h-14 rounded-2xl w-full font-black text-lg"
            disabled
          >
            Ready for Checkout
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Checkout handoff QR becomes available when Checkout Sync handoff is enabled.
          </p>
        </div>
      </footer>
    </div>
  );
}
