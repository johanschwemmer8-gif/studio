'use client';

import { Badge } from '@/components/ui/badge';
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

type PodPerformance = VisualsReportingResponse['pointOfDecisionPerformance'];

type Props = {
  performance: PodPerformance;
};

export function PodPerformance({ performance }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Point-of-Decision Performance</CardTitle>
          <Badge variant="outline">{performance.status.replaceAll('_', ' ')}</Badge>
        </div>
        {performance.statusDetail && (
          <p className="text-sm text-muted-foreground">{performance.statusDetail}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {performance.funnel.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No Point-of-Decision funnel evidence is available for this scope and period.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>Unique sessions</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Evidence basis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.funnel.map((stage) => (
                <TableRow key={stage.stage}>
                  <TableCell className="font-medium">{stage.stage}</TableCell>
                  <TableCell>{stage.uniqueSessions.toLocaleString('en-ZA')}</TableCell>
                  <TableCell>{stage.rate.toFixed(1)}%</TableCell>
                  <TableCell>
                    {stage.numerator.toLocaleString('en-ZA')} / {stage.denominator.toLocaleString('en-ZA')} {stage.denominatorName}
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
