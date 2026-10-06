'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getVisualsReporting } from '@/ai/flows/get-visuals-reporting';
import { getVisualsReportingNavigation } from '@/ai/flows/get-visuals-reporting-navigation';
import { generateVisualsReportingBrief } from '@/ai/flows/generate-visuals-reporting-brief';
import { useAuth } from '@/context/auth-context';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import type {
  VisualsReportingNavigation,
  VisualsReportingRequest,
  VisualsReportingResponse,
} from '@/lib/schemas/visuals-reporting';
import { scopeKey } from '@/lib/visuals-reporting';
import { serializeVisualsReportingCsv } from '@/lib/visuals-reporting-csv';
import type { OverviewScope } from '@/lib/schemas/overview-intelligence';
import { VerifiedMetricCard } from './verified-metric-card';
import { ReportingTrendChart } from './reporting-trend-chart';
import { OrganizationPerformanceTable } from './organization-performance-table';
import { PodPerformance } from './pod-performance';
import { PodDiagnostics } from './pod-diagnostics';
import { ActivationPerformanceTable } from './activation-performance-table';
import { VisualsReportingBrief } from './visuals-reporting-brief';
import type { VisualsReportingBrief as VisualsReportingBriefType } from '@/lib/schemas/visuals-reporting-brief';

type Granularity = VisualsReportingRequest['granularity'];
type ReportingLevel = 'brand' | 'division' | 'region' | 'area' | 'store';

const INITIAL_GRANULARITY: Granularity = 'MONTHLY';
const INITIAL_REPORTING_LEVEL: ReportingLevel = 'brand';

export function VisualsReportingWorkspace() {
  const { user, loading: authLoading } = useAuth();

  const [navigation, setNavigation] =
    useState<VisualsReportingNavigation | null>(null);
  const [scope, setScope] = useState<OverviewScope | null>(null);
  const [reportingLevel, setReportingLevel] =
    useState<ReportingLevel>(INITIAL_REPORTING_LEVEL);
  const [granularity, setGranularity] =
    useState<Granularity>(INITIAL_GRANULARITY);

  const [report, setReport] =
    useState<VisualsReportingResponse | null>(null);
  const [navigationLoading, setNavigationLoading] =
    useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const loading = navigationLoading || reportLoading;
  const reportRequestSequence = useRef(0);
  const [error, setError] = useState<string | null>(null);

  const [brief, setBrief] =
    useState<VisualsReportingBriefType | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const loadNavigation = useCallback(
    async (selectedBrandId?: string) => {
      if (!user) return null;

      const idToken = await user.getIdToken();
      return getVisualsReportingNavigation({
        idToken,
        selectedBrandId,
      });
    },
    [user],
  );

  const loadReport = useCallback(async () => {
    if (!user || !scope) return;

    const requestSequence = ++reportRequestSequence.current;

    setReportLoading(true);
    setError(null);
    setBrief(null);
    setReport(null);

    try {
      const idToken = await user.getIdToken();

      const result = await getVisualsReporting({
        idToken,
        request: {
          scope,
          granularity,
        },
      });

      if (requestSequence !== reportRequestSequence.current) {
        return;
      }

      setReport(result);
    } catch (err) {
      if (requestSequence !== reportRequestSequence.current) {
        return;
      }

      console.error('Visuals reporting load failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'VISUALS_REPORTING_LOAD_FAILED',
      );
      setReport(null);
    } finally {
      if (requestSequence === reportRequestSequence.current) {
        setReportLoading(false);
      }
    }
  }, [user, scope, granularity]);

  const handleGenerateBrief = async () => {
    if (!user || !report) return;

    setBriefLoading(true);

    try {
      const idToken = await user.getIdToken();

      const result = await generateVisualsReportingBrief({
        idToken,
        request: {
          scope: report.scope,
          granularity: report.reportingPeriod.granularity,
        },
      });

      setBrief(result);
    } catch (err) {
      console.error(
        'Visuals reporting brief generation failed:',
        err,
      );
      setBrief(null);
    } finally {
      setBriefLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!report) return;

    const csv = serializeVisualsReportingCsv(report);
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const exportScope = scopeKey(report.scope).replace(
      /[^a-zA-Z0-9_-]+/g,
      '-',
    );

    link.href = url;
    link.download =
      `interact-visuals-reporting-${exportScope}-` +
      `${report.reportingPeriod.granularity.toLowerCase()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    const initialise = async () => {
      setNavigationLoading(true);
      setError(null);

      try {
        const result = await loadNavigation();

        if (cancelled || !result) return;

        setNavigation(result);
        setReportingLevel(INITIAL_REPORTING_LEVEL);
        setScope(result.selectedBrand.scope);
      } catch (err) {
        if (cancelled) return;

        console.error(
          'Visuals reporting navigation load failed:',
          err,
        );
        setError(
          err instanceof Error
            ? err.message
            : 'VISUALS_REPORTING_NAVIGATION_LOAD_FAILED',
        );
      } finally {
        if (!cancelled) {
          setNavigationLoading(false);
        }
      }
    };

    void initialise();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, loadNavigation]);

  useEffect(() => {
    if (scope) {
      void loadReport();
    }
  }, [scope, granularity, loadReport]);

  const levelItems =
    reportingLevel === 'division'
      ? navigation?.divisions ?? []
      : reportingLevel === 'region'
        ? navigation?.regions ?? []
        : reportingLevel === 'area'
          ? navigation?.areas ?? []
          : reportingLevel === 'store'
            ? navigation?.stores ?? []
            : navigation
              ? [navigation.selectedBrand]
              : [];

  const handleBrandChange = async (brandId: string) => {
    setNavigationLoading(true);
    setError(null);
    setBrief(null);

    try {
      const result = await loadNavigation(brandId);

      if (!result) return;

      setNavigation(result);
      setReportingLevel('brand');
      setScope(result.selectedBrand.scope);
    } catch (err) {
      console.error(
        'Visuals reporting brand navigation failed:',
        err,
      );
      setError(
        err instanceof Error
          ? err.message
          : 'VISUALS_REPORTING_NAVIGATION_LOAD_FAILED',
      );
    } finally {
      setNavigationLoading(false);
    }
  };

  const handleReportingLevelChange = (
    value: ReportingLevel,
  ) => {
    if (!navigation) return;

    if (value === 'brand') {
      setReportingLevel(value);
      setBrief(null);
      setScope(navigation.selectedBrand.scope);
      return;
    }

    const items =
      value === 'division'
        ? navigation.divisions
        : value === 'region'
          ? navigation.regions
          : value === 'area'
            ? navigation.areas
            : navigation.stores;

    if (items.length === 0) return;

    setReportingLevel(value);
    setBrief(null);
    setScope(items[0].scope);
  };

  if (authLoading || (loading && !navigation)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Authentication is required to view reporting evidence.
        </CardContent>
      </Card>
    );
  }

  if (error && !report) {
    return (
      <div className="space-y-4">
        <BackButton fallback="/retailer-mvp/dashboard" />
        <Card>
          <CardContent className="space-y-4 py-6">
            <p className="text-sm font-medium">
              Reporting evidence could not be loaded.
            </p>
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
            <Button
              onClick={() => {
                if (navigation && scope) {
                  void loadReport();
                  return;
                }

                setError(null);
                setNavigationLoading(true);

                void loadNavigation()
                  .then((result) => {
                    if (!result) return;

                    setNavigation(result);
                    setReportingLevel(
                      INITIAL_REPORTING_LEVEL,
                    );
                    setScope(result.selectedBrand.scope);
                  })
                  .catch((err) => {
                    console.error(
                      'Visuals reporting navigation retry failed:',
                      err,
                    );
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'VISUALS_REPORTING_NAVIGATION_LOAD_FAILED',
                    );
                  })
                  .finally(() => {
                    setNavigationLoading(false);
                  });
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!navigation || !scope || !report) return null;

  const selectedBrandId =
    navigation.selectedBrand.scope.brandId;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BackButton fallback="/retailer-mvp/dashboard" />

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Visuals & Reporting
            </h2>
            <p className="mt-1 max-w-3xl text-muted-foreground">
              Verified reporting evidence across your authorised Brand.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {report.evidenceStatus.replaceAll('_', ' ')}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={loading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-medium">
              Verified Reporting Evidence
            </span>
            <span className="ml-2 text-muted-foreground">
              {new Date(
                report.reportingPeriod.startAt,
              ).toLocaleDateString('en-ZA')}
              {' – '}
              {new Date(
                report.reportingPeriod.endAt,
              ).toLocaleDateString('en-ZA')}
            </span>
          </div>

          <span className="text-muted-foreground">
            {report.reportingPeriod.granularity}
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Brand Portfolio</p>
          <Select
            value={selectedBrandId}
            onValueChange={(value) => {
              void handleBrandChange(value);
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Brand" />
            </SelectTrigger>
            <SelectContent>
              {navigation.brandPortfolio.map((item) => {
                const brandId = item.scope.brandId;

                if (!brandId) return null;

                return (
                  <SelectItem
                    key={brandId}
                    value={brandId}
                  >
                    {item.displayName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Reporting Level</p>
          <Select
            value={reportingLevel}
            onValueChange={(value) =>
              handleReportingLevelChange(
                value as ReportingLevel,
              )
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Reporting level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brand">
                Executive / HQ
              </SelectItem>
              <SelectItem
                value="division"
                disabled={navigation.divisions.length === 0}
              >
                Division
              </SelectItem>
              <SelectItem
                value="region"
                disabled={navigation.regions.length === 0}
              >
                Region
              </SelectItem>
              <SelectItem
                value="area"
                disabled={navigation.areas.length === 0}
              >
                Area
              </SelectItem>
              <SelectItem
                value="store"
                disabled={navigation.stores.length === 0}
              >
                Store
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            Organisational Unit
          </p>
          <Select
            value={scopeKey(scope)}
            onValueChange={(value) => {
              const selected = levelItems.find(
                (item) => scopeKey(item.scope) === value,
              );

              if (selected) {
                setBrief(null);
                setScope(selected.scope);
              }
            }}
            disabled={loading || levelItems.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Organisational unit" />
            </SelectTrigger>
            <SelectContent>
              {levelItems.map((item) => (
                <SelectItem
                  key={scopeKey(item.scope)}
                  value={scopeKey(item.scope)}
                >
                  {item.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            Reporting Period
          </p>
          <Select
            value={granularity}
            onValueChange={(value) =>
              setGranularity(value as Granularity)
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Reporting period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YTD">
                Year to date
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <VisualsReportingBrief
        brief={brief}
        loading={briefLoading}
        onGenerate={() => void handleGenerateBrief()}
      />
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Network Performance</h3>
          <p className="text-sm text-muted-foreground">
            Verified activity measured within the selected reporting scope and period.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <VerifiedMetricCard
            title="QR Exposures"
            metric={report.networkPerformance.qrExposures}
          />
          <VerifiedMetricCard
            title="Qualifying Shopper Sessions"
            metric={report.networkPerformance.qualifyingShopperSessions}
          />
          <VerifiedMetricCard
            title="Exposure-to-Session Rate"
            metric={report.networkPerformance.exposureToSessionRatePercent}
          />
          <VerifiedMetricCard
            title="ARI Interactions"
            metric={report.networkPerformance.ariInteractions}
          />
          <VerifiedMetricCard
            title="Decision Signals"
            metric={report.networkPerformance.decisionSignals}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Performance Trends</h3>
          <p className="text-sm text-muted-foreground">
            Measured evidence over time. Missing evidence is not represented as zero.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ReportingTrendChart
            title="QR Exposures"
            description="Verified QR exposure evidence by reporting period."
            data={report.networkPerformance.qrExposureTrend}
          />
          <ReportingTrendChart
            title="Qualifying Shopper Sessions"
            description="Verified qualifying shopper sessions by reporting period."
            data={report.networkPerformance.qualifyingSessionTrend}
          />
          <ReportingTrendChart
            title="ARI Interactions"
            description="Verified ARI interaction evidence by reporting period."
            data={report.networkPerformance.ariInteractionTrend}
          />
          <ReportingTrendChart
            title="Decision Signals"
            description="Verified shopper decision signals by reporting period."
            data={report.networkPerformance.decisionSignalTrend}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Organisational Performance</h3>
          <p className="text-sm text-muted-foreground">
            Verified performance across authorised child scopes.
          </p>
        </div>
        <OrganizationPerformanceTable rows={report.organizationalPerformance} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Point-of-Decision Performance</h3>
          <p className="text-sm text-muted-foreground">
            Verified shopper progression and diagnostic evidence at the point of decision.
          </p>
        </div>
        <PodPerformance performance={report.pointOfDecisionPerformance} />
        <PodDiagnostics performance={report.pointOfDecisionPerformance} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Campaign & Activation Performance</h3>
          <p className="text-sm text-muted-foreground">
            Verified activation-level evidence available within the selected scope.
          </p>
        </div>
        <ActivationPerformanceTable rows={report.campaignActivationPerformance} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Commerce Outcomes</h3>
          <p className="text-sm text-muted-foreground">
            Verified commerce evidence where authoritative POS-linked data is available.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <VerifiedMetricCard
            title="Verified Purchases"
            metric={report.commerceOutcomes.verifiedPurchases}
          />
          <VerifiedMetricCard
            title="Associated Revenue"
            metric={report.commerceOutcomes.associatedRevenue}
          />
          <VerifiedMetricCard
            title="Conversion Rate"
            metric={report.commerceOutcomes.conversionRatePercent}
          />
          <VerifiedMetricCard
            title="Average Basket Value"
            metric={report.commerceOutcomes.averageBasketValue}
          />
        </div>
      </section>
    </div>
  );
}
