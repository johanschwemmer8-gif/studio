'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CircleDashed,
  Database,
  FlaskConical,
  PlayCircle,
  ServerCog,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import {
  getTestLaboratorySnapshot,
  runTestLaboratoryDiagnostic,
  type DiagnosticResult,
  type TestLaboratorySnapshot,
} from '@/lib/test-laboratory-server';

function DiagnosticIcon({ id }: { id: string }) {
  if (id === 'platform-authorization') {
    return <ShieldCheck className="h-5 w-5" />;
  }

  if (id === 'firestore-connectivity') {
    return <Database className="h-5 w-5" />;
  }

  return <ServerCog className="h-5 w-5" />;
}

function ResultBadge({
  result,
}: {
  result?: DiagnosticResult;
}) {
  if (!result) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
        <CircleDashed className="h-3.5 w-3.5" />
        NOT RUN
      </span>
    );
  }

  if (result.status === 'PASS') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        PASS
      </span>
    );
  }

  if (result.status === 'FAIL') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-800">
        <TriangleAlert className="h-3.5 w-3.5" />
        FAIL
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
      <TriangleAlert className="h-3.5 w-3.5" />
      UNAVAILABLE
    </span>
  );
}

export default function TestLaboratoryPage() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] =
    useState<TestLaboratorySnapshot | null>(null);
  const [results, setResults] = useState<
    Record<string, DiagnosticResult>
  >({});
  const [running, setRunning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const idToken = await user.getIdToken();
        const data = await getTestLaboratorySnapshot(idToken);

        if (!cancelled) {
          setSnapshot(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Test Laboratory is unavailable.'
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

  async function runDiagnostic(diagnosticId: string) {
    if (!user) {
      return;
    }

    try {
      setRunning(diagnosticId);

      const idToken = await user.getIdToken();
      const result = await runTestLaboratoryDiagnostic(
        idToken,
        diagnosticId
      );

      setResults(current => ({
        ...current,
        [diagnosticId]: result,
      }));
    } finally {
      setRunning(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading Test Laboratory…
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Test Laboratory
        </h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {error ?? 'Test Laboratory evidence is unavailable.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <div className="flex items-center gap-3">
          <FlaskConical className="h-7 w-7" />
          <h1 className="text-3xl font-semibold tracking-tight">
            Test Laboratory
          </h1>
        </div>
        <p className="mt-2 max-w-4xl text-muted-foreground">
          Deliberately execute defined production diagnostics and inspect the
          immediate evidence returned by those tests.
        </p>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
          <div>
            <h2 className="font-semibold text-blue-950">
              Test evidence boundary
            </h2>
            <p className="mt-1 text-sm text-blue-900">
              {snapshot.evidenceBoundary}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Diagnostic Catalogue</h2>
          <p className="text-sm text-muted-foreground">
            Tests are NOT RUN until a Platform Operator deliberately executes
            them. Results are not simulated or inferred from UI state.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {snapshot.diagnostics.map(diagnostic => {
            const result = results[diagnostic.id];
            const isRunning = running === diagnostic.id;

            return (
              <div
                key={diagnostic.id}
                className="flex flex-col rounded-xl border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <DiagnosticIcon id={diagnostic.id} />
                  <ResultBadge result={result} />
                </div>

                <h3 className="mt-4 font-semibold">{diagnostic.name}</h3>

                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {diagnostic.description}
                </p>

                {result && (
                  <div className="mt-4 rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-medium">
                      Evidence from this execution
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.evidence}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {new Date(result.executedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <Button
                  className="mt-5 w-full"
                  variant="outline"
                  disabled={Boolean(running)}
                  onClick={() => void runDiagnostic(diagnostic.id)}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {isRunning ? 'Running…' : 'Run Diagnostic'}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">Operational Boundary</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Test Laboratory performs deliberate point-in-time diagnostics.
          Platform Health owns continuous operational monitoring and incident
          visibility. System Connections owns external integration capability
          and readiness. Update Manager owns application change governance.
        </p>
      </section>

      <section className="rounded-xl border border-dashed p-5">
        <h2 className="font-semibold">Future Test Evidence</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Additional diagnostics may be introduced only when iNteract has an
          authoritative and safe mechanism capable of executing the defined
          test and returning evidence. Performance, load, integration, AI and
          security tests must not be represented as successful from simulated
          data.
        </p>
      </section>
    </div>
  );
}
