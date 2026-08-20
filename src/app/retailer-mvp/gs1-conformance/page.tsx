'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Barcode, Database, Workflow, FileText, Info, Download, ExternalLink } from 'lucide-react';
import Gs1TestSuite from '@/components/dashboard/gs1-test-suite';
import { Button } from '@/components/ui/button';

export default function RetailerGs1ConformancePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3 uppercase">
            <ShieldCheck className="text-primary h-7 w-7" />
            Global Standards Hub
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Technical guidelines and tools to ensure your product identifiers meet global supply chain standards for digital resolution.
          </p>
        </div>
        <Button variant="outline" className="gap-2 font-bold text-[10px] uppercase tracking-widest h-10 px-6 shadow-sm">
            <Download className="h-4 w-4" /> Download Implementation Guide
        </Button>
      </div>

      <Separator />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Gs1TestSuite />

          <Card className="border-primary/10 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight">Onboarding Your Portfolio</CardTitle>
              <CardDescription className="text-xs">Step-by-step technical mapping using verified identifiers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs">1</Badge>
                            <h4 className="font-bold text-sm">Map Product Identifiers (GTIN)</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Ensure every product has a valid 14-digit Global Trade Item Number. The iNteract platform enforces standard Modulo-10 normalization.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs">2</Badge>
                            <h4 className="font-bold text-sm">Initialize Digital Links</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Upgrade legacy tracking points to the GS1 Digital Link standard: <code className="text-primary bg-primary/5 px-1 rounded font-mono">/01/{'{gtin}'}</code>.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs">3</Badge>
                            <h4 className="font-bold text-sm">Sync Factual Data</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Your PIM integration must use the GTIN-14 as the authoritative primary key for all product attribute lookups.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs">4</Badge>
                            <h4 className="font-bold text-sm">Secure Traceability</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Optionally include GS1 Application Identifier 10 (Batch) to enable high-fidelity category intelligence.
                        </p>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                <Info className="h-3.5 w-3.5" /> Factual Guardrails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                 <p className="text-[10px] leading-tight font-bold">GTIN is the only valid identifier for session anchoring.</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                 <p className="text-[10px] leading-tight font-bold">The Identity Resolver is strictly stateless and interoperable.</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                 <p className="text-[10px] leading-tight font-bold">Unauthenticated scans create isolated behavioral sessions.</p>
              </div>
            </CardContent>
            <CardFooter>
                 <Button variant="link" className="text-[10px] font-black uppercase tracking-widest p-0 h-auto gap-2 text-primary">
                     <ExternalLink className="h-3 w-3" />
                     GS1 Standard Reference
                 </Button>
            </CardFooter>
          </Card>

           <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-50">Platform Integrity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b">
                <span className="text-muted-foreground font-medium">Digital Link URI</span>
                <span className="font-black text-primary">01/GTIN-14</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b">
                <span className="text-muted-foreground font-medium">Checkout Handshake</span>
                <span className="font-black text-primary">GLN Sync</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-muted-foreground font-medium">Intelligence Anchor</span>
                <span className="font-black text-primary">Session ID</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
