'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

type SetupStatus = {
  network: boolean;
  brand: boolean;
  catalog: boolean;
  qr: boolean;
};

function SetupGuide({ retailerId }: { retailerId: string }) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    if (!db || !retailerId || retailerId === 'unknown') {
      setStatus(null);
      setLoadError(true);
      setLoading(false);
      return;
    }

    try {
      const [orgSnap, brandSnap, productsSnap, qrsSnap] = await Promise.all([
        getDoc(doc(db, 'configurations', `${retailerId}_org`)),
        getDoc(doc(db, 'configurations', `${retailerId}_brand`)),
        getDocs(
          query(
            collection(db, 'products'),
            where('retailerId', '==', retailerId),
            limit(1)
          )
        ),
        getDocs(
          query(
            collection(db, 'qrcodes'),
            where('retailerId', '==', retailerId),
            limit(1)
          )
        ),
      ]);

      setStatus({
        network: orgSnap.exists(),
        brand: brandSnap.exists(),
        catalog: !productsSnap.empty,
        qr: !qrsSnap.empty,
      });
    } catch (error) {
      console.warn('Setup status could not be loaded.', error);
      setStatus(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [retailerId]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (loadError || !status) {
    return (
      <Card className="mb-8 border-amber-300 bg-amber-50/50">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-bold">Setup status unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your setup progress could not be verified. No setup steps have
                been marked incomplete because of this loading failure.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void checkStatus()}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    {
      label: 'My Retail Network',
      href: '/retailer-mvp/organization',
      done: status.network,
      desc: 'Define your stores and brands.',
    },
    {
      label: 'Brand & Experience',
      href: '/retailer-mvp/ui-management',
      done: status.brand,
      desc: 'Upload logos and pick a template.',
    },
    {
      label: 'Product Catalog',
      href: '/retailer-mvp/products',
      done: status.catalog,
      desc: 'Add products you want to activate.',
    },
    {
      label: 'QR Activation',
      href: '/retailer-mvp/qr-management',
      done: status.qr,
      desc: 'Create your first digital link.',
    },
    {
      label: 'Learn the Platform',
      href: '/retailer-mvp/documentation',
      done: true,
      desc: 'Review metrics and training guides.',
      optional: true,
    },
  ];

  const isComplete =
    status.network &&
    status.brand &&
    status.catalog &&
    status.qr;

  if (isComplete) {
    return null;
  }

  return (
    <Card className="mb-8 overflow-hidden border-2 border-accent bg-accent/5 shadow-lg">
      <CardHeader className="bg-accent/10 py-4">
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
          <Sparkles className="h-4 w-4 text-accent-foreground" />
          Welcome! Let's get started
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className="group block space-y-2"
          >
            <div className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              )}

              <span
                className={cn(
                  'text-sm font-bold group-hover:underline',
                  step.done &&
                    !step.optional &&
                    'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            <p className="pl-8 text-[11px] leading-tight text-muted-foreground">
              {step.desc}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default SetupGuide;
