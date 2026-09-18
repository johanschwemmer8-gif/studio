'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Eye,
  MousePointerClick,
  Play,
  RotateCcw,
  ShoppingCart,
  Video,
  X,
} from 'lucide-react';

import {
  getRetailerRetailMediaReport,
  type RetailerRetailMediaReport,
} from '@/lib/retail-media-reporting-server';
import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatRate(value: number | null): string {
  if (value === null) {
    return 'N/A';
  }

  return `${(value * 100).toFixed(1)}%`;
}

export default function RetailMediaNetworkPage() {
  const { user, loading: authLoading } = useAuth();

  const [report, setReport] =
    useState<RetailerRetailMediaReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      const result = await getRetailerRetailMediaReport({
        idToken,
      });

      setReport(result);
    } catch (err) {
      console.error(
        '[Retail Media Network] Failed to load canonical report:',
        err
      );
      setReport(null);
      setError('REPORT_UNAVAILABLE');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setReport(null);
      setIsLoading(false);
      return;
    }

    void loadReport();
  }, [authLoading, user, loadReport]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Retail Media Network
          </h2>
          <p className="mt-2 text-muted-foreground">
            Loading sponsored media performance…
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading canonical Retail Media measurements…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Retail Media Network
          </h2>
        </div>

        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            An authenticated retailer account is required.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Retail Media Network
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sponsored media performance at the physical Point of Decision.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reporting unavailable</CardTitle>
            <CardDescription>
              Canonical Retail Media measurements could not be loaded.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <button
              type="button"
              onClick={() => void loadReport()}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics } = report;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Retail Media Network
        </h2>

        <p className="mt-2 max-w-3xl text-muted-foreground">
          Factual sponsored media performance measured at the physical
          Point of Decision.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Reach</h3>
          <p className="text-sm text-muted-foreground">
            Sponsored media opportunities and confirmed presentations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Eligible Opportunities
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCount(metrics.eligible)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Server-confirmed sponsored media eligibility.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Impressions
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCount(metrics.impressions)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Sponsored units confirmed as rendered to shoppers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Delivery Rate
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatRate(metrics.deliveryRate)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Impressions as a share of eligible opportunities.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Attention</h3>
          <p className="text-sm text-muted-foreground">
            Factual video presentation and playback behaviour.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Video className="h-4 w-4 text-muted-foreground" />
                Video Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCount(metrics.videoImpressions)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Play className="h-4 w-4 text-muted-foreground" />
                Video Starts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCount(metrics.videoStarts)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Start Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatRate(metrics.startRate)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Video Completions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCount(metrics.videoCompletions)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatRate(metrics.completionRate)}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Interaction</h3>
          <p className="text-sm text-muted-foreground">
            Shopper interaction with sponsored media. Ari engagement remains
            measured separately from advertising interaction.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <X className="h-4 w-4 text-muted-foreground" />
                Dismissals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCount(metrics.dismissals)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatRate(metrics.dismissalRate)} dismissal rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                Replay Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCount(metrics.replays)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Shopper-initiated replay actions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Replayed Presentations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCount(metrics.replayedPresentations)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatRate(metrics.replayRate)} replay rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                Sponsored Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCount(metrics.clicks)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatRate(metrics.ctr)} click-through rate
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Commerce</h3>
          <p className="text-sm text-muted-foreground">
            Commerce reporting requires authoritative retailer POS data.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Brand Turnover
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">N/A</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Available when authoritative retailer POS integration is
                connected.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attributed Sales
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">N/A</div>
              <p className="mt-1 text-xs text-muted-foreground">
                No sales value is inferred from QR or sponsored media
                interactions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Reporting Scope</CardTitle>
          <CardDescription>
            Retail Media measurement is kept separate from retailer Profit
            &amp; ROI.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Sponsored media metrics represent observed presentation and
            interaction events within this retailer&apos;s network.
          </p>
          <p>
            Shopper sessions, Ari engagement, decision behaviour and
            transactions remain distinct measurement domains.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
