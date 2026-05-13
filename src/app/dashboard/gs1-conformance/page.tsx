'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Barcode, Database, Workflow, FileText, Info } from 'lucide-react';
import Gs1TestSuite from '@/components/dashboard/gs1-test-suite';

export default function Gs1ConformancePackPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <ShieldCheck className="text-primary h-8 w-8" />
            GS1 Conformance Pack
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            Official proof and technical specification for iNteract's GS1-aligned retail intelligence infrastructure.
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
          PLATFORM AUDIT READY
        </Badge>
      </div>

      <Separator />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Gs1TestSuite />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Resolver Behavior Logic
              </CardTitle>
              <CardDescription>The strictly stateless identity resolution sequence for /resolve route.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Identity Capture', desc: 'Accepts GTIN, AIDC, or Digital Link URI input.' },
                  { step: '2', title: 'Standard Normalization', desc: 'Parses string using GS1 standard Application Identifiers (AI).' },
                  { step: '3', title: 'Canonical Validation', desc: 'Enforces 14-digit GTIN-14 format for all internal lookups.' },
                  { step: '4', title: 'Session Initialization', desc: 'Generates a fresh sessionId to anchor behavioural context.' },
                  { step: '5', title: 'Atomic Event Log', desc: 'Records raw scan event dimensionally without intelligence processing.' },
                  { step: '6', title: 'Layer Handoff', desc: 'Redirects to Experience Layer (/p/{gtin}) with session context.' },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                    <div>
                      <p className="font-bold text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                <Database className="h-4 w-4" /> Schema Conformance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 border rounded-md font-mono text-[10px] space-y-1 bg-muted/30">
                <p className="text-primary font-bold">/products/&#123;gtin&#125;</p>
                <p className="text-muted-foreground">Primary Key: GTIN-14 (String)</p>
                <p className="text-muted-foreground">Status: Non-negotiable</p>
              </div>
              <div className="p-3 border rounded-md font-mono text-[10px] space-y-1 bg-muted/30">
                <p className="text-primary font-bold">/events/&#123;eventId&#125;</p>
                <p className="text-muted-foreground">Anchor: sessionId</p>
                <p className="text-muted-foreground">Dimension: gtin</p>
                <p className="text-muted-foreground">Status: Session-First</p>
              </div>
              <p className="text-[10px] italic text-muted-foreground leading-tight">
                * Zero dependency on internal database IDs. All cross-layer handshakes use GS1 standards.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Integration Spec
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <Barcode className="h-3.5 w-3.5 text-primary" />
                <span>GTIN-14 Mandatory for PIM Sync</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Workflow className="h-3.5 w-3.5 text-primary" />
                <span>URI Structure: /01/&#123;GTIN&#125;</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Batch/Serial via AI 10/21</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
