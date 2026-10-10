import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  Info,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';

export default function PimCapabilityPage() {
  return (
    <div className="space-y-8 p-6">
      <Link
        href="/dashboard/core-integration"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to System Connections
      </Link>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          PIM Integration Capability
        </h1>

        <p className="mt-2 max-w-4xl text-muted-foreground">
          Product information management integration boundary for
          authoritative catalogue and product data.
        </p>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <Boxes className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

          <div>
            <h2 className="font-semibold text-amber-950">
              Production connector not configured
            </h2>

            <p className="mt-1 text-sm text-amber-900">
              iNteract does not currently have an authoritative production PIM
              connector configured through this capability. No live connection
              is represented by this screen.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="mt-3 font-semibold">Intended capability</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A retailer-specific PIM connector may provide governed access to
            authoritative product catalogue, attribute and product-information
            data required by a defined pilot or production integration.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <LockKeyhole className="h-5 w-5" />
          <h2 className="mt-3 font-semibold">Credential boundary</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            PIM API keys, secrets and credentials are not entered or stored on
            this page. A real connector must use approved credential and
            secrets-management controls.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-semibold">Activation requirement</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Before PIM integration can be represented as configured or
              connected, iNteract requires a defined provider, authentication
              model, data contract, tenant boundary, test procedure and
              verifiable connection evidence.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
