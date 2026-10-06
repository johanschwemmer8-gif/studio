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
import type { VisualsReportingResponse } from '@/lib/schemas/visuals-reporting';

type ActivationRow = VisualsReportingResponse['campaignActivationPerformance'][number];

type Props = {
  rows: ActivationRow[];
};

export function ActivationPerformanceTable({ rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign & Activation Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No verified activation-level evidence is available for this scope and period.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Activation</TableHead>
                <TableHead>QR exposures</TableHead>
                <TableHead>Shopper sessions</TableHead>
                <TableHead>Exposure to session</TableHead>
                <TableHead>Latest exposure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.qrCodeId}>
                  <TableCell className="font-medium">{row.storeName}</TableCell>
                  <TableCell>{row.activationId}</TableCell>
                  <TableCell>{row.qrExposures.toLocaleString('en-ZA')}</TableCell>
                  <TableCell>{row.qualifyingShopperSessions.toLocaleString('en-ZA')}</TableCell>
                  <TableCell>
                    {row.exposureToSessionRatePercent === null
                      ? '—'
                      : `${row.exposureToSessionRatePercent.toFixed(1)}%`}
                  </TableCell>
                  <TableCell>
                    {row.latestExposureAt
                      ? new Date(row.latestExposureAt).toLocaleString('en-ZA')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
