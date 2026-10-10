import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Cloud,
  Info,
  LockKeyhole,
  Server,
} from 'lucide-react';

export default function CloudRuntimePage() {
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
          Cloud &amp; AI Runtime
        </h1>

        <p className="mt-2 max-w-4xl text-muted-foreground">
          Platform-managed infrastructure and AI runtime supporting the
          centrally delivered iNteract application.
        </p>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex gap-3">
          <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

          <div>
            <h2 className="font-semibold text-blue-950">
              Platform-managed runtime
            </h2>

            <p className="mt-1 text-sm text-blue-900">
              iNteract's application runtime is managed through its controlled
              cloud and application-hosting environment. This page does not
              provide a browser-based credential configuration mechanism.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <Server className="h-5 w-5" />
          <h2 className="mt-3 font-semibold">Application Runtime</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Firebase App Hosting and the supporting Google Cloud environment
            provide the managed production runtime for the iNteract
            application.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <Bot className="h-5 w-5" />
          <h2 className="mt-3 font-semibold">AI Runtime</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            iNteract's governed AI capabilities use the platform's managed AI
            runtime and application configuration. AI policy and governance
            remain controlled through the dedicated AI Rules capability.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex gap-3">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <h2 className="font-semibold">Secrets boundary</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              API keys, service credentials and private keys are not collected
              through this screen. Production secrets belong in controlled
              infrastructure and secrets-management mechanisms.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <h2 className="font-semibold">Scope boundary</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              This capability describes platform integration and runtime
              context. Operational availability, incidents and runtime health
              belong to Platform Health rather than System Connections.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
