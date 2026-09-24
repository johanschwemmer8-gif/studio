'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  RefreshCw,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Target,
  Users,
  WalletCards,
} from 'lucide-react';

import { getProfitRoiEvidence } from '@/lib/profit-roi-evidence-server';
import { getProfitRoiAnalysis } from '@/ai/flows/get-profit-roi-analysis';
import { getAriFinancialIntelligence } from '@/ai/flows/get-ari-financial-intelligence';
import { buildAriFinancialIntelligence } from '@/lib/ari-financial-intelligence';
import { interpretProfitRoiSnapshot } from '@/lib/profit-roi-interpretation';
import { useAuth } from '@/context/auth-context';
import type {
  ProfitRoiEvidenceReason,
  ProfitRoiMetric,
  ProfitRoiMetricStatus,
  ProfitRoiSnapshot,
} from '@/lib/schemas/profit-roi';
import type { OverviewPeriodGranularity } from '@/lib/schemas/overview-intelligence';
import type { ProfitRoiAnalysis } from '@/lib/schemas/profit-roi-analysis';
import type { AriFinancialIntelligence } from '@/lib/schemas/ari-financial-intelligence';

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

type LoadState = 'LOADING' | 'READY' | 'ERROR';

const GRANULARITIES: Array<{
  value: OverviewPeriodGranularity;
  label: string;
}> = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YTD', label: 'Financial YTD' },
];

const STATUS_LABELS: Record<ProfitRoiMetricStatus, string> = {
  MEASURED: 'Measured',
  NO_ACTIVITY: 'No Activity',
  REQUIRES_POS_DATA: 'Requires POS Data',
  INSUFFICIENT_EVIDENCE: 'Insufficient Evidence',
  UNAVAILABLE: 'Unavailable',
  LIMITED_EVIDENCE: 'Limited Evidence',
};

const REASON_LABELS: Record<ProfitRoiEvidenceReason, string> = {
  POS_DATA_MISSING: 'Authoritative POS transaction evidence is required.',
  ATTRIBUTION_UNAVAILABLE:
    'Deterministic shopper-session to transaction attribution is unavailable.',
  BASELINE_UNAVAILABLE:
    'An authoritative comparison baseline is required.',
  COUNTERFACTUAL_UNAVAILABLE:
    'A defensible counterfactual is required before incremental value can be measured.',
  MARGIN_DATA_MISSING:
    'Authoritative margin data is required before profit contribution can be measured.',
  LICENCE_COST_UNAVAILABLE:
    'Authoritative iNteract SaaS investment data is not yet available.',
  RETAIL_MEDIA_REVENUE_UNAVAILABLE:
    'Recognised retailer-owned Retail Media revenue is not yet available.',
  RMN_DELIVERY_COST_UNAVAILABLE:
    'Authoritative Retail Media delivery costs are not yet available.',
  INCOMPLETE_COVERAGE:
    'Complete authoritative evidence coverage could not be established.',
  INSUFFICIENT_SAMPLE:
    'The approved evidence requirement has not yet been met.',
  SCOPE_MISMATCH:
    'The available evidence does not match the selected organizational scope.',
  PERIOD_MISMATCH:
    'The available evidence does not match the selected reporting period.',
  CURRENCY_MISMATCH:
    'The financial evidence is not compatible with the current ZAR-only reconciliation.',
  SOURCE_UNAVAILABLE:
    'A required authoritative source is unavailable.',
};

function canDisplayValue(metric: ProfitRoiMetric): boolean {
  return metric.status === 'MEASURED' || metric.status === 'NO_ACTIVITY';
}

function formatMetric(metric: ProfitRoiMetric): string {
  if (!canDisplayValue(metric) || metric.value === null) {
    return STATUS_LABELS[metric.status];
  }

  switch (metric.unit) {
    case 'RAND':
      return `R ${metric.value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    case 'PERCENT':
      return `${metric.value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })}%`;
    case 'COUNT':
    default:
      return metric.value.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      });
  }
}

function metricExplanation(metric: ProfitRoiMetric): string {
  if (metric.statusDetail) {
    return metric.statusDetail;
  }

  if (metric.reason) {
    return REASON_LABELS[metric.reason];
  }

  if (metric.status === 'NO_ACTIVITY') {
    return 'No authoritative activity was recorded for this scope and period.';
  }

  if (metric.status === 'MEASURED') {
    return 'Calculated from authoritative evidence for this scope and period.';
  }

  return 'No additional evidence detail is available.';
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'No authoritative activity';
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Unavailable';
  }

  return date.toLocaleString();
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function scopeLabel(snapshot: ProfitRoiSnapshot): string {
  const scope = snapshot.scope;

  switch (scope.level) {
    case 'network':
      return 'Network';
    case 'brand':
      return `Brand · ${scope.brandId ?? 'Authorized scope'}`;
    case 'division':
      return `Division · ${scope.divisionId ?? 'Authorized scope'}`;
    case 'region':
      return `Region · ${scope.regionId ?? 'Authorized scope'}`;
    case 'area':
      return `Area · ${scope.areaId ?? 'Authorized scope'}`;
    case 'store':
      return `Store · ${scope.storeId ?? 'Authorized scope'}`;
    default:
      return 'Authorized scope';
  }
}

function MetricCard({
  title,
  metric,
  description,
}: {
  title: string;
  metric: ProfitRoiMetric;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Badge variant="outline">{metric.evidenceLevel}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{formatMetric(metric)}</div>
        <div className="text-xs text-muted-foreground">
          {metricExplanation(metric)}
        </div>
        {metric.source ? (
          <div className="text-xs text-muted-foreground">
            Source: {metric.source}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FunnelStage({
  label,
  metric,
}: {
  label: string;
  metric: ProfitRoiMetric;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline">{metric.evidenceLevel}</Badge>
      </div>
      <div className="mt-2 text-xl font-bold">{formatMetric(metric)}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {metricExplanation(metric)}
      </div>
    </div>
  );
}

function errorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'PROFIT_ROI_LOAD_FAILED';

  if (message.includes('ROI_ACCESS_DENIED')) {
    return 'Your account does not have permission to view Profit & ROI intelligence.';
  }

  if (message.includes('REPORTING_CALENDAR_UNAVAILABLE')) {
    return 'Profit & ROI requires an authoritative retailer reporting calendar before financial periods can be calculated.';
  }

  if (message.includes('INFRASTRUCTURE_UNAVAILABLE')) {
    return 'The authoritative Profit & ROI data service is currently unavailable.';
  }

  if (
    message.includes('RETAILER_AUTHORIZATION_REQUIRED') ||
    message.includes('AUTH')
  ) {
    return 'Your authenticated retailer authorization could not be established.';
  }

  return 'Authoritative Profit & ROI evidence could not be loaded. No financial values have been substituted.';
}

export function AuthoritativeProfitRoi() {
  const { user } = useAuth();

  const [snapshot, setSnapshot] = useState<ProfitRoiSnapshot | null>(null);
  const [analysis, setAnalysis] = useState<ProfitRoiAnalysis | null>(null);
  const [ariIntelligence, setAriIntelligence] =
    useState<AriFinancialIntelligence | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('LOADING');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [granularity, setGranularity] =
    useState<OverviewPeriodGranularity>('MONTHLY');

  const loadSnapshot = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoadState('LOADING');
    setLoadError(null);

    try {
      const idToken = await user.getIdToken();
      const [result, analysisResult] = await Promise.all([
        getProfitRoiEvidence(idToken, granularity),
        getProfitRoiAnalysis(idToken, granularity),
      ]);

      setSnapshot(result);
      setAnalysis(analysisResult);

      const deterministicInterpretation =
        interpretProfitRoiSnapshot(result);

      try {
        const ariResult =
          await getAriFinancialIntelligence(result);
        setAriIntelligence(ariResult);
      } catch (ariError) {
        console.error(
          'Ari financial enhancement unavailable; deterministic Ari remains active:',
          ariError
        );
        setAriIntelligence(
          await buildAriFinancialIntelligence(
            deterministicInterpretation
          )
        );
      }

      setLoadState('READY');
    } catch (error) {
      console.error('Profit & ROI evidence load failed:', error);
      setSnapshot(null);
      setAnalysis(null);
      setAriIntelligence(null);
      setLoadError(errorMessage(error));
      setLoadState('ERROR');
    }
  }, [granularity, user]);

  useEffect(() => {
    if (user) {
      void loadSnapshot();
    }
  }, [loadSnapshot, user]);

  if (loadState === 'LOADING' && !snapshot) {
    return (
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin" />
            <p className="font-medium">
              Loading authoritative Profit & ROI evidence…
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Financial values are shown only when supported by authoritative
              evidence.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadState === 'ERROR' || !snapshot) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Profit & ROI unavailable</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{loadError ?? 'Authoritative evidence is unavailable.'}</p>
          <Button variant="outline" size="sm" onClick={() => void loadSnapshot()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const interpretation = interpretProfitRoiSnapshot(snapshot);

  const { investment, retailMedia, commerce, profit, reconciliation, funnel } =
    snapshot;

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Operational Scope
                </div>
                <div className="font-medium">{scopeLabel(snapshot)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Reporting Period
                </div>
                <div className="font-medium">
                  {formatDate(snapshot.reportingPeriod.startAt)} –{' '}
                  {formatDate(snapshot.reportingPeriod.endAt)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Timezone</div>
                <div className="font-medium">
                  {snapshot.reportingPeriod.timezone}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Latest Evidence
                </div>
                <div className="font-medium">
                  {formatDateTime(snapshot.latestEvidenceAt)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {GRANULARITIES.map(option => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={
                    granularity === option.value ? 'default' : 'outline'
                  }
                  onClick={() => setGranularity(option.value)}
                  disabled={loadState === 'LOADING'}
                >
                  {option.label}
                </Button>
              ))}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadSnapshot()}
                disabled={loadState === 'LOADING'}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    loadState === 'LOADING' ? 'animate-spin' : ''
                  }`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Executive Summary</h2>
          <p className="text-sm text-muted-foreground">
            Financial outcomes are displayed only where the required evidence
            level has been established.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="iNteract SaaS Investment"
            metric={investment.saasInvestment}
            description="Authoritative retailer investment attributable to this scope and period."
          />
          <MetricCard
            title="Retail Media Revenue"
            metric={retailMedia.retailMediaRevenue}
            description="Recognised retailer-owned Retail Media revenue."
          />
          <MetricCard
            title="Licence Cost Offset"
            metric={retailMedia.licenceCostOffsetPercentage}
            description="Gross recognised Retail Media revenue relative to SaaS investment."
          />
          <MetricCard
            title="Attributed Sales"
            metric={commerce.attributedSales}
            description="Sales deterministically associated with qualifying shopper sessions."
          />
          <MetricCard
            title="Incremental Profit Contribution"
            metric={profit.incrementalProfitContribution}
            description="Incremental commerce contribution after authoritative margin evidence."
          />
          <MetricCard
            title="ROI"
            metric={reconciliation.roiPercentage}
            description="Net financial benefit relative to authoritative SaaS investment."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <WalletCards className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">
              Retail Media → Licence Offset
            </h2>
            <p className="text-sm text-muted-foreground">
              Retail Media revenue belongs to the retailer and may offset some
              or all of the iNteract SaaS investment.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Retail Media Revenue"
            metric={retailMedia.retailMediaRevenue}
            description="Recognised retailer-owned advertising revenue."
          />
          <MetricCard
            title="Licence Cost Offset"
            metric={retailMedia.licenceCostOffsetPercentage}
            description="Percentage of SaaS investment offset by gross recognised Retail Media revenue."
          />
          <MetricCard
            title="Remaining Licence Cost"
            metric={retailMedia.remainingLicenceCost}
            description="SaaS investment remaining after recognised Retail Media revenue."
          />
          <MetricCard
            title="Surplus Above Licence Cost"
            metric={retailMedia.surplusAboveLicenceCost}
            description="Recognised Retail Media revenue above the SaaS investment, where supported."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">
              Retail Media → Commerce
            </h2>
            <p className="text-sm text-muted-foreground">
              Advertising revenue, brand turnover and commerce attribution are
              separate financial concepts and are not double-counted.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Brand Turnover"
            metric={retailMedia.brandTurnover}
            description="Commerce turnover associated with Retail Media activity where authoritative evidence exists."
          />
          <MetricCard
            title="Attributed Sales"
            metric={retailMedia.attributedSales}
            description="Authoritative commerce attributed to the relevant Retail Media evidence."
          />
          <MetricCard
            title="RMN Delivery Costs"
            metric={retailMedia.rmnDeliveryCosts}
            description="Authoritative attributable Retail Media delivery costs, excluding separately recognised SaaS investment."
          />
          <MetricCard
            title="Net Retail Media Contribution"
            metric={retailMedia.netRetailMediaContribution}
            description="Recognised Retail Media revenue less authoritative attributable delivery costs."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">
              Point of Decision → Commerce
            </h2>
            <p className="text-sm text-muted-foreground">
              Authoritative evidence progression from QR exposure through
              deterministic transaction attribution.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <FunnelStage label="QR Exposures" metric={funnel.qrExposures} />
          <FunnelStage
            label="Qualifying Shopper Sessions"
            metric={funnel.qualifyingShopperSessions}
          />
          <FunnelStage
            label="Ari Interactions"
            metric={funnel.ariInteractions}
          />
          <FunnelStage
            label="Supported Decision Signals"
            metric={funnel.supportedDecisionSignals}
          />
          <FunnelStage
            label="Verified Purchases"
            metric={funnel.verifiedPurchases}
          />
          <FunnelStage
            label="Attributed Sales"
            metric={funnel.attributedSales}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">Commerce Evidence</h2>
            <p className="text-sm text-muted-foreground">
              Attributed commerce is kept separate from incremental commerce.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Verified Purchases"
            metric={commerce.verifiedPurchases}
            description="Production VERIFIED purchases satisfying the authoritative attribution contract."
          />
          <MetricCard
            title="Conversion Rate"
            metric={commerce.conversionRatePercentage}
            description="Displayed only when complete compatible conversion populations are established."
          />
          <MetricCard
            title="Average Attributed Basket"
            metric={commerce.averageAttributedBasket}
            description="Average authoritative value of deterministically attributed purchases."
          />
          <MetricCard
            title="Attributed Sales"
            metric={commerce.attributedSales}
            description="Authoritative transaction value associated with qualifying shopper sessions."
          />
          <MetricCard
            title="Basket Increase"
            metric={commerce.basketIncreaseRand}
            description="Absolute basket increase requiring an authoritative baseline."
          />
          <MetricCard
            title="Basket Increase %"
            metric={commerce.basketIncreasePercentage}
            description="Relative basket increase requiring an authoritative baseline."
          />
          <MetricCard
            title="Incremental Sales"
            metric={commerce.incrementalSales}
            description="Incremental sales requiring a defensible counterfactual."
          />
          <MetricCard
            title="Sales Uplift"
            metric={commerce.salesUpliftPercentage}
            description="Sales uplift requiring a defensible counterfactual."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">
              Financial Reconciliation
            </h2>
            <p className="text-sm text-muted-foreground">
              Attributed sales and brand turnover are evidence inputs, not
              independent additions to financial benefit.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Net Retail Media Contribution"
            metric={retailMedia.netRetailMediaContribution}
            description="Retail Media contribution after authoritative attributable delivery costs."
          />
          <MetricCard
            title="Incremental Commerce Profit"
            metric={profit.incrementalProfitContribution}
            description="Incremental commerce value after authoritative margin evidence."
          />
          <MetricCard
            title="Total Financial Benefit"
            metric={reconciliation.totalFinancialBenefit}
            description="Net Retail Media contribution plus incremental commerce profit contribution."
          />
          <MetricCard
            title="SaaS Investment"
            metric={investment.saasInvestment}
            description="Authoritative retailer investment used in financial reconciliation."
          />
          <MetricCard
            title="Net Financial Benefit"
            metric={reconciliation.netFinancialBenefit}
            description="Total financial benefit less authoritative SaaS investment."
          />
          <MetricCard
            title="ROI"
            metric={reconciliation.roiPercentage}
            description="Net financial benefit divided by authoritative SaaS investment."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">
              Financial Analysis
            </h2>
            <p className="text-sm text-muted-foreground">
              Historical and organizational financial evidence. Every value
              retains its own authoritative evidence status; unavailable
              evidence is never converted to zero.
            </p>
          </div>
        </div>

        {!analysis ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Financial analysis unavailable</AlertTitle>
            <AlertDescription>
              Authoritative trend and organizational breakdown evidence could
              not be established for this reporting context.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Trend</CardTitle>
                <CardDescription>
                  Independent authoritative results for each{' '}
                  {granularity.toLowerCase()} reporting period. Missing or
                  insufficient evidence is shown as its evidence status rather
                  than as a numerical value.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-2 font-medium">Period</th>
                        <th className="p-2 font-medium">SaaS Investment</th>
                        <th className="p-2 font-medium">RMN Revenue</th>
                        <th className="p-2 font-medium">Licence Offset</th>
                        <th className="p-2 font-medium">Attributed Sales</th>
                        <th className="p-2 font-medium">Incremental Sales</th>
                        <th className="p-2 font-medium">
                          Incremental Profit
                        </th>
                        <th className="p-2 font-medium">
                          Net Financial Benefit
                        </th>
                        <th className="p-2 font-medium">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.trend.points.map(point => (
                        <tr
                          key={`${point.reportingPeriod.startAt}-${point.reportingPeriod.endAt}`}
                          className="border-b align-top last:border-0"
                        >
                          <td className="whitespace-nowrap p-2">
                            <div className="font-medium">
                              {formatDate(point.reportingPeriod.startAt)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              to {formatDate(point.reportingPeriod.endAt)}
                            </div>
                          </td>
                          <td className="p-2">
                            {formatMetric(point.metrics.saasInvestment)}
                          </td>
                          <td className="p-2">
                            {formatMetric(point.metrics.retailMediaRevenue)}
                          </td>
                          <td className="p-2">
                            {formatMetric(
                              point.metrics.licenceCostOffsetPercentage
                            )}
                          </td>
                          <td className="p-2">
                            {formatMetric(point.metrics.attributedSales)}
                          </td>
                          <td className="p-2">
                            {formatMetric(point.metrics.incrementalSales)}
                          </td>
                          <td className="p-2">
                            {formatMetric(
                              point.metrics.incrementalProfitContribution
                            )}
                          </td>
                          <td className="p-2">
                            {formatMetric(
                              point.metrics.netFinancialBenefit
                            )}
                          </td>
                          <td className="p-2">
                            {formatMetric(point.metrics.roiPercentage)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {analysis.trend.points.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No authoritative historical reporting periods are
                    available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
                <CardDescription>
                  Immediate authorized organizational scopes for the selected
                  reporting period. Child results are independently measured
                  and are not summed to manufacture the parent result.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.breakdown.rows.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="font-medium">
                      No lower organizational scope
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The current scope is terminal or has no authorized child
                      scopes available for financial analysis.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2 font-medium">Scope</th>
                          <th className="p-2 font-medium">SaaS Investment</th>
                          <th className="p-2 font-medium">RMN Revenue</th>
                          <th className="p-2 font-medium">Licence Offset</th>
                          <th className="p-2 font-medium">Attributed Sales</th>
                          <th className="p-2 font-medium">
                            Incremental Sales
                          </th>
                          <th className="p-2 font-medium">
                            Incremental Profit
                          </th>
                          <th className="p-2 font-medium">
                            Net Financial Benefit
                          </th>
                          <th className="p-2 font-medium">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.breakdown.rows.map(row => (
                          <tr
                            key={[
                              row.scope.level,
                              row.scope.networkId,
                              row.scope.brandId,
                              row.scope.divisionId,
                              row.scope.regionId,
                              row.scope.areaId,
                              row.scope.storeId,
                            ]
                              .filter(Boolean)
                              .join(':')}
                            className="border-b align-top last:border-0"
                          >
                            <td className="p-2">
                              <div className="font-medium">
                                {row.displayName}
                              </div>
                              <div className="text-xs capitalize text-muted-foreground">
                                {row.scope.level}
                              </div>
                            </td>
                            <td className="p-2">
                              {formatMetric(row.metrics.saasInvestment)}
                            </td>
                            <td className="p-2">
                              {formatMetric(row.metrics.retailMediaRevenue)}
                            </td>
                            <td className="p-2">
                              {formatMetric(
                                row.metrics.licenceCostOffsetPercentage
                              )}
                            </td>
                            <td className="p-2">
                              {formatMetric(row.metrics.attributedSales)}
                            </td>
                            <td className="p-2">
                              {formatMetric(row.metrics.incrementalSales)}
                            </td>
                            <td className="p-2">
                              {formatMetric(
                                row.metrics.incrementalProfitContribution
                              )}
                            </td>
                            <td className="p-2">
                              {formatMetric(
                                row.metrics.netFinancialBenefit
                              )}
                            </td>
                            <td className="p-2">
                              {formatMetric(row.metrics.roiPercentage)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <div>
              <h2 className="text-xl font-semibold">
                Ari Financial Intelligence
              </h2>
              <p className="text-sm text-muted-foreground">
                Evidence-grounded financial interpretation derived from the
                authoritative Profit &amp; ROI snapshot.
              </p>
            </div>
          </div>

          {ariIntelligence ? (
            <Badge variant="outline">
              {ariIntelligence.mode === 'ENHANCED'
                ? 'Ari Enhanced Interpretation'
                : 'Ari Authoritative Interpretation'}
            </Badge>
          ) : null}
        </div>

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>
            {interpretation.status === 'AVAILABLE'
              ? 'Authoritative financial intelligence available'
              : interpretation.status === 'NO_ACTIVITY'
                ? 'No activity'
                : interpretation.status === 'LIMITED_EVIDENCE'
                  ? 'Limited evidence'
                  : 'Financial intelligence evidence-constrained'}
          </AlertTitle>
          <AlertDescription>{interpretation.statusDetail}</AlertDescription>
        </Alert>

        {ariIntelligence ? (
          <Card>
            <CardHeader>
              <CardTitle>Ari Summary</CardTitle>
              <CardDescription>
                Ari interprets authoritative evidence only. Financial
                measurements and evidence eligibility are established before
                Ari interpretation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6">
                {ariIntelligence.narrative.summary}
              </p>

              {ariIntelligence.narrative.observations.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Observations</h3>
                  <div className="space-y-2">
                    {ariIntelligence.narrative.observations.map(
                      (observation, index) => (
                        <p
                          key={`${index}-${observation}`}
                          className="text-sm text-muted-foreground"
                        >
                          {observation}
                        </p>
                      )
                    )}
                  </div>
                </div>
              ) : null}

              {ariIntelligence.narrative.actions.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    Evidence Actions
                  </h3>
                  <div className="space-y-2">
                    {ariIntelligence.narrative.actions.map(
                      (action, index) => (
                        <p
                          key={`${index}-${action}`}
                          className="text-sm text-muted-foreground"
                        >
                          {action}
                        </p>
                      )
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">
              Authoritative Evidence Trace
            </h3>
            <p className="text-xs text-muted-foreground">
              Deterministic statements retained with their supporting metric
              and evidence level.
            </p>
          </div>

          {[
            ['Factual Observations', interpretation.factualObservations],
            ['Identified Indicators', interpretation.identifiedIndicators],
            ['Suggested Actions', interpretation.suggestedActions],
          ].map(([title, statements]) => {
            const items =
              statements as typeof interpretation.factualObservations;

            return items.length > 0 ? (
              <Card key={title as string}>
                <CardHeader>
                  <CardTitle>{title as string}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.statementId}
                      className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm">{item.text}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {item.evidenceLevel}
                        </Badge>
                        {item.supportingMetricIds.map((metricId) => (
                          <Badge key={metricId} variant="secondary">
                            {metricId.replaceAll('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null;
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">Evidence & Freshness</h2>
            <p className="text-sm text-muted-foreground">
              Reporting context for the authoritative financial snapshot.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">
                Snapshot Calculated
              </div>
              <div className="font-medium">
                {formatDateTime(snapshot.calculatedAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Latest Evidence
              </div>
              <div className="font-medium">
                {formatDateTime(snapshot.latestEvidenceAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Reporting Calendar
              </div>
              <div className="font-medium">
                FY starts month{' '}
                {snapshot.reportingPeriod.financialYearStartMonth}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Evidence Standard
              </div>
              <div className="font-medium">E0–E4 authoritative ladder</div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ScanLine className="h-4 w-4" />
        <span>
          Live authoritative evidence only. Missing evidence is never converted
          into a financial value.
        </span>
        <Users className="ml-2 h-4 w-4" />
        <span>{scopeLabel(snapshot)}</span>
      </div>
    </div>
  );
}
