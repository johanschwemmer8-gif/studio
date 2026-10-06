'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VisualsReportingResponse } from '@/lib/schemas/visuals-reporting';

type PodPerformance = VisualsReportingResponse['pointOfDecisionPerformance'];

type Props = {
  performance: PodPerformance;
};

export function PodDiagnostics({ performance }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Rejection Reasons</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {performance.rejectionReasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No verified rejection evidence.</p>
          ) : performance.rejectionReasons.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 text-sm">
              <span>{row.label}</span>
              <span>{row.count.toLocaleString('en-ZA')} · {row.sharePercent.toFixed(1)}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Purchase Barriers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {performance.purchaseBarriers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No verified purchase-barrier evidence.</p>
          ) : performance.purchaseBarriers.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 text-sm">
              <span>{row.label}</span>
              <span>{row.count.toLocaleString('en-ZA')} · {row.sharePercent.toFixed(1)}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alternative Product Movement</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {performance.alternativeProductMovement.length === 0 ? (
            <p className="text-sm text-muted-foreground">No verified alternative-product evidence.</p>
          ) : performance.alternativeProductMovement.map((row) => (
            <div key={row.gtin} className="text-sm">
              <p className="font-medium">GTIN {row.gtin}</p>
              <p className="text-muted-foreground">
                {row.uniqueSessions.toLocaleString('en-ZA')} sessions · {row.movementRatePercent.toFixed(1)}% movement · {row.verifiedPurchaseCount.toLocaleString('en-ZA')} verified purchases
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
