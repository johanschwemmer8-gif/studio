'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  MousePointerClick,
  RefreshCw,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import {
  getPortfolioRoi,
  type PortfolioEvidenceState,
  type PortfolioRoiResult,
} from '@/lib/portfolio-roi-server';

function formatNumber(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('en-ZA');
}

function formatCurrency(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

function evidenceLabel(status: PortfolioEvidenceState): string {
  switch (status) {
    case 'MEASURED':
      return 'Measured';
    case 'NO_ACTIVITY':
      return 'No activity';
    case 'LIMITED_EVIDENCE':
      return 'Limited evidence';
    case 'REQUIRES_POS_DATA':
      return 'Requires POS data';
    case 'INSUFFICIENT_EVIDENCE':
      return 'Insufficient evidence';
    case 'UNAVAILABLE':
    default:
      return 'Unavailable';
  }
}

function EvidenceBadge({ status }: { status: PortfolioEvidenceState }) {
  const measured = status === 'MEASURED';
  const noActivity = status === 'NO_ACTIVITY';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        measured
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : noActivity
            ? 'border-slate-200 bg-slate-50 text-slate-700'
            : 'border-amber-200 bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      {evidenceLabel(status)}
    </span>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function PortfolioRoiPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PortfolioRoiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPortfolio() {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const result = await getPortfolioRoi(idToken, 'MONTHLY');
      setData(result);
    } catch (loadError) {
      console.error('[Portfolio ROI] Load failed:', loadError);
      setData(null);
      setError(
        'Portfolio evidence could not be loaded. No performance values have been substituted.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      setError('Platform Operator authentication is required.');
      return;
    }

    void loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Portfolio ROI
          </h1>
          <p className="mt-2 text-muted-foreground">
            Loading authoritative portfolio evidence…
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 p-6">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Retailers
        </Link>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Portfolio ROI
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Cross-retailer performance, capability monitoring and evidence
            derived from authoritative retailer data.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-medium text-amber-900">
            Portfolio evidence unavailable
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {error ??
              'Authoritative portfolio evidence is not currently available.'}
          </p>
          <button
            type="button"
            onClick={() => void loadPortfolio()}
            className="mt-4 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const financialRetailers = data.retailers.filter(
    retailer => retailer.financialEvidenceStatus === 'MEASURED'
  );

  const measuredNetBenefit =
    financialRetailers.length === 0
      ? null
      : financialRetailers.reduce(
          (total, retailer) =>
            total + (retailer.netFinancialBenefit ?? 0),
          0
        );

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Retailers
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight">
            Portfolio ROI
          </h1>

          <p className="mt-2 max-w-4xl text-muted-foreground">
            iNteract&apos;s cross-retailer performance, capability-monitoring
            and evidence layer, derived from authoritative retailer evidence.
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Reporting granularity: {data.granularity} · Calculated{' '}
            {new Date(data.calculatedAt).toLocaleString('en-ZA')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPortfolio()}
          className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh evidence
        </button>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Portfolio Overview</h2>
          <p className="text-sm text-muted-foreground">
            Estate size and current evidence coverage. Missing evidence is
            shown explicitly and is never substituted with zero.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Retailers in Portfolio"
            value={formatNumber(data.portfolio.totalRetailers)}
            detail={`${data.portfolio.productionRetailers} production tenant(s)`}
            icon={Building2}
          />
          <MetricCard
            label="Active Retailers"
            value={formatNumber(data.portfolio.activeRetailers)}
            detail="Canonical tenant lifecycle = ACTIVE"
            icon={CheckCircle2}
          />
          <MetricCard
            label="Shopper Evidence Coverage"
            value={`${data.portfolio.retailersWithShopperEvidence}/${data.portfolio.totalRetailers}`}
            detail="Retailers with measurable QR exposure evidence"
            icon={MousePointerClick}
          />
          <MetricCard
            label="Financial Evidence Coverage"
            value={`${data.portfolio.retailersWithFinancialEvidence}/${data.portfolio.totalRetailers}`}
            detail="Retailers with supportable ROI evidence"
            icon={CircleDollarSign}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Point-of-Decision Evidence
          </h2>
          <p className="text-sm text-muted-foreground">
            Measured activity aggregated only from retailers whose
            authoritative evidence supports the metric.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="QR Exposures"
            value={formatNumber(data.measuredActivity.qrExposures)}
            detail="Measured portfolio exposure"
            icon={Activity}
          />
          <MetricCard
            label="Shopper Sessions"
            value={formatNumber(
              data.measuredActivity.qualifyingShopperSessions
            )}
            detail="Qualifying shopper sessions"
            icon={BarChart3}
          />
          <MetricCard
            label="ARI Interactions"
            value={formatNumber(data.measuredActivity.ariInteractions)}
            detail="Measured assisted interactions"
            icon={Sparkles}
          />
          <MetricCard
            label="Decision Signals"
            value={formatNumber(
              data.measuredActivity.supportedDecisionSignals
            )}
            detail="Supported decision signals"
            icon={MousePointerClick}
          />
          <MetricCard
            label="Verified Purchases"
            value={formatNumber(data.measuredActivity.verifiedPurchases)}
            detail={`${data.portfolio.retailersWithCommerceEvidence} retailer(s) with commerce evidence`}
            icon={ShoppingCart}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Financial Evidence Readiness
          </h2>
          <p className="text-sm text-muted-foreground">
            Financial evidence is reported only where the retailer&apos;s
            canonical Profit &amp; ROI evidence supports it. Portfolio ROI
            percentages are not averaged across retailers.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Retailers with Financial Evidence"
            value={`${data.portfolio.retailersWithFinancialEvidence}/${data.portfolio.totalRetailers}`}
            detail="Evidence coverage across the canonical tenant estate"
            icon={CircleDollarSign}
          />
          <MetricCard
            label="Measured Net Financial Benefit"
            value={formatCurrency(measuredNetBenefit)}
            detail="Sum of measured tenant net financial benefit only"
            icon={CircleDollarSign}
          />
          <MetricCard
            label="Portfolio ROI %"
            value="Not aggregated"
            detail="Retailer ROI percentages are not averaged because that would misstate portfolio economics"
            icon={BarChart3}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Retailer Evidence Register
          </h2>
          <p className="text-sm text-muted-foreground">
            Internal cross-retailer evidence view. Retailer-specific
            commercial performance must not be disclosed externally without
            authorization.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Retailer</th>
                <th className="px-4 py-3 font-medium">Lifecycle</th>
                <th className="px-4 py-3 font-medium">Shopper Evidence</th>
                <th className="px-4 py-3 font-medium">Commerce Evidence</th>
                <th className="px-4 py-3 font-medium">Financial Evidence</th>
                <th className="px-4 py-3 text-right font-medium">
                  Verified Purchases
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Net Benefit
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Retailer ROI
                </th>
                <th className="px-4 py-3 font-medium">Admin</th>
              </tr>
            </thead>

            <tbody>
              {data.retailers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No canonical retailer tenants are currently available.
                  </td>
                </tr>
              ) : (
                data.retailers.map(retailer => (
                  <tr
                    key={retailer.retailerId}
                    className="border-b last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {retailer.retailerName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {retailer.retailerId}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {retailer.lifecycleStatus}
                    </td>

                    <td className="px-4 py-4">
                      <EvidenceBadge
                        status={retailer.shopperEvidenceStatus}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <EvidenceBadge
                        status={retailer.commerceEvidenceStatus}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <EvidenceBadge
                        status={retailer.financialEvidenceStatus}
                      />
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums">
                      {formatNumber(retailer.verifiedPurchases)}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums">
                      {formatCurrency(retailer.netFinancialBenefit)}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums">
                      {formatPercentage(retailer.roiPercentage)}
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/admin/view/${encodeURIComponent(
                          retailer.retailerName
                        )}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        View retailer
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">Evidence &amp; Benchmarking</h2>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
          This internal evidence register is the foundation for future
          aggregated and anonymised benchmarks, case studies and commercial
          proof. No retailer-specific performance should be used externally
          unless disclosure has been specifically authorised.
        </p>
      </section>
    </div>
  );
}
