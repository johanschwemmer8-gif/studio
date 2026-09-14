'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FlaskConical,
  History,
  LayoutGrid,
  Loader2,
  Palette,
  PlusCircle,
  ShoppingBasket,
  Store,
} from 'lucide-react';
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

import BulkQRCodeGenerator from '@/components/dashboard/bulk-qr-code-generator';
import BrandQrTemplateGallery from '@/components/dashboard/brand-qr-template-gallery';
import SingleQrTestGenerator from '@/components/dashboard/single-qr-test-generator';
import { CampaignManagement } from '@/components/dashboard/campaign-management';
import { DeploymentOperations } from '@/components/dashboard/deployment-operations';

import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type WorkspaceArea =
  | 'create'
  | 'operate'
  | 'history'
  | 'test'
  | 'presentation';

const workspaceAreas: Array<{
  id: WorkspaceArea;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'create',
    label: 'Create',
    description: 'Campaigns and shelf activations',
    icon: PlusCircle,
  },
  {
    id: 'operate',
    label: 'Operate',
    description: 'Deployment Operations',
    icon: Store,
  },
  {
    id: 'history',
    label: 'History',
    description: 'Bulk Activation History',
    icon: History,
  },
  {
    id: 'test',
    label: 'Test',
    description: 'Interactive Test Laboratory',
    icon: FlaskConical,
  },
  {
    id: 'presentation',
    label: 'Presentation',
    description: 'QR Templates',
    icon: Palette,
  },
];

export default function QrManagementPage() {
  const { user } = useAuth();

  const [hasProducts, setHasProducts] =
    React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeArea, setActiveArea] =
    React.useState<WorkspaceArea>('create');

  const retailerId = user?.retailerId;

  React.useEffect(() => {
    let cancelled = false;

    async function checkProducts() {
      if (!db || !retailerId) {
        if (!cancelled) {
          setHasProducts(null);
          setLoading(false);
        }
        return;
      }

      try {
        const productQuery = query(
          collection(db, 'products'),
          where('retailerId', '==', retailerId),
          limit(1)
        );

        const snapshot = await getDocs(productQuery);

        if (!cancelled) {
          setHasProducts(!snapshot.empty);
        }
      } catch (error) {
        console.error(
          '[QR Management] Product prerequisite check failed:',
          error
        );

        if (!cancelled) {
          setHasProducts(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void checkProducts();

    return () => {
      cancelled = true;
    };
  }, [retailerId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Checking Catalog Status...
        </p>
      </div>
    );
  }

  if (hasProducts === false) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-8 p-12 text-center">
        <Card className="max-w-md border-primary/20 bg-primary/5 shadow-2xl">
          <CardContent className="space-y-8 pb-10 pt-12">
            <div className="mx-auto flex h-20 w-20 rotate-3 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <ShoppingBasket className="h-10 w-10" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Add a Product First
              </h3>

              <p className="px-4 text-sm leading-relaxed text-muted-foreground">
                You haven't added any products to your catalog yet. You need
                at least one product before creating production shelf
                activations.
              </p>
            </div>

            <div className="px-4">
              <Button
                asChild
                size="lg"
                className="group h-14 w-full rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg"
              >
                <Link
                  href="/retailer-mvp/products"
                  className="flex items-center justify-center gap-2"
                >
                  Open Product Catalog
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-7 w-7" />
          <h1 className="text-3xl font-bold">QR Management</h1>
        </div>

        <p className="max-w-3xl text-muted-foreground">
          Manage the operational journey from Campaign and shelf activation
          through physical Deployment and its stable QR identity.
        </p>
      </header>

      <nav
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
        aria-label="QR Management areas"
      >
        {workspaceAreas.map((area) => {
          const Icon = area.icon;
          const selected = activeArea === area.id;

          return (
            <Button
              key={area.id}
              type="button"
              variant={selected ? 'default' : 'outline'}
              className="h-auto min-h-20 justify-start whitespace-normal p-4 text-left"
              onClick={() => setActiveArea(area.id)}
            >
              <Icon className="mr-3 h-5 w-5 shrink-0" />

              <span>
                <span className="block font-semibold">
                  {area.label}
                </span>
                <span
                  className={
                    selected
                      ? 'block text-xs opacity-80'
                      : 'block text-xs text-muted-foreground'
                  }
                >
                  {area.description}
                </span>
              </span>
            </Button>
          );
        })}
      </nav>

      <main>
        {activeArea === 'create' ? (
          <div className="space-y-12">
            <section
              id="campaigns"
              aria-labelledby="campaigns-heading"
            >
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Create
                </p>
                <h2
                  id="campaigns-heading"
                  className="text-2xl font-semibold"
                >
                  Campaigns
                </h2>
              </div>

              <CampaignManagement />
            </section>

            <section
              id="activate-shelves"
              aria-labelledby="activate-shelves-heading"
              className="border-t pt-10"
            >
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Create
                </p>
                <h2
                  id="activate-shelves-heading"
                  className="text-2xl font-semibold"
                >
                  Activate Shelves
                </h2>
                <p className="text-sm text-muted-foreground">
                  Create retailer-defined Activations and their requested
                  physical Deployments.
                </p>
              </div>

              <BulkQRCodeGenerator />
            </section>
          </div>
        ) : null}

        {activeArea === 'operate' ? (
          <DeploymentOperations />
        ) : null}

        {activeArea === 'history' ? (
          <section
            id="bulk-activation-history"
            aria-labelledby="bulk-activation-history-heading"
          >
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                History
              </p>
              <h2
                id="bulk-activation-history-heading"
                className="text-2xl font-semibold"
              >
                Bulk Activation History
              </h2>
              <p className="text-sm text-muted-foreground">
                Review whether submitted Activation requests were processed
                successfully. Operational Deployment work belongs under
                Operate.
              </p>
            </div>


          </section>
        ) : null}

        {activeArea === 'test' ? (
          <section
            id="interactive-test-laboratory"
            aria-labelledby="interactive-test-laboratory-heading"
          >
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Test only
              </p>
              <h2
                id="interactive-test-laboratory-heading"
                className="text-2xl font-semibold"
              >
                Interactive Test Laboratory
              </h2>
              <p className="text-sm text-muted-foreground">
                Test QR experiences without creating or changing production
                Deployment or QR identity records.
              </p>
            </div>

            <SingleQrTestGenerator />
          </section>
        ) : null}

        {activeArea === 'presentation' ? (
          <section
            id="qr-templates"
            aria-labelledby="qr-templates-heading"
          >
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Presentation
              </p>
              <h2
                id="qr-templates-heading"
                className="text-2xl font-semibold"
              >
                QR Templates
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage reusable presentation defaults. Templates do not
                create or replace canonical QR identity.
              </p>
            </div>

            <BrandQrTemplateGallery />
          </section>
        ) : null}
      </main>
    </div>
  );
}
