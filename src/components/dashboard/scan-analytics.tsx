'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  QrCode,
  RefreshCw,
  ScanLine,
  Users,
} from 'lucide-react';

import { getScanStatistics } from '@/ai/flows/get-scan-statistics';
import { getOverviewMetricTrend } from '@/ai/flows/get-overview-metric-trend';
import { useAuth } from '@/context/auth-context';
import type {
  ActivationPerformanceRow,
  ScanStatisticsResponse,
} from '@/lib/schemas/scan-statistics';
import type {
  OverviewMetricTrend,
  OverviewPeriodGranularity,
} from '@/lib/schemas/overview-intelligence';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type LoadState =
  | 'LOADING'
  | 'READY'
  | 'ERROR';

const GRANULARITIES: Array<{
  value: OverviewPeriodGranularity;
  label: string;
}> = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YTD', label: 'Financial YTD' },
];

function formatCount(
  metric: ScanStatisticsResponse['qrExposures']
): string {
  if (metric.status === 'UNAVAILABLE' || metric.value === null) {
    return 'Unavailable';
  }

  return metric.value.toLocaleString();
}

function formatRate(
  metric: ScanStatisticsResponse['exposureToSessionRatePercent']
): string {
  if (metric.status === 'UNAVAILABLE' || metric.value === null) {
    return 'Unavailable';
  }

  return `${metric.value.toFixed(1)}%`;
}

function metricExplanation(
  metric:
    | ScanStatisticsResponse['qrExposures']
    | ScanStatisticsResponse['exposureToSessionRatePercent']
): string | null {
  if (metric.reason === 'INCOMPLETE_COVERAGE') {
    return 'Complete authoritative coverage could not be established.';
  }

  if (metric.reason === 'NO_DENOMINATOR') {
    return 'No authoritative QR exposures are available for this evidence window.';
  }

  return null;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'No activity';
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Unavailable';
  }

  return date.toLocaleString();
}

function formatShortDate(value: string): string {
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

function scopeLabel(
  scope: ScanStatisticsResponse['scope']
): string {
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

function rowRate(row: ActivationPerformanceRow): string {
  if (row.exposureToSessionRatePercent === null) {
    return 'Unavailable';
  }

  return `${row.exposureToSessionRatePercent.toFixed(1)}%`;
}

function trendPointValue(
  point: OverviewMetricTrend['points'][number]
): string {
  if (point.status === 'UNAVAILABLE' || point.value === null) {
    return 'Unavailable';
  }

  return point.value.toLocaleString();
}

function TrendDisplay({
  trend,
}: {
  trend: OverviewMetricTrend;
}) {
  const maximum = useMemo(() => {
    const measuredValues = trend.points
      .map(point =>
        typeof point.value === 'number' ? point.value : 0
      );

    return Math.max(...measuredValues, 1);
  }, [trend]);

  return (
    <div className="space-y-3">
      {trend.points.map(point => {
        const numericValue =
          typeof point.value === 'number' ? point.value : 0;

        const width =
          point.status === 'UNAVAILABLE'
            ? 0
            : Math.max((numericValue / maximum) * 100, numericValue > 0 ? 2 : 0);

        return (
          <div
            key={`${point.periodStart}-${point.periodEnd}`}
            className="grid grid-cols-[minmax(100px,150px)_1fr_minmax(70px,auto)] items-center gap-3"
          >
            <div className="text-xs text-muted-foreground">
              {formatShortDate(point.periodStart)}
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${width}%` }}
              />
            </div>

            <div className="text-right text-sm font-medium">
              {trendPointValue(point)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScanAnalytics() {
  const { user } = useAuth();

  const [statistics, setStatistics] =
    useState<ScanStatisticsResponse | null>(null);

  const [trend, setTrend] =
    useState<OverviewMetricTrend | null>(null);

  const [granularity, setGranularity] =
    useState<OverviewPeriodGranularity>('DAILY');

  const [loadState, setLoadState] =
    useState<LoadState>('LOADING');

  const [trendLoading, setTrendLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [trendError, setTrendError] =
    useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    if (!user) {
      setStatistics(null);
      setLoadState('ERROR');
      setErrorMessage(
        'Authenticated retailer access is required.'
      );
      return;
    }

    setLoadState('LOADING');
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();
      const result = await getScanStatistics(idToken);

      setStatistics(result);
      setLoadState('READY');
    } catch (error) {
      console.error('Scan Statistics load failed:', error);

      setLoadState('ERROR');
      setErrorMessage(
        'Authoritative Scan Statistics could not be loaded. No metric values have been substituted.'
      );
    }
  }, [user]);

  const loadTrend = useCallback(async () => {
    if (!user) {
      setTrend(null);
      setTrendError(
        'Authenticated retailer access is required.'
      );
      return;
    }

    setTrendLoading(true);
    setTrendError(null);

    try {
      const idToken = await user.getIdToken();

      const result = await getOverviewMetricTrend(
        idToken,
        {
          metricId: 'qr_exposures',
          granularity,
        }
      );

      setTrend(result);
    } catch (error) {
      console.error('Scan Statistics trend failed:', error);

      setTrend(null);

      const message =
        error instanceof Error ? error.message : '';

      if (message.includes('REPORTING_CALENDAR_REQUIRED')) {
        setTrendError(
          'Reporting Calendar required. Configure it in My Retail Network before using Daily, Weekly, Monthly or Financial YTD reporting periods.'
        );
      } else {
        setTrendError(
          'The authoritative QR Exposure trend is currently unavailable.'
        );
      }
    } finally {
      setTrendLoading(false);
    }
  }, [granularity, user]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  useEffect(() => {
    void loadTrend();
  }, [loadTrend]);

  if (loadState === 'LOADING' && !statistics) {
    return (
      <Card>
        <CardContent className="flex min-h-48 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading authoritative Scan Statistics…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Scan Statistics unavailable</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            {errorMessage ??
              'Authoritative Scan Statistics could not be loaded. No metric values have been substituted.'}
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadStatistics()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const noActivity =
    statistics.qrExposures.status === 'NO_ACTIVITY' &&
    statistics.qualifyingShopperSessions.status === 'NO_ACTIVITY';

  return (
    <div className="space-y-6">
      {loadState === 'ERROR' && errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Refresh failed</AlertTitle>
          <AlertDescription>
            {errorMessage} The last successfully loaded result remains visible.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Operational Scope
            </CardTitle>
            <CardDescription>
              Authoritative authenticated home scope. Scan Statistics never
              silently broadens beyond this scope.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={loadState === 'LOADING'}
            onClick={() => {
              void loadStatistics();
              void loadTrend();
            }}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                loadState === 'LOADING' ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">
            {scopeLabel(statistics.scope)}
          </Badge>

          <span className="text-sm text-muted-foreground">
            Evidence window: {formatShortDate(statistics.evidenceWindow.startAt)}
            {' – '}
            {formatShortDate(statistics.evidenceWindow.endAt)}
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Exposures
            </CardDescription>
            <CardTitle className="text-3xl">
              {formatCount(statistics.qrExposures)}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-xs text-muted-foreground">
              {metricExplanation(statistics.qrExposures) ??
                'Successful canonical QR resolutions in the evidence window.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Qualifying Shopper Sessions
            </CardDescription>
            <CardTitle className="text-3xl">
              {formatCount(
                statistics.qualifyingShopperSessions
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-xs text-muted-foreground">
              {metricExplanation(
                statistics.qualifyingShopperSessions
              ) ??
                'Sessions created only after a qualifying shopper interaction.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              Exposure → Qualifying Session Rate
            </CardDescription>
            <CardTitle className="text-3xl">
              {formatRate(
                statistics.exposureToSessionRatePercent
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-xs text-muted-foreground">
              {metricExplanation(
                statistics.exposureToSessionRatePercent
              ) ??
                'Qualifying Shopper Sessions relative to authoritative QR Exposures in the same evidence window.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {noActivity ? (
        <Alert>
          <ScanLine className="h-4 w-4" />
          <AlertTitle>No QR activity in this evidence window</AlertTitle>
          <AlertDescription>
            Complete authoritative sources establish zero QR Exposures and
            zero qualifying Shopper Sessions for the authenticated scope.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                QR Exposure Trend
              </CardTitle>
              <CardDescription>
                Authoritative QR Exposure history using the retailer Reporting
                Calendar.
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
                  disabled={trendLoading}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {trendLoading && !trend ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading authoritative trend…
            </div>
          ) : trendError ? (
            <Alert>
              <CalendarDays className="h-4 w-4" />
              <AlertTitle>Trend unavailable</AlertTitle>
              <AlertDescription>
                {trendError}
              </AlertDescription>
            </Alert>
          ) : trend ? (
            <TrendDisplay trend={trend} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No authoritative trend result is available.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activation Performance</CardTitle>
          <CardDescription>
            Performance by canonical Activation, Deployment and QR identity.
            GTIN is product context only and is not used as Scan Statistics
            identity.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {statistics.activationPerformance.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">
                No Activation performance available
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                No complete authoritative Activation-level QR evidence is
                available for this evidence window.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activation / QR Identity</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Deployment / Store</TableHead>
                    <TableHead className="text-right">
                      QR Exposures
                    </TableHead>
                    <TableHead className="text-right">
                      Qualifying Sessions
                    </TableHead>
                    <TableHead className="text-right">
                      Exposure → Session Rate
                    </TableHead>
                    <TableHead>Latest Exposure</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {statistics.activationPerformance.map(row => (
                    <TableRow
                      key={`${row.activationId}:${row.deploymentId}:${row.qrCodeId}`}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {row.activationId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          QR: {row.qrCodeId}
                        </div>
                      </TableCell>

                      <TableCell>
                        {row.campaignId}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">
                          {row.storeName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.deploymentId}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {row.qrExposures.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right">
                        {row.qualifyingShopperSessions.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right">
                        {rowRate(row)}
                      </TableCell>

                      <TableCell>
                        {formatDateTime(row.latestExposureAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <div>
              <span className="font-medium text-foreground">
                Calculated:
              </span>{' '}
              {formatDateTime(statistics.calculatedAt)}
            </div>

            <div>
              <span className="font-medium text-foreground">
                Latest Evidence:
              </span>{' '}
              {formatDateTime(statistics.latestEvidenceAt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ScanAnalytics;
