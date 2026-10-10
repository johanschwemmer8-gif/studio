'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  FileClock,
  Gauge,
  Server,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import {
  getPlatformHealthSnapshot,
  type PlatformHealthSnapshot,
} from '@/lib/platform-health-server';

function StatusBadge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: 'neutral' | 'available' | 'warning';
}) {
  const classes =
    variant === 'available'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : variant === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {children}
    </span>
  );
}

export default function PlatformHealthPage() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<PlatformHealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        if (!cancelled) {
          setSnapshot(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const idToken = await user.getIdToken();
        const result = await getPlatformHealthSnapshot(idToken);

        if (!cancelled) {
          setSnapshot(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSnapshot(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Platform Health is currently unavailable.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading Platform Health…
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Platform Health
        </h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {error ?? 'Platform Health evidence is unavailable.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Platform Health
        </h1>
        <p className="mt-2 max-w-4xl text-muted-foreground">
          Platform Operator visibility into production runtime, monitoring
          coverage, operational evidence and incident readiness.
        </p>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
          <div>
            <h2 className="font-semibold text-blue-950">
              Health assertion boundary
            </h2>
            <p className="mt-1 text-sm text-blue-900">
              Platform Health reports only states supported by authoritative
              operational evidence. Missing monitoring is reported as missing
              monitoring; it is not interpreted as evidence that the platform
              is healthy or unhealthy.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Production Runtime</h2>
          <p className="text-sm text-muted-foreground">
            Authoritative runtime context for the deployed iNteract
            application.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-5">
            <Cloud className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">Hosting</p>
            <p className="font-semibold">{snapshot.runtime.hosting}</p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <Server className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">
              Cloud platform
            </p>
            <p className="font-semibold">
              {snapshot.runtime.cloudPlatform}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <Activity className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">
              Runtime health
            </p>
            <div className="mt-1">
              <StatusBadge variant="warning">
                Authoritative health feed not configured
              </StatusBadge>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          {snapshot.runtime.healthMessage}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Monitoring Coverage</h2>
          <p className="text-sm text-muted-foreground">
            Monitoring coverage is shown independently from runtime health so
            that missing telemetry cannot create false assurance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {snapshot.monitoring.capabilities.map(capability => (
            <div
              key={capability.id}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{capability.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {capability.detail}
                  </p>
                </div>
                <Gauge className="h-5 w-5 shrink-0" />
              </div>

              <div className="mt-4">
                <StatusBadge variant="warning">
                  Authoritative monitoring not configured
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-semibold">
                Operational Events & Incidents
              </h2>
              <div className="mt-3">
                <StatusBadge variant="warning">
                  Incident register not configured
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {snapshot.incidents.message}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                This does not mean that no incidents have occurred. It means
                Platform Health does not yet have an authoritative incident
                source from which to make that assertion.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex gap-3">
            <FileClock className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-semibold">
                Security & Governance Evidence
              </h2>
              <div className="mt-3">
                <StatusBadge variant="available">
                  Audit evidence architecture available
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {snapshot.governanceEvidence.message}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-semibold">Operational Authority Boundary</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Firebase App Hosting and Google Cloud remain the managed runtime
              and infrastructure authorities. Platform Health is iNteract's
              operational visibility and evidence surface. Update Manager
              governs application change, System Connections governs external
              integration readiness, and Test Laboratory provides deliberate
              capability testing.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-dashed p-5">
        <h2 className="font-semibold">ISO 27001 Monitoring Path</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Platform Health is designed to become an operational evidence surface
          for logging and monitoring, availability, incident detection,
          operational events and control-effectiveness evidence as authoritative
          monitoring sources are implemented and validated.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Evidence snapshot generated {snapshot.calculatedAt}.
        </p>
      </section>
    </div>
  );
}
