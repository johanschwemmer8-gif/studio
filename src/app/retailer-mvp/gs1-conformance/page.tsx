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
          <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
            <ShieldCheck className="text-primary h-7 w-7" />
            GS1-Aligned Integration Hub
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            Technical guidelines and conformance tools to ensure your product data meets global supply chain standards.
          </p>
        </div>
        <Button variant="outline" className="gap-2 font-bold text-[10px] uppercase tracking-widest">
            <Download className="h-4 w-4" /> Download Integration Guide
        </Button>
      </div>

      <Separator />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Gs1TestSuite />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight">How to Integrate Your Products</CardTitle>
              <CardDescription>Step-by-step technical onboarding using global standards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full">1</Badge>
                            <h4 className="font-bold text-sm">Prepare GTIN-14 Data</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Ensure every product in your PIM/ERP system has a valid Global Trade Item Number. iNteract enforces 14-digit normalization.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full">2</Badge>
                            <h4 className="font-bold text-sm">Deploy Digital Links</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Replace legacy tracking URLs with GS1 Digital Link URIs: <code className="text-primary bg-primary/5 px-1 rounded">/01/&#123;gtin&#125;</code>.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full">3</Badge>
                            <h4 className="font-bold text-sm">Sync Inventory via GTIN</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Your API integration must use the GTIN as the primary key for stock level and pricing updates.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full">4</Badge>
                            <h4 className="font-bold text-sm">Enable Batch Traceability</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Optionally include GS1 AI 10 (Batch) in your QR payloads to enable category-specific intelligence.
                        </p>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Info className="h-4 w-4" /> Architectural Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                 <p className="text-[11px] leading-tight font-medium">GTIN is the ONLY primary product identifier used in transaction handshakes.</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                 <p className="text-[11px] leading-tight font-medium">Infrastructure logs are anonymized and anchored to unique shopper sessions.</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                 <p className="text-[11px] leading-tight font-medium">The Resolver layer is strictly stateless, ensuring global interoperability.</p>
              </div>
            </CardContent>
            <CardFooter>
                 <Button variant="link" className="text-[10px] font-black uppercase tracking-widest p-0 h-auto gap-2">
                     <ExternalLink className="h-3 w-3" />
                     GS1 Digital Link Standard
                 </Button>
            </CardFooter>
          </Card>

           <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-50">Handshake Integrity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b">
                <span className="text-muted-foreground">Mobile Basket</span>
                <span className="font-bold">GTIN Keyed</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b">
                <span className="text-muted-foreground">POS Terminal</span>
                <span className="font-bold">GTIN Sync</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-muted-foreground">Analytics</span>
                <span className="font-bold">Session First</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
