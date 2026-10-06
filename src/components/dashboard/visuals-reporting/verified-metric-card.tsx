'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VisualsReportingMetric } from '@/lib/schemas/visuals-reporting';

type Props = {
  title: string;
  metric: VisualsReportingMetric;
};

function formatValue(metric: VisualsReportingMetric) {
  if (metric.value === null) return '—';

  if (metric.unit === 'PERCENT') {
    return `${metric.value.toFixed(1)}%`;
  }

  if (metric.unit === 'RAND') {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(metric.value);
  }

  return metric.value.toLocaleString('en-ZA');
}

export function VerifiedMetricCard({ title, metric }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge variant="outline">{metric.status.replaceAll('_', ' ')}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(metric)}</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Evidence {metric.evidenceLevel} · {metric.evidenceCount.toLocaleString('en-ZA')} records
        </p>
        {metric.statusDetail && (
          <p className="mt-2 text-xs text-muted-foreground">
            {metric.statusDetail}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
