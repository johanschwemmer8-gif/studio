'use client';

import {
  Activity,
  Bot,
  CheckCircle2,
  FileCheck2,
  Layers3,
  ShieldCheck,
  Store,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlatformAiGovernanceManager } from '@/components/dashboard/platform-ai-governance-manager';

const governanceLayers = [
  {
    title: 'Platform AI Governance',
    description:
      'Mandatory iNteract governance establishes the platform-level authority, controls and approved AI capability boundaries.',
    icon: ShieldCheck,
  },
  {
    title: 'Retailer Additive Governance',
    description:
      'Retailers may add permitted governance requirements within the platform boundary. Retailer rules cannot weaken mandatory platform controls.',
    icon: Store,
  },
  {
    title: 'Retailer AI Configuration',
    description:
      'Retailer-specific Ari configuration operates only within the effective governance authority resolved for that retailer.',
    icon: Layers3,
  },
  {
    title: 'Governed AI Execution',
    description:
      'Production AI capabilities resolve active governance server-side before governed model execution. Governance resolution is authoritative and fail-closed.',
    icon: Bot,
  },
];

const assuranceStates = [
  {
    state: 'DEFINED',
    meaning:
      'The requirement or control is present in the authoritative governance policy.',
  },
  {
    state: 'IMPLEMENTED',
    meaning:
      'A technical or procedural mechanism exists to apply the requirement.',
  },
  {
    state: 'VERIFIED',
    meaning:
      'Evidence demonstrates that the implementation satisfies its defined test.',
  },
  {
    state: 'MONITORED',
    meaning:
      'Authoritative ongoing telemetry or review evidence exists for the control.',
  },
];

export default function AiRulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            AI Rules
          </h1>
          <Badge variant="outline">
            Platform Governance
          </Badge>
        </div>

        <p className="mt-2 max-w-4xl text-muted-foreground">
          Platform Operator governance, authority and visibility for
          production AI. This surface administers the canonical
          iNteract Platform AI Governance lifecycle and explains how
          mandatory platform governance relates to retailer
          governance and governed AI execution.
        </p>
      </div>

      <Separator />

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Governance authority</AlertTitle>
        <AlertDescription>
          An ACTIVE governance policy establishes which governance
          authority applies. It does not, by itself, prove that every
          declared control is technically implemented, independently
          verified or continuously monitored.
        </AlertDescription>
      </Alert>

      <PlatformAiGovernanceManager />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {governanceLayers.map((layer) => {
          const Icon = layer.icon;

          return (
            <Card key={layer.title}>
              <CardHeader className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/30">
                  <Icon className="h-4 w-4 text-primary" />
                </div>

                <CardTitle className="text-base">
                  {layer.title}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {layer.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Runtime Governance Boundary
          </CardTitle>

          <CardDescription>
            The production governance chain used to constrain governed
            AI capability execution.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-sm font-semibold">
              Platform AI Governance → Active Governance Authority →
              Mandatory Platform Controls → Retailer Additive
              Governance → Retailer AI Configuration → Governed AI
              Capability Resolution → AI Execution → Governance
              Provenance
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Platform baseline
              </p>
              <p className="mt-2 text-sm">
                Mandatory platform governance is resolved first and
                remains authoritative.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Retailer boundary
              </p>
              <p className="mt-2 text-sm">
                Valid ACTIVE retailer governance may add permitted
                requirements but cannot override protected platform
                controls.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Execution authority
              </p>
              <p className="mt-2 text-sm">
                Governance is resolved by trusted server-side code.
                Missing or invalid governance authority fails closed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Control Assurance Model
          </CardTitle>

          <CardDescription>
            Governance state and control effectiveness are deliberately
            separate concepts.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {assuranceStates.map((item) => (
              <div
                key={item.state}
                className="rounded-lg border p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <Badge variant="secondary">
                    {item.state}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {item.meaning}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Phase III ISO/IEC 27001 readiness will strengthen this
            evidence chain through formal control testing, Test
            Laboratory evidence, Platform Health telemetry, ownership
            and review-frequency records. No assurance state should be
            inferred without its supporting evidence.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governance Evidence Boundary</CardTitle>
          <CardDescription>
            What this Phase II administration surface does and does
            not establish.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Authoritative here</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Platform Governance lifecycle actions.</li>
              <li>• Platform Operator authority for those actions.</li>
              <li>• The mandatory platform governance boundary.</li>
              <li>• The additive-only retailer governance relationship.</li>
              <li>• The server-resolved runtime governance architecture.</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <p className="font-semibold">
              Not asserted without evidence
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Production fairness or bias findings.</li>
              <li>• Continuous AI health or performance monitoring.</li>
              <li>• Independent audit or certification status.</li>
              <li>• Automated ethics-review processes.</li>
              <li>• Control effectiveness where no verification evidence exists.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
