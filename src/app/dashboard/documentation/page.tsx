
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, LifeBuoy, Rocket, Shield, Users, RefreshCw, Layers, Server, Workflow, Database, Code, GraduationCap, Building, LinkIcon, BrainCircuit, BarChart, Settings, Search, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DocSection = ({ title, children, icon }: { title: string, children: React.ReactNode, icon: React.ReactNode }) => (
    <Card className="bg-muted/30">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">{icon}{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

export default function AdminDocumentationPage() {
    const { toast } = useToast();

    const handleUpdate = () => {
        toast({
            title: "Updating Content",
            description: "Fetching the latest documentation and training materials...",
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                        Documentation & Training Modules
                    </h2>
                    <p className="text-muted-foreground max-w-3xl">
                        A comprehensive guide to the iNteract-AOE platform, covering architecture, features, security, and operational procedures.
                    </p>
                </div>
                <Button onClick={handleUpdate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Content
                </Button>
            </div>
            <Separator />
            
            <div className="grid lg:grid-cols-1 gap-8 items-start">
                <DocSection title="Executive Summary & Overview" icon={<Rocket className="text-primary"/>}>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1-1">
                            <AccordionTrigger>1.1 Platform Overview</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>Purpose and Vision</h4>
                                <p>The iNteract Admin & Operations Environment (AOE) is a multi-tenant, enterprise-grade platform designed to revolutionize the in-store retail experience. Its core purpose is to bridge the physical and digital shopping divide by empowering retailers with a suite of QR code and AI-driven tools. The platform's vision is to transform every physical product into an interactive digital touchpoint, enhancing customer engagement, driving sales, and providing retailers with actionable, real-time data.</p>
                                <h4>Objectives and Value Proposition</h4>
                                <ul>
                                    <li><strong>Enhance In-Store Experience:</strong> Provide shoppers with instant access to product information, personalized recommendations, and AI assistance directly from their smartphones.</li>
                                    <li><strong>Drive Revenue Growth:</strong> Increase basket size and conversion rates through intelligent cross-selling, upselling, and targeted promotional offers.</li>
                                    <li><strong>Provide Actionable Insights:</strong> Equip retailers with a powerful analytics dashboard to understand customer behavior, track campaign performance, and measure ROI.</li>
                                    <li><strong>Scalable & Secure Onboarding:</strong> Enable rapid, secure onboarding of multiple retailers onto their own branded, sandboxed MVP dashboards from a single, centralized administrative interface.</li>
                                    <li><strong>Centralized Innovation:</strong> Centrally manage and deploy cutting-edge features like generative AI, in-store digital display management, and A/B testing to all retailers simultaneously.</li>
                                </ul>
                                <h4>Technology Stack</h4>
                                <p>The platform is built on a modern, robust technology stack designed for performance, scalability, and rapid development:</p>
                                <ul>
                                    <li><strong>Frontend:</strong> Next.js with the App Router, React, and TypeScript.</li>
                                    <li><strong>UI Framework:</strong> Tailwind CSS with ShadCN UI components.</li>
                                    <li><strong>Backend & Database:</strong> Firebase Suite (Firestore, Firebase Authentication, Cloud Storage).</li>
                                    <li><strong>Generative AI:</strong> Genkit, powered by Google's Gemini models.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-1-2">
                            <AccordionTrigger>1.2 System Components</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The platform is composed of two primary, logically separated applications:</p>
                                <ol>
                                    <li><strong>iNteract AOE (Admin Panel):</strong> The super-admin dashboard for platform administrators. Its role is to manage the entire ecosystem, including retailer onboarding, system-wide configuration (security, AI policies), and monitoring overall platform health.</li>
                                    <li><strong>Retailer MVP (Retailer Dashboard):</strong> A replicated, sandboxed dashboard provided to each onboarded retailer. Retailers use this to manage their own QR campaigns, users, branding, billing, and view their specific analytics.</li>
                                </ol>
                                <h4>Data Flow Example (QR Scan)</h4>
                                <ol>
                                    <li>A shopper scans a QR code, which points to a URL like `/track/&#123;qrId&#125;`.</li>
                                    <li>The Next.js Route Handler logs the scan event to Firestore and increments analytics counters.</li>
                                    <li>The handler redirects to an intermediary `/scan/&#123;qrId&#125;` page.</li>
                                    <li>The `/scan` page triggers a Genkit flow, calling the Gemini LLM to generate an engaging message based on the QR code's associated AI Profile.</li>
                                    <li>The user sees the AI message and then proceeds to the final product page.</li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </DocSection>
                
                 <DocSection title="iNteract AOE Complete Documentation" icon={<Building className="text-primary"/>}>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-2-1">
                            <AccordionTrigger>2.1 User & Retailer Management</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>Retailer Onboarding</h4>
                                <p>Navigate to the **iNteract Admin Panel** to add a new retailer. Configure their brands, stores, and user accounts. The platform supports a hierarchical structure: `Retailer > Brand > Division > Region > Area > Store`.</p>
                                <h4>User Access Control</h4>
                                <p>For each user, permissions for the Retailer MVP sidebar can be set granularly via the "Manage Access" dropdown. This controls visibility for modules like Dashboard, ROI, QR Management, A/B Testing, etc.</p>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-2-2">
                            <AccordionTrigger>2.2 Core Integration & Security</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The **Core Integration** section allows platform-wide API key management. The security pages (`Platform Security`, `AOE Security`, `External Security`) provide real-time overviews of system health, threats, and integration statuses, with comprehensive logging and monitoring.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </DocSection>

                <DocSection title="Retailer MVP Complete Documentation" icon={<FileText className="text-primary"/>}>
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-3-1">
                            <AccordionTrigger>3.1 Dashboard & Analytics</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The **Retailer Dashboard** provides an executive summary of key metrics like unique scans, engagement rate, offer redemption, and basket uplift. The **ROI** and **Scan Analytics** pages offer deeper insights into financial performance and user behavior. AI-powered analysis can be triggered to generate summaries, conclusions, and recommendations from the data.</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3-2">
                            <AccordionTrigger>3.2 QR & AI Management</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>QR Management</h4>
                                <p>Retailers can generate single or bulk QR codes. The system supports dynamic codes, custom styling (colors, shapes, logos), and linking to specific campaigns. A history of all generation jobs is maintained in the **Request History** dashboard.</p>
                                <h4>AI Profile Manager</h4>
                                <p>Retailers can create and manage different **AI Profiles** to control the personality, intent (e.g., Upsell, Info-only), and constraints of the AI assistant that interacts with shoppers. These profiles can be assigned to QR codes to tailor the customer experience.</p>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-3-3">
                            <AccordionTrigger>3.3 In-Store Display & Billing</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The **In-Store Display** module allows retailers to register physical screens and assign dynamic content configurations to them. The **Billing** page lets retailers manage their subscription plan and view invoice history. </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </DocSection>

                <DocSection title="Technical Documentation" icon={<Code className="text-primary"/>}>
                    <Accordion type="single" collapsible className="w-full">
                         <AccordionItem value="item-4-1">
                            <AccordionTrigger>4.1 Database Schema</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The platform relies on key Firestore collections:</p>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Collection</TableHead><TableHead>Purpose</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell>`bulkQrRequests`</TableCell><TableCell>Stores metadata, status, and subcollections for each bulk QR code generation job.</TableCell></TableRow>
                                        <TableRow><TableCell>`qrcodes`</TableCell><TableCell>Master list of all individual QR codes, their properties, and scan counts.</TableCell></TableRow>
                                        <TableRow><TableCell>`scanEvents`</TableCell><TableCell>Logs every scan event with metadata for detailed analytics.</TableCell></TableRow>
                                        <TableRow><TableCell>`ai_profiles`</TableCell><TableCell>Stores configurable AI personalities that can be assigned to QR codes.</TableCell></TableRow>
                                        <TableRow><TableCell>`users`</TableCell><TableCell>Manages retailer-specific user accounts, roles, and permissions.</TableCell></TableRow>
                                        <TableRow><TableCell>`subscriptions` & `invoices`</TableCell><TableCell>Handles retailer billing plans and invoice history.</TableCell></TableRow>
                                        <TableRow><TableCell>`displays` & `inStoreConfigs`</TableCell><TableCell>Manages physical in-store display devices and their content.</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-4-2">
                            <AccordionTrigger>4.2 Genkit Flows</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>Server-side logic is encapsulated in Genkit flows, which are deployed as secure Cloud Functions. Key flows include:</p>
                                <ul>
                                    <li>`submitBulkQrRequest`: Queues a bulk QR generation job.</li>
                                    <li>`processBulkQrQueue`: A simulated cron job that processes queued requests.</li>
                                    <li>`generateCampaignAI`: Generates marketing copy for a campaign.</li>
                                    <li>`getScanInteraction`: Fetches AI messages for a scanned QR code.</li>
                                    <li>`analyzeEngagementMetrics`: Provides AI-driven analysis of performance data.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </DocSection>

                <DocSection title="Security & Compliance" icon={<Shield className="text-primary"/>}>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-5-1">
                            <AccordionTrigger>5.1 Security Overview</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>Security is foundational, managed through Firebase Security Rules that enforce data access based on a user's custom claims (`retailerId`). All server-side operations are handled by Genkit flows running with `firebase-admin` for secure administrative access. The platform includes dedicated pages for monitoring platform, AOE, and external security integrations.</p>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-5-2">
                            <AccordionTrigger>5.2 AI Policy & Governance</AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The **AI Policy & Compliance** module provides a centralized place to govern data privacy, consent, and ethical AI use. It allows administrators to configure AI transparency, manage customer consent for data processing, and set data retention policies, laying the groundwork for compliance with regulations like GDPR and POPIA.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </DocSection>
            </div>

             <Card className="border-dashed">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-3"><LifeBuoy /> Training Modules</CardTitle>
                    <CardDescription>
                        Interactive video tutorials and training modules are coming soon.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        This area will be populated with video walkthroughs and step-by-step guides to help you master the platform.
                    </p>
                </CardContent>
            </Card>
        </div>
    );

    