'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Shield, 
  BrainCircuit, 
  FileText, 
  Download, 
  RefreshCw, 
  Briefcase, 
  Search, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Database,
  Lock,
  Workflow,
  Sparkles,
  ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DocHeader = ({ title, version, status }: { title: string, version: string, status: string }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b pb-4">
    <div>
      <h3 className="text-xl font-black tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Metadata: v{version} | {new Date().toLocaleDateString('en-CA')}</p>
    </div>
    <Badge variant={status === 'RELEASE CANDIDATE' ? 'default' : 'outline'} className="font-black text-[10px] uppercase">
      {status}
    </Badge>
  </div>
);

export default function AdminHelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">
                        iNteract Governance & Support
                    </h2>
                    <p className="text-muted-foreground max-w-3xl">
                        Authoritative documentation for platform governance, decision intelligence, and the Ari AI ecosystem.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        PDF Export
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="ari" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-xl mb-8">
                    <TabsTrigger value="ari" className="rounded-lg font-bold gap-2">
                        <Sparkles className="h-4 w-4 text-accent" /> Ari v1.6.0
                    </TabsTrigger>
                    <TabsTrigger value="governance" className="rounded-lg font-bold gap-2">
                        <Shield className="h-4 w-4" /> Platform Governance
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="rounded-lg font-bold gap-2">
                        <Database className="h-4 w-4" /> Technical Specs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ari" className="space-y-12">
                    <Card id="ari-00" className="border-primary/20 shadow-lg overflow-hidden">
                        <CardHeader className="bg-primary text-primary-foreground">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter">00 — Ari Intelligence Contract</CardTitle>
                                    <CardDescription className="text-primary-foreground/70 font-bold">Standard Identifier: iN-PROD-RC1-2026</CardDescription>
                                </div>
                                <Badge className="bg-accent text-accent-foreground font-black">PRODUCTION READY</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-primary">System Definition</h4>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Ari is an <strong>evidence-grounded</strong> shopping assistant embedded in the iNteract Intelligence Layer. 
                                        Architecturally constrained by the <strong>Ari Evidence Contract v1.1</strong>, 
                                        it ensures every interaction is backed by canonical product data or explicit shopper input.
                                    </p>
                                    <ul className="space-y-2">
                                        {[
                                            "Decision-State Integrity: Seen -> Interested -> Considered -> Rejected.",
                                            "Fact Context Grounding: Strictly non-hallucinatory specifications.",
                                            "Non-Causal Attribution: Co-occurrence over claim.",
                                            "Privacy-First: Server-side consent & PII scrubbing."
                                        ].map((item, i) => (
                                            <li key={i} className="flex gap-2 text-xs font-medium">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-muted/30 p-6 rounded-2xl border border-primary/5 space-y-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                                        <History className="h-4 w-4" /> Evidence Hierarchy
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                            <span>Level</span>
                                            <span>Source of Truth</span>
                                        </div>
                                        <Separator />
                                        {[
                                            { l: '1', n: 'Authoritative Data', s: 'Firestore Catalog' },
                                            { l: '2', n: 'Explicit Shopper Input', s: 'Verified Interaction' },
                                            { l: '3', n: 'Chronological Sequence', s: 'Server Timestamps' },
                                            { l: '4', n: 'AI Interpretation', s: 'Contextual Logic' }
                                        ].map(item => (
                                            <div key={item.l} className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-primary w-4">{item.l}.</span>
                                                <span className="flex-1 font-semibold">{item.n}</span>
                                                <span className="text-[10px] font-mono opacity-60">{item.s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card id="ari-02">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Workflow className="text-primary h-6 w-6" />
                                02 — Decision State Logic
                            </CardTitle>
                            <CardDescription>Rules governing shopper intent extraction and decision-state transition.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="logic-1">
                                    <AccordionTrigger className="font-bold">Silence Identification</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <div className="text-sm text-muted-foreground">
                                            iNteract architecture strictly forbids inferring acceptance from lack of response. If Ari recommends a product and the shopper provides no feedback, the state remains <Badge variant="outline" className="text-[10px] inline-flex">UNRESOLVED</Badge>.
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="technical" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Technical Integration Registry</CardTitle></CardHeader>
                        <CardContent>
                             <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold mb-2">Core API Versioning</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { n: 'Release Candidate', v: 'iN-PROD-RC1-2026' },
                                            { n: 'Ari Core', v: '1.6.0' },
                                            { n: 'Evidence Contract', v: '1.1.0' },
                                            { n: 'Journey Walk', v: '1.5.1' }
                                        ].map(v => (
                                            <div key={v.n} className="p-3 border rounded-lg bg-muted/30">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase">{v.n}</p>
                                                <p className="text-lg font-black font-mono">{v.v.startsWith('v') ? v.v : `v${v.v}`}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="governance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Governance Policy Audit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 border rounded-2xl bg-primary/5 space-y-4">
                                <h4 className="text-lg font-black text-primary">iNteract AOE — Ari Governance Policy</h4>
                                <Separator />
                                <div className="space-y-4 text-sm leading-relaxed">
                                    <p><strong>1. Human Accountability</strong>: Ari is an assistive layer. Final commercial decisions remain with authorized human administrators.</p>
                                    <p><strong>2. Evidence Preservation</strong>: Historical shopper evidence is never modified to improve dashboard metrics.</p>
                                    <p><strong>3. Transparency</strong>: The "SIMULATED" data status badge is a non-negotiable requirement for benchmark metrics.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
