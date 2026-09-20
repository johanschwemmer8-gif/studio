'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CalendarDays,
  Clock3,
  GitCompareArrows,
  HelpCircle,
  Info,
  MessageSquare,
  RefreshCw,
  ScanLine,
  ShoppingBasket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getOverviewIntelligence } from '@/ai/flows/get-overview-intelligence';
import { getOverviewMetricTrend } from '@/ai/flows/get-overview-metric-trend';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import type {
  OverviewGroundedSummary,
  OverviewIntelligenceResponse,
  OverviewMetric,
  OverviewMetricTrend,
  OverviewPeriodGranularity,
  OverviewTrendMetricId,
} from '@/lib/schemas/overview-intelligence';

type MetricDefinition = {
  label: string;
  description: string;
  metric: OverviewMetric;
  trendMetricId?: OverviewTrendMetricId;
};

const GRANULARITIES: Array<{
  value: OverviewPeriodGranularity;
  label: string;
}> = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YTD', label: 'Financial YTD' },
];

const TREND_LABELS: Record<OverviewTrendMetricId, string> = {
  basket_size_increase_percent: 'Basket Size Increase %',
  basket_size_increase_rand: 'Basket Size Increase R',
  sales_uplift_percent: 'Sales Uplift %',
  conversion_rate_percent: 'Conversion Rate %',
  qr_exposures: 'QR Exposures',
  qualifying_shopper_sessions: 'Qualifying Shopper Sessions',
  ari_interactions: 'Ari Interactions',
  decision_signals: 'Decision Signals',
};

function metricDisplay(metric: OverviewMetric): string {
  if (metric.status === 'REQUIRES_POS_DATA') {
    return 'Requires POS Data';
  }

  if (
    metric.status === 'INSUFFICIENT_EVIDENCE' ||
    metric.status === 'UNAVAILABLE'
  ) {
    return 'Not available';
  }

  if (metric.value === null) {
    return 'No data yet';
  }

  if (metric.unit === 'PERCENT') {
    return `${metric.value.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}%`;
  }

  if (metric.unit === 'RAND') {
    return `R${metric.value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return metric.value.toLocaleString();
}

function metricStateLabel(metric: OverviewMetric): string {
  switch (metric.status) {
    case 'MEASURED':
      return 'Measured';
    case 'NO_ACTIVITY':
      return 'No activity';
    case 'REQUIRES_POS_DATA':
      return 'Requires POS Data';
    case 'INSUFFICIENT_EVIDENCE':
      return 'Insufficient evidence';
    case 'UNAVAILABLE':
      return 'Unavailable';
  }
}

function MetricCard({
  definition,
  selected,
  onSelect,
}: {
  definition: MetricDefinition;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const content = (
    <Card
      className={
        selected
          ? 'h-full border-primary shadow-sm ring-1 ring-primary/20'
          : 'h-full border-primary/10 shadow-sm'
      }
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {definition.label}
          </CardTitle>
          {definition.trendMetricId ? (
            <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Activity className="h-4 w-4 shrink-0 text-primary" />
          )}
        </div>
        <CardDescription className="text-[10px] leading-relaxed">
          {definition.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div
          className={
            definition.metric.value === null
              ? 'text-lg font-black tracking-tight'
              : 'text-3xl font-black tracking-tight'
          }
        >
          {metricDisplay(definition.metric)}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[9px] uppercase">
            {metricStateLabel(definition.metric)}
          </Badge>
          <Badge variant="secondary" className="text-[9px] uppercase">
            {definition.metric.evidenceLevel}
          </Badge>
        </div>

        {definition.metric.statusDetail && (
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {definition.metric.statusDetail}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (!onSelect) {
    return content;
  }

  return (
    <button
      type="button"
      className="block h-full w-full text-left"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Show ${definition.label} trend`}
    >
      {content}
    </button>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-black uppercase tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function SummaryColumn({
  title,
  statements,
  emptyText,
}: {
  title: string;
  statements: OverviewGroundedSummary[
    | 'factualObservations'
    | 'identifiedIndicators'
    | 'suggestedActions'
  ];
  emptyText: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="border-b pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>

      {statements.length > 0 ? (
        <div className="space-y-3">
          {statements.map((item, index) => (
            <div
              key={`${item.type}-${index}`}
              className="rounded-lg border bg-background/60 p-3"
            >
              <p className="text-sm leading-relaxed">
                {item.statement}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[9px]">
                  {item.evidenceClass}
                </Badge>
                <Badge variant="secondary" className="text-[9px]">
                  {item.evidenceStrength}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function scopeLabel(
  response: OverviewIntelligenceResponse
): string {
  if (response.scope.displayName) {
    return response.scope.displayName;
  }

  const identifiers = [
    response.scope.storeId,
    response.scope.areaId,
    response.scope.regionId,
    response.scope.divisionId,
    response.scope.brandId,
    response.scope.networkId,
  ];

  return (
    identifiers.find(Boolean) ??
    `${response.scope.level} scope`
  );
}

function formatTimestamp(
  value: string | null,
  timezone: string | null
): string {
  if (!value) {
    return 'No activity yet';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function trendValueLabel(
  value: number,
  metricId: OverviewTrendMetricId
): string {
  if (
    metricId === 'basket_size_increase_percent' ||
    metricId === 'sales_uplift_percent' ||
    metricId === 'conversion_rate_percent'
  ) {
    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}%`;
  }

  if (metricId === 'basket_size_increase_rand') {
    return `R${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return value.toLocaleString();
}

export default function AuthoritativeOverview() {
  const { user } = useAuth();

  const [overview, setOverview] =
    useState<OverviewIntelligenceResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewRefreshing, setOverviewRefreshing] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [selectedMetricId, setSelectedMetricId] =
    useState<OverviewTrendMetricId>('qr_exposures');
  const [granularity, setGranularity] =
    useState<OverviewPeriodGranularity>('DAILY');
  const [trend, setTrend] =
    useState<OverviewMetricTrend | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  const loadOverview = useCallback(
    async (refresh = false) => {
      if (!user) {
        return;
      }

      if (refresh) {
        setOverviewRefreshing(true);
      } else {
        setOverviewLoading(true);
      }

      setOverviewError(null);

      try {
        const idToken = await user.getIdToken();
        const result = await getOverviewIntelligence(idToken);
        setOverview(result);
      } catch (error) {
        console.error('Overview load failed:', error);
        setOverviewError(
          error instanceof Error
            ? error.message
            : 'Overview intelligence is unavailable.'
        );
      } finally {
        setOverviewLoading(false);
        setOverviewRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      void loadOverview();
    }
  }, [user, loadOverview]);

  useEffect(() => {
    if (!user || !overview) {
      return;
    }

    let active = true;

    const loadTrend = async () => {
      setTrendLoading(true);
      setTrendError(null);

      try {
        const idToken = await user.getIdToken();
        const result = await getOverviewMetricTrend(idToken, {
          metricId: selectedMetricId,
          granularity,
        });

        if (active) {
          setTrend(result);
        }
      } catch (error) {
        console.error('Overview trend load failed:', error);

        if (active) {
          setTrend(null);
          setTrendError(
            error instanceof Error
              ? error.message
              : 'Trend data is unavailable.'
          );
        }
      } finally {
        if (active) {
          setTrendLoading(false);
        }
      }
    };

    void loadTrend();

    return () => {
      active = false;
    };
  }, [user, overview, selectedMetricId, granularity]);

  const commercialMetrics = useMemo<MetricDefinition[]>(
    () =>
      overview
        ? [
            {
              label: 'Basket Size Increase %',
              description:
                'Attributed basket change versus a valid comparison cohort.',
              metric:
                overview.commercialOutcomes
                  .basketSizeIncreasePercent,
              trendMetricId: 'basket_size_increase_percent',
            },
            {
              label: 'Basket Size Increase R',
              description:
                'Rand change in average basket versus a valid comparison cohort.',
              metric:
                overview.commercialOutcomes.basketSizeIncreaseRand,
              trendMetricId: 'basket_size_increase_rand',
            },
            {
              label: 'Sales Uplift %',
              description:
                'Incremental sales impact where a defensible counterfactual exists.',
              metric:
                overview.commercialOutcomes.salesUpliftPercent,
              trendMetricId: 'sales_uplift_percent',
            },
            {
              label: 'Conversion Rate %',
              description:
                'Qualifying Shopper Sessions with a deterministically associated purchase.',
              metric:
                overview.commercialOutcomes.conversionRatePercent,
              trendMetricId: 'conversion_rate_percent',
            },
          ]
        : [],
    [overview]
  );

  const podMetrics = useMemo<MetricDefinition[]>(
    () =>
      overview
        ? [
            {
              label: 'QR Exposures',
              description:
                'Authoritative QR exposure events in the current scope.',
              metric:
                overview.pointOfDecisionActivity.qrExposures,
              trendMetricId: 'qr_exposures',
            },
            {
              label: 'Qualifying Shopper Sessions',
              description:
                'Sessions created only after a qualifying shopper interaction.',
              metric:
                overview.pointOfDecisionActivity
                  .qualifyingShopperSessions,
              trendMetricId: 'qualifying_shopper_sessions',
            },
            {
              label: 'Ari Interactions',
              description:
                'Recorded Ari interaction signals anchored to qualifying Sessions.',
              metric:
                overview.pointOfDecisionActivity.ariInteractions,
              trendMetricId: 'ari_interactions',
            },
            {
              label: 'Decision Signals',
              description:
                'Explicit and deterministic decision evidence; inferred signals excluded.',
              metric:
                overview.pointOfDecisionActivity.decisionSignals,
              trendMetricId: 'decision_signals',
            },
          ]
        : [],
    [overview]
  );

  const activityMetrics = useMemo<MetricDefinition[]>(
    () =>
      overview
        ? [
            {
              label: 'Information Requests',
              description:
                'Recorded shopper requests for product or decision information.',
              metric:
                overview.activityIntelligence.informationRequests,
            },
            {
              label: 'Product Comparisons',
              description:
                'Recorded product-comparison decision signals.',
              metric:
                overview.activityIntelligence.productComparisons,
            },
            {
              label: 'Purchase Barriers / Concerns',
              description:
                'Recorded purchase barriers, product concerns and price objections.',
              metric:
                overview.activityIntelligence.purchaseBarriersConcerns,
            },
            {
              label: 'Product Consideration',
              description:
                'Recorded product-consideration decision signals.',
              metric:
                overview.activityIntelligence.productConsideration,
            },
          ]
        : [],
    [overview]
  );

  const selectedMetric = useMemo(
    () =>
      [...commercialMetrics, ...podMetrics].find(
        item => item.trendMetricId === selectedMetricId
      ),
    [commercialMetrics, podMetrics, selectedMetricId]
  );

  const chartData = useMemo(
    () =>
      trend?.points.map(point => ({
        periodStart: point.periodStart,
        periodEnd: point.periodEnd,
        value:
          point.status === 'MEASURED' ||
          point.status === 'NO_ACTIVITY'
            ? point.value
            : null,
        status: point.status,
        reason: point.reason,
      })) ?? [],
    [trend]
  );

  if (overviewLoading && !overview) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-40 rounded-xl"
            />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!overview && overviewError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Overview unavailable</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Authoritative Overview evidence could not be loaded.
            No metric values have been substituted.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadOverview()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!overview) {
    return null;
  }

  const timezone = overview.timeWindow.timezone;

  return (
    <div className="space-y-8">
      {overviewError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Refresh failed</AlertTitle>
          <AlertDescription>
            The last successfully loaded authoritative Overview remains
            visible. No replacement values were generated.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-primary/10 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest">
                Operational Scope
              </h2>
            </div>
            <p className="text-lg font-black">
              {scopeLabel(overview)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {overview.scope.level.toUpperCase()}
              </Badge>
              <Badge variant="secondary">
                Authenticated home scope
              </Badge>
            </div>
            <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
              All Overview metrics below are calculated within your
              authorized operational scope. Interactive scope comparison
              will be enabled only when server-side scope authorization is
              available.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="gap-2"
            >
              <Link href="/retailer-mvp/qr-analytics">
                <BarChart2 className="h-4 w-4" />
                Scan Stats
              </Link>
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              disabled={overviewRefreshing}
              onClick={() => void loadOverview(true)}
            >
              <RefreshCw
                className={
                  overviewRefreshing
                    ? 'h-4 w-4 animate-spin'
                    : 'h-4 w-4'
                }
              />
              {overviewRefreshing ? 'Refreshing' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <SectionHeading
          title="Commercial Outcomes"
          description="Commercial impact is displayed only when the required authoritative POS, attribution, comparison or incrementality evidence exists."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {commercialMetrics.map(definition => (
            <MetricCard
              key={definition.metric.metricId}
              definition={definition}
              selected={
                definition.trendMetricId === selectedMetricId
              }
              onSelect={
                definition.trendMetricId
                  ? () =>
                      setSelectedMetricId(
                        definition.trendMetricId!
                      )
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Point-of-Decision Activity"
          description="Authoritative activity captured at the physical Point of Decision. QR exposure and qualifying Shopper Sessions remain distinct measurements."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {podMetrics.map(definition => (
            <MetricCard
              key={definition.metric.metricId}
              definition={definition}
              selected={
                definition.trendMetricId === selectedMetricId
              }
              onSelect={
                definition.trendMetricId
                  ? () =>
                      setSelectedMetricId(
                        definition.trendMetricId!
                      )
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Performance Trend"
          description="Select a primary KPI above, then view it by the retailer's authoritative reporting calendar."
        />

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base font-black">
                  {TREND_LABELS[selectedMetricId]}
                </CardTitle>
                <CardDescription>
                  {selectedMetric?.description}
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                {GRANULARITIES.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={
                      granularity === option.value
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() =>
                      setGranularity(option.value)
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!overview.timeWindow.timezone ? (
              <Alert>
                <CalendarDays className="h-4 w-4" />
                <AlertTitle>
                  Reporting Calendar required
                </AlertTitle>
                <AlertDescription>
                  Trend periods are not displayed until an
                  authoritative retailer Reporting Calendar has been
                  configured. No UTC or financial-year default is
                  assumed.
                </AlertDescription>
              </Alert>
            ) : trendLoading ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : trendError ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Trend unavailable</AlertTitle>
                <AlertDescription>
                  Historical evidence for this metric could not be
                  loaded. No trend values have been substituted.
                </AlertDescription>
              </Alert>
            ) : chartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No trend evidence is available.
                </p>
              </div>
            ) : chartData.every(item => item.value === null) ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
                <Info className="h-6 w-6 text-muted-foreground" />
                <p className="font-bold">
                  {selectedMetric
                    ? metricDisplay(selectedMetric.metric)
                    : 'Not available'}
                </p>
                <p className="max-w-xl text-xs text-muted-foreground">
                  Historical values are withheld until the evidence
                  requirements for this metric are satisfied.
                </p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="periodStart"
                      tickFormatter={value =>
                        new Intl.DateTimeFormat(undefined, {
                          month: 'short',
                          day: 'numeric',
                          ...(timezone
                            ? { timeZone: timezone }
                            : {}),
                        }).format(new Date(value))
                      }
                      minTickGap={24}
                    />
                    <YAxis allowDecimals />
                    <Tooltip
                      labelFormatter={value =>
                        formatTimestamp(
                          String(value),
                          timezone
                        )
                      }
                      formatter={(value: number | string) => {
                        const numericValue = Number(value);

                        return [
                          Number.isFinite(numericValue)
                            ? trendValueLabel(
                                numericValue,
                                selectedMetricId
                              )
                            : 'Not available',
                          TREND_LABELS[selectedMetricId],
                        ];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      connectNulls={false}
                      stroke="currentColor"
                      strokeWidth={2}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Activity Intelligence"
          description="Current-period decision activity derived from authoritative interaction evidence."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {activityMetrics.map(definition => (
            <MetricCard
              key={definition.metric.metricId}
              definition={definition}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Grounded Summary"
          description="Ari interprets authoritative evidence; it does not create the underlying measurements."
        />

        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-black">
                  Retail Intelligence Summary
                </CardTitle>
                <CardDescription>
                  {overview.groundedSummary.statusDetail ??
                    'Evidence-grounded observations for the current scope.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {overview.groundedSummary.status ===
            'NO_ACTIVITY' ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <MessageSquare className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="font-bold">No activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The current authoritative scope contains no
                  qualifying activity to summarize.
                </p>
              </div>
            ) : overview.groundedSummary.status ===
              'UNAVAILABLE' ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Summary unavailable</AlertTitle>
                <AlertDescription>
                  The evidence required to produce a grounded summary
                  is currently unavailable.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <SummaryColumn
                  title="Factual Observations"
                  statements={
                    overview.groundedSummary.factualObservations
                  }
                  emptyText="No factual observations are available for the current evidence."
                />
                <SummaryColumn
                  title="Identified Indicators"
                  statements={
                    overview.groundedSummary.identifiedIndicators
                  }
                  emptyText="No evidence-backed indicators are currently identified."
                />
                <SummaryColumn
                  title="Suggested Actions"
                  statements={
                    overview.groundedSummary.suggestedActions
                  }
                  emptyText="No evidence-backed actions are currently suggested."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-primary/10 bg-muted/20">
        <CardContent className="grid gap-5 p-5 md:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Calculated
            </div>
            <p className="text-sm font-bold">
              {formatTimestamp(
                overview.freshness.calculatedAt,
                timezone
              )}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Activity className="h-4 w-4" />
              Latest Evidence
            </div>
            <p className="text-sm font-bold">
              {formatTimestamp(
                overview.freshness.latestEvidenceAt,
                timezone
              )}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              Evidence Window
            </div>
            <p className="text-sm font-bold">
              Current Overview snapshot
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatTimestamp(
                overview.timeWindow.startAt,
                timezone
              )}{' '}
              –{' '}
              {formatTimestamp(
                overview.timeWindow.endAt,
                timezone
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ScanLine className="h-3.5 w-3.5" />
          QR exposure is not automatically a Shopper Session.
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          Sessions begin only after qualifying interaction.
        </span>
        <span className="flex items-center gap-1">
          <GitCompareArrows className="h-3.5 w-3.5" />
          Commercial uplift requires appropriate comparison evidence.
        </span>
        <span className="flex items-center gap-1">
          <ShoppingBasket className="h-3.5 w-3.5" />
          Missing evidence is never converted into a fabricated value.
        </span>
      </div>
    </div>
  );
}
