import { ScanAnalytics } from '@/components/dashboard/scan-analytics';

export default function ScanStatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Scan Statistics
        </h1>
        <p className="text-muted-foreground">
          Authoritative Point-of-Decision QR exposure and qualifying shopper
          session intelligence for your authenticated retail network scope.
        </p>
      </div>

      <ScanAnalytics />
    </div>
  );
}
