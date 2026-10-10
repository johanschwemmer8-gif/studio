'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  GitBranch,
  History,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  Store,
  TestTube2,
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import {
  getUpdateManagerSnapshot,
  type UpdateManagerSnapshot,
} from '@/lib/update-manager-server';

type SummaryCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {detail}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function UpdateManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<UpdateManagerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSnapshot() {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const result = await getUpdateManagerSnapshot(idToken);
      setData(result);
    } catch (loadError) {
      console.error('[Update Manager] Load failed:', loadError);
      setData(null);
      setError(
        'Update Manager operational context could not be loaded.'
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

    void loadSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Update Manager
        </h1>
        <p className="text-muted-foreground">
          Loading platform change context…
        </p>
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
            Update Manager
          </h1>
          <p className="mt-2 text-muted-foreground">
            Release visibility, retailer impact and change governance.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-medium text-amber-900">
            Operational context unavailable
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadSnapshot()}
            className="mt-4 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            Update Manager
          </h1>

          <p className="mt-2 max-w-4xl text-muted-foreground">
            Platform release visibility, retailer-impact awareness and
            change-governance context for centrally delivered iNteract
            application updates.
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Operational snapshot calculated{' '}
            {new Date(data.calculatedAt).toLocaleString('en-ZA')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSnapshot()}
          className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Platform Delivery Model
          </h2>
          <p className="text-sm text-muted-foreground">
            Application code is centrally deployed. Update Manager does
            not independently deploy retailer dashboards.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Source"
            value={data.deliveryModel.source}
            detail="Authoritative application source branch"
            icon={GitBranch}
          />
          <SummaryCard
            label="Runtime"
            value={data.deliveryModel.runtime}
            detail="Production application delivery runtime"
            icon={Server}
          />
          <SummaryCard
            label="Deployment Model"
            value="Central"
            detail={data.deliveryModel.deploymentMode}
            icon={Boxes}
          />
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div>
              <p className="font-medium text-blue-950">
                Deployment authority boundary
              </p>
              <p className="mt-1 text-sm text-blue-900">
                Production application releases are delivered through
                the controlled source and hosting pipeline. This screen
                provides governance and impact visibility; it is not a
                parallel deployment mechanism.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Retailer Impact Estate
          </h2>
          <p className="text-sm text-muted-foreground">
            Canonical tenant estate potentially affected by centrally
            delivered platform changes. Test tenants remain explicitly
            separated from production tenants.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Tenants"
            value={data.estate.totalTenants}
            detail="Canonical tenant estate"
            icon={Store}
          />
          <SummaryCard
            label="Production Tenants"
            value={data.estate.productionTenants}
            detail="Production commercial estate"
            icon={CheckCircle2}
          />
          <SummaryCard
            label="Test Tenants"
            value={data.estate.testTenants}
            detail="Excluded from production estate counts"
            icon={TestTube2}
          />
          <SummaryCard
            label="Active Tenants"
            value={data.estate.activeTenants}
            detail="Lifecycle status = ACTIVE"
            icon={ShieldCheck}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Retailer</th>
                <th className="px-4 py-3 font-medium">Tenant Type</th>
                <th className="px-4 py-3 font-medium">Lifecycle</th>
                <th className="px-4 py-3 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {data.estate.tenants.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No canonical tenants are currently available.
                  </td>
                </tr>
              ) : (
                data.estate.tenants.map(tenant => (
                  <tr
                    key={tenant.retailerId}
                    className="border-b last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {tenant.retailerName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {tenant.retailerId}
                      </div>
                    </td>
                    <td className="px-4 py-4 capitalize">
                      {tenant.tenantType}
                    </td>
                    <td className="px-4 py-4">
                      {tenant.lifecycleStatus}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/admin/view/${encodeURIComponent(
                          tenant.retailerId
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

        <p className="text-xs text-muted-foreground">
          Lifecycle summary: {data.estate.activeTenants} active ·{' '}
          {data.estate.offboardingTenants} offboarding ·{' '}
          {data.estate.suspendedTenants} suspended ·{' '}
          {data.estate.decommissionedTenants} decommissioned
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start gap-3">
            <History className="mt-0.5 h-5 w-5" />
            <div>
              <h2 className="font-semibold">
                Release &amp; Change Governance
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Significant platform changes should be classified as
                Feature, Fix, Security, UX, Integration, or Data/Schema
                changes and retained as controlled change evidence.
              </p>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-sm font-medium text-amber-950">
                      Release register not configured
                    </p>
                    <p className="mt-1 text-xs text-amber-900">
                      {data.releaseRegister.message} No release history
                      has been fabricated or inferred.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start gap-3">
            <Settings2 className="mt-0.5 h-5 w-5" />
            <div>
              <h2 className="font-semibold">
                Feature Availability
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tenant-specific capability activation must use an
                explicit, authoritative entitlement model when such a
                model is introduced.
              </p>

              <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  Not configured
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.featureAvailability.message} Update Manager does
                  not invent feature flags or tenant entitlements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">Change Evidence</h2>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
          iNteract already maintains Platform Operator audit evidence for
          controlled administrative actions. Formal application release
          records, approvals, testing evidence, implementation references
          and rollback information will be incorporated into the
          controlled change-management programme rather than represented
          here before an authoritative release register exists.
        </p>
      </section>
    </div>
  );
}
