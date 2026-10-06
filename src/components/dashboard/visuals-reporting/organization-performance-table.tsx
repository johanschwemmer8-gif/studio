'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  VisualsReportingMetric,
  VisualsReportingOrganizationRow,
} from '@/lib/schemas/visuals-reporting';

type Props = {
  rows: VisualsReportingOrganizationRow[];
};

function value(metric: VisualsReportingMetric) {
  if (metric.value === null) return '—';
  if (metric.unit === 'PERCENT') return `${metric.value.toFixed(1)}%`;
  return metric.value.toLocaleString('en-ZA');
}

export function OrganizationPerformanceTable({ rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisational Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No organisational comparison evidence is available for this scope.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scope</TableHead>
                <TableHead>QR exposures</TableHead>
                <TableHead>Shopper sessions</TableHead>
                <TableHead>Exposure to session</TableHead>
                <TableHead>ARI interactions</TableHead>
                <TableHead>Decision signals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.scope.level}:${row.displayName}`}>
                  <TableCell className="font-medium">{row.displayName}</TableCell>
                  <TableCell>{value(row.qrExposures)}</TableCell>
                  <TableCell>{value(row.qualifyingShopperSessions)}</TableCell>
                  <TableCell>{value(row.exposureToSessionRatePercent)}</TableCell>
                  <TableCell>{value(row.ariInteractions)}</TableCell>
                  <TableCell>{value(row.decisionSignals)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
