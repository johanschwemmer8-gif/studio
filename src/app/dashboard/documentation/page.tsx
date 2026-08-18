
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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DocHeader = ({ title, version, status }: { title: string, version: string, status: string }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b pb-4">
    <div>
      <h3 className="text-xl font-black tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Metadata: v{version} | {new Date().toLocaleDateString('en-CA')}</p>
    </div>
    <Badge variant={status === 'PILOT READY' ? 'default' : 'outline'} className="font-black text-[10px] uppercase">
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
                        iNteract Help Center
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

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search documentation..." 
                    className="pl-10" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Tabs defaultValue="ari" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-xl mb-8">
                    <TabsTrigger value="ari" className="rounded-lg font-bold gap-2">
                        <Sparkles className="h-4 w-4 text-accent" /> Ari v1.5.0
                    </TabsTrigger>
                    <TabsTrigger value="governance" className="rounded-lg font-bold gap-2">
                        <Shield className="h-4 w-4" /> Platform Governance
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="rounded-lg font-bold gap-2">
                        <Database className="h-4 w-4" /> Technical Specs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ari" className="space-y-12">
                    {/* 00 - MASTER SYSTEM RECORD */}
                    <Card id="ari-00" className="border-primary/20 shadow-lg overflow-hidden">
                        <CardHeader className="bg-primary text-primary-foreground">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter">00 — Ari Master System Record</CardTitle>
                                    <CardDescription className="text-primary-foreground/70 font-bold">Standard Identifier: iN-ARI-1.5.0-MASTER</CardDescription>
                                </div>
                                <Badge className="bg-accent text-accent-foreground font-black">PILOT READY</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-primary">System Definition</h4>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Ari is an <strong>evidence-grounded</strong> shopping assistant embedded in the iNteract Intelligence Layer. 
                                        Unlike generative chatbots, Ari is architecturally constrained by the <strong>Ari Evidence Contract v1.0</strong>, 
                                        ensuring that every interaction and retailer insight is backed by canonical data or explicit shopper input.
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
                                            { l: '1', n: 'Authoritative Data', s: 'PIM / Firestore' },
                                            { l: '2', n: 'Explicit Shopper Input', s: 'Verified Interaction' },
                                            { l: '3', n: 'Derived Logic', s: 'Deterministic Code' },
                                            { l: '4', n: 'Chronological Sequence', s: 'Server Timestamps' },
                                            { l: '5', n: 'AI Interpretation', s: 'Contextual Explanation' }
                                        ].map(item => (
                                            <div key={item.l} className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-primary w-4">{item.l}.</span>
                                                <span className="flex-1 font-semibold">{item.n}</span>
                                                <span className="text-[10px] font-mono opacity-60">{item.s}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] italic text-muted-foreground mt-4">
                                        * Rule: Interpretation (L5) MUST NEVER be upgraded to Fact (L1-4).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 02 - EVIDENCE FRAMEWORK */}
                    <Card id="ari-02">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Workflow className="text-primary h-6 w-6" />
                                02 — Evidence & Decision Framework
                            </CardTitle>
                            <CardDescription>Rules governing shopper intent extraction and decision-state transition.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="logic-1">
                                    <AccordionTrigger className="font-bold">Silence ≠ Acceptance</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p className="text-sm text-muted-foreground">
                                            iNteract architecture strictly forbids inferring acceptance from silence. If Ari recommends a product and the shopper provides no feedback, the state remains <Badge variant="outline" className="text-[10px]">UNRESOLVED</Badge>.
                                        </p>
                                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-700 text-xs font-medium">
                                            Blocker: "Dwell time" or "Silence" must never increment the Recommendation Acceptance rate.
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="logic-2">
                                    <AccordionTrigger className="font-bold">Rejection Reason Integrity</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 border rounded-lg bg-background">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Scenario A</p>
                                                <p className="text-xs font-bold italic">"No, too expensive."</p>
                                                <Separator className="my-2" />
                                                <div className="flex gap-2">
                                                    <Badge className="bg-green-500 text-[9px]">REJECTION: YES</Badge>
                                                    <Badge className="bg-blue-500 text-[9px]">REASON: PRICE</Badge>
                                                </div>
                                            </div>
                                            <div className="p-3 border rounded-lg bg-background">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Scenario B</p>
                                                <p className="text-xs font-bold italic">"No."</p>
                                                <Separator className="my-2" />
                                                <div className="flex gap-2">
                                                    <Badge className="bg-green-500 text-[9px]">REJECTION: YES</Badge>
                                                    <Badge variant="outline" className="text-[9px]">REASON: NOT STATED</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* 03 - PRODUCT KNOWLEDGE */}
                    <Card id="ari-03">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Database className="text-primary h-6 w-6" />
                                03 — Product Knowledge & Grounding
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DocHeader title="Hallucination Prevention Protocol" version="1.0.0" status="IMPLEMENTED" />
                            <p className="text-sm text-muted-foreground">
                                Ari uses a strictly bound <strong>Fact Context</strong> retrieved via `getCanonicalProduct`. If a product attribute (e.g., Warranty) is missing from Firestore, Ari is instructed to state: <em>"I don't have verified information on that currently."</em>
                            </p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-[10px] font-black">Attribute</TableHead>
                                        <TableHead className="text-[10px] font-black">Source</TableHead>
                                        <TableHead className="text-[10px] font-black">Validation Rule</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="text-xs font-bold">Price</TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">Firestore/ERP</TableCell>
                                        <TableCell className="text-[10px]">Strict numeric. No AI estimation.</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="text-xs font-bold">Specs</TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">Canonical Facts</TableCell>
                                        <TableCell className="text-[10px]">Literal match. No generative expansion.</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* 09 - KNOWN LIMITATIONS */}
                    <Card id="ari-09" className="border-yellow-200 bg-yellow-50/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-yellow-800 uppercase text-lg font-black">
                                <AlertTriangle className="h-6 w-6" />
                                09 — Known Limitations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { t: 'Aggregation Scale', d: 'Firestore-based walks are currently limited to 5,000 events per query. Scale >100k scans requires BigQuery.', s: 'LIMITATION' },
                                    { t: '90-Day Deletion', d: 'Retention policy is defined in code, but automated physical cleanup (Cloud Function) is not yet deployed.', s: 'PENDING' },
                                    { t: 'Simulated POS', d: 'All transaction-derived metrics use simulation logic. Production ROI requires live ERP integration.', s: 'SIMULATED' },
                                    { t: 'Identity Isolation', d: 'Context is session-bound. Closing the browser clears shopper memory (No Cross-Session Continuity).', s: 'IMPLEMENTED' }
                                ].map((lim, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-yellow-200">
                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[8px] font-black">{lim.s}</Badge>
                                        <div>
                                            <p className="text-sm font-bold text-yellow-900">{lim.t}</p>
                                            <p className="text-xs text-yellow-800/80 leading-relaxed mt-1">{lim.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 11 - IMPLEMENTATION EVIDENCE MATRIX */}
                    <Card id="ari-11">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <ListChecks className="text-primary h-6 w-6" />
                                11 — Implementation Evidence Matrix
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="text-[10px] uppercase font-black tracking-widest">
                                        <TableHead>Requirement</TableHead>
                                        <TableHead>Implementation Path</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Audit Ref</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { r: 'Server-Side Consent', i: 'product-chat-flow.ts (hasConsent gate)', s: 'VERIFIED', a: 'Step 11' },
                                        { r: 'PII Scrubbing', i: 'interaction-signals.ts (PII Redaction prompt)', s: 'VERIFIED', a: 'Step 9' },
                                        { r: 'Chronological Walk', i: 'decision-journey-intelligence.ts', s: 'VERIFIED', a: 'Step 7.1' },
                                        { r: 'Non-Causal Language', i: 'Dashboard UI Audit', s: 'COMPLETE', a: 'Step 12' },
                                        { r: 'Cross-Tenant Guard', i: 'Auth Context Server Verification', s: 'VERIFIED', a: 'Step 10' }
                                    ].map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs font-bold">{row.r}</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground font-mono">{row.i}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[9px] bg-green-50 text-green-700 border-green-200">{row.s}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-[10px] font-bold">{row.a}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="bg-muted/10 p-4 border-t italic text-[10px] text-muted-foreground">
                            * Final Acceptance Gate (Step 12) Passed on {new Date().toLocaleDateString()}.
                        </CardFooter>
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
                                            { n: 'Ari Core', v: '1.5.0' },
                                            { n: 'Evidence Contract', v: '1.0.0' },
                                            { n: 'Journey Walk', v: '1.4.0' },
                                            { n: 'POS Simulation', v: '1.2.0' }
                                        ].map(v => (
                                            <div key={v.n} className="p-3 border rounded-lg bg-muted/30">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase">{v.n}</p>
                                                <p className="text-lg font-black font-mono">v{v.v}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                     <h4 className="text-sm font-bold mb-4">Event Schema: `interaction_signal`</h4>
                                     <pre className="p-4 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono overflow-x-auto">
{`{
  "type": "price_objection" | "product_rejection" | ...,
  "evidenceType": "explicit" | "derived" | "inferred",
  "confidence": "HIGH" | "MEDIUM" | "LOW" | "INFERRED",
  "statedReason": string | null,
  "extractionVersion": "1.5.0",
  "sessionId": string
}`}
                                     </pre>
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
                                    <p><strong>1. Human Accountability</strong>: Ari is an assistive layer. Final commercial decisions (Pricing, Stock, Policy) remain with authorized human administrators.</p>
                                    <p><strong>2. Evidence Preservation</strong>: Under no circumstances shall Ari modify or delete historical shopper evidence to improve dashboard metrics.</p>
                                    <p><strong>3. Non-Manipulation</strong>: Ari is forbidden from creating artificial urgency or utilizing dark patterns to influence purchase decisions.</p>
                                    <p><strong>4. Transparency</strong>: The "SIMULATED" data status badge is a non-negotiable requirement for any dashboard containing prototype transaction data.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
    