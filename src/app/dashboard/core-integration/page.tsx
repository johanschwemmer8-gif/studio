'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cloud,
  Database,
  Info,
  LockKeyhole,
  Network,
  Server,
} from 'lucide-react';

type CapabilityCardProps = {
  title: string;
  description: string;
  status: string;
  statusDetail: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function CapabilityCard({
  title,
  description,
  status,
  statusDetail,
  href,
  icon: Icon,
}: CapabilityCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="rounded-lg border bg-muted/40 p-2.5">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border bg-muted/20 p-4">
        <p className="text-sm font-medium">{status}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {statusDetail}
        </p>
      </div>

      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        View capability
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function CoreIntegrationPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          System Connections
        </h1>

        <p className="mt-2 max-w-4xl text-muted-foreground">
          Platform-level visibility and governance for external-system
          integration capabilities used by iNteract.
        </p>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex gap-3">
          <Network className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

          <div>
            <h2 className="font-semibold text-blue-950">
              Connection authority boundary
            </h2>

            <p className="mt-1 text-sm text-blue-900">
              System Connections records capability and readiness context. It
              does not represent an external system as configured, connected,
              tested or healthy unless that state is supported by an
              authoritative integration mechanism and verifiable evidence.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Integration Capability Register
          </h2>

          <p className="text-sm text-muted-foreground">
            Current platform integration capabilities and their truthful
            production-readiness state.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <CapabilityCard
            title="ERP"
            description="Enterprise resource planning capability for stock, pricing and relevant enterprise data."
            status="Production connector not configured"
            statusDetail="A provider-specific connector must be implemented and validated before a live ERP connection can be represented."
            href="/dashboard/core-integration/erp"
            icon={Database}
          />

          <CapabilityCard
            title="PIM"
            description="Product information management capability for authoritative catalogue and product data."
            status="Production connector not configured"
            statusDetail="A provider-specific connector must be implemented and validated before a live PIM connection can be represented."
            href="/dashboard/core-integration/pim"
            icon={Boxes}
          />

          <CapabilityCard
            title="Cloud & AI Runtime"
            description="Managed infrastructure and AI runtime supporting the iNteract application."
            status="Platform-managed"
            statusDetail="Runtime infrastructure is managed through the controlled platform environment rather than browser-entered credentials."
            href="/dashboard/core-integration/cloud"
            icon={Cloud}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <h2 className="font-semibold">Credential Handling</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Raw external-system API keys, secrets and private keys are not
                collected through these Platform Operator screens. Production
                credentials must use an approved secrets-management and
                integration architecture.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <h2 className="font-semibold">Pilot Integration Principle</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                A production connector is introduced only against a defined
                retailer requirement, provider contract and testable technical
                integration boundary.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <h2 className="font-semibold">Operational boundary</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              System Connections answers what external integration
              capabilities exist and what their authoritative readiness state
              is. Platform Health separately answers whether the iNteract
              platform is operating correctly.
            </p>
          </div>
        </div>
      </section>

      <div className="hidden">
        <Server />
      </div>
    </div>
  );
}
