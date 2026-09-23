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
import { useAuth } from '@/context/auth-context';
import type {
  ProfitRoiEvidenceReason,
  ProfitRoiMetric,
  ProfitRoiMetricStatus,
  ProfitRoiSnapshot,
} from '@/lib/schemas/profit-roi';
import type { OverviewPeriodGranularity } from '@/lib/schemas/overview-intelligence';

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
          <Badge variant="outline">E{metric.evidenceLevel}</Badge>
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
        <Badge variant="outline">E{metric.evidenceLevel}</Badge>
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
      const result = await getProfitRoiEvidence(idToken, granularity);

      setSnapshot(result);
      setLoadState('READY');
    } catch (error) {
      console.error('Profit & ROI evidence load failed:', error);
      setSnapshot(null);
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
          <Sparkles className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">
              Evidence-Bound Summary
            </h2>
            <p className="text-sm text-muted-foreground">
              Deterministic summary of the evidence currently available. AI
              interpretation will be introduced only through the separately
              controlled evidence-bound summarisation layer.
            </p>
          </div>
        </div>

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Current evidence position</AlertTitle>
          <AlertDescription>
            Attributed commerce is reported only where deterministic
            session-to-transaction evidence exists. Incremental sales, profit
            and ROI remain unavailable whenever their required baseline,
            counterfactual, margin, investment or Retail Media evidence is not
            authoritative.
          </AlertDescription>
        </Alert>
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
