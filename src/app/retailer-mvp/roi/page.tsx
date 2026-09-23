import { AuthoritativeProfitRoi } from '@/components/dashboard/authoritative-profit-roi';

export default function ProfitRoiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profit & ROI</h1>
        <p className="text-muted-foreground">
          Authoritative financial reconciliation of iNteract investment,
          retailer-owned Retail Media value and measurable commerce outcomes
          for your authenticated retail network scope.
        </p>
      </div>

      <AuthoritativeProfitRoi />
    </div>
  );
}
