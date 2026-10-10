'use client';

import {
  BadgeCheck,
  Barcode,
  Boxes,
  CircleCheck,
  Fingerprint,
  Network,
  ScanLine,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

import Gs1TestSuite from '@/components/dashboard/gs1-test-suite';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const identityDomains = [
  {
    domain: 'Product',
    identity: 'GTIN where valid and available',
    purpose: 'Standards-based product identity and product context.',
  },
  {
    domain: 'Campaign',
    identity: 'campaignId',
    purpose: 'Commercial and engagement campaign identity.',
  },
  {
    domain: 'Activation',
    identity: 'activationId',
    purpose: 'Retailer-defined Point-of-Decision objective.',
  },
  {
    domain: 'Deployment',
    identity: 'deploymentId',
    purpose: 'Physical deployment of an activation.',
  },
  {
    domain: 'QR',
    identity: 'qrCodeId / canonical QR identity',
    purpose: 'Digital identity of the deployed Point-of-Decision activation.',
  },
  {
    domain: 'Shopper Session',
    identity: 'sessionId',
    purpose: 'Anonymous behavioural context created after qualifying interaction.',
  },
];

const resolutionSteps = [
  {
    step: '1',
    title: 'QR Identity Capture',
    description: 'Receive the canonical QR identity presented by the scan.',
  },
  {
    step: '2',
    title: 'QR Resolution',
    description:
      'Resolve the production QR against its authoritative deployment context.',
  },
  {
    step: '3',
    title: 'Identity Authority',
    description:
      'Preserve the Campaign → Activation → Deployment → QR relationship.',
  },
  {
    step: '4',
    title: 'Exposure',
    description:
      'Treat successful QR resolution as an exposure event, not automatically as a shopper session.',
  },
  {
    step: '5',
    title: 'Experience Handoff',
    description:
      'Route the shopper into the experience associated with the resolved activation.',
  },
  {
    step: '6',
    title: 'Session Qualification',
    description:
      'Create or associate shopper-session context only after a qualifying shopper interaction.',
  },
];

const assuranceLevels = [
  {
    title: 'IMPLEMENTED',
    description: 'The standards capability exists in the platform implementation.',
  },
  {
    title: 'VALIDATED',
    description: 'Defined automated or executable tests verify the stated behaviour.',
  },
  {
    title: 'PRODUCTION USED',
    description: 'The capability participates in the production platform architecture.',
  },
  {
    title: 'EXTERNALLY CERTIFIED',
    description:
      'Reserved for standards assurance supported by independent certification evidence.',
  },
];

export default function GlobalStandardsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-2 flex items-center gap-3 text-3xl font-black tracking-tight">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Global Standards
          </h2>
          <p className="max-w-3xl text-muted-foreground">
            Platform standards, identity conformance and technical assurance for
            iNteract&apos;s standards-based infrastructure.
          </p>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5 border-primary/20 bg-primary/5 px-3 py-1 font-bold uppercase tracking-wider text-primary"
        >
          <Barcode className="h-3.5 w-3.5" />
          GS1 Identity
        </Badge>
      </div>

      <Separator />

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Canonical Identity Architecture
          </CardTitle>
          <CardDescription>
            GS1 product identity participates in iNteract without replacing the
            platform&apos;s campaign, activation, deployment, QR or shopper-session
            identities.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/20 p-5">
            <p className="font-semibold">
              GS1 identifies the product. iNteract identifies the
              Point-of-Decision activation.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A QR scan identifies an activation/deployment exposure. It does not
              itself create a shopper session. GTIN remains product identity and
              product context; it is not QR, Activation, Deployment or Session
              identity.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Product Identity
              </p>
              <p className="mt-2 font-semibold">GS1 GTIN</p>
            </div>

            <div className="flex items-center justify-center">
              <Network className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                iNteract Identity Chain
              </p>
              <p className="mt-2 font-semibold">
                Campaign → Activation → Deployment → QR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 xl:grid-cols-2">
        <Gs1TestSuite />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              GS1 Capability Boundary
            </CardTitle>
            <CardDescription>
              Standards capabilities represented by the current platform
              implementation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {[
              'GS1 identifier parsing',
              'Modulo-10 checksum validation',
              'Canonical product GTIN handling',
              'GS1 Digital Link parsing',
              'AIDC parsing',
              'Supported GS1 Application Identifier parsing',
            ].map((capability) => (
              <div
                key={capability}
                className="flex items-start gap-3 rounded-md border p-3"
              >
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm">{capability}</span>
              </div>
            ))}

            <p className="pt-2 text-xs text-muted-foreground">
              Validator success demonstrates that the supplied identity passed
              iNteract&apos;s implemented parsing and validation logic. It does not
              represent independent GS1 certification.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Production QR Resolution Architecture
          </CardTitle>
          <CardDescription>
            The QR resolution path is activation-led. GS1 product context remains
            separate from QR identity.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resolutionSteps.map((item) => (
              <div key={item.step} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <p className="font-semibold">{item.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5" />
            Identity Domain Separation
          </CardTitle>
          <CardDescription>
            Each platform domain retains its own authoritative identity.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {identityDomains.map((item) => (
            <div
              key={item.domain}
              className="grid gap-2 rounded-lg border p-4 md:grid-cols-[160px_260px_1fr]"
            >
              <p className="font-semibold">{item.domain}</p>
              <p className="font-mono text-xs text-primary">{item.identity}</p>
              <p className="text-sm text-muted-foreground">{item.purpose}</p>
            </div>
          ))}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <strong>Identity invariant:</strong> No identity domain may impersonate
            another. GTIN provides product identity and context; it does not
            replace Activation, Deployment, QR or Session identity.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Standards Assurance Model
          </CardTitle>
          <CardDescription>
            Assurance terminology is evidence-based and does not imply external
            certification.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {assuranceLevels.map((level) => (
              <div key={level.title} className="rounded-lg border p-4">
                <p className="text-xs font-black tracking-wider">
                  {level.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {level.description}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            External certification status must only be asserted when supported by
            independent certification evidence. Phase III will strengthen the
            standards evidence chain through formal control, test and retained
            evidence records.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
