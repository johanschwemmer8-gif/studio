
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, LifeBuoy, Rocket, Shield, Users, RefreshCw, Layers, Server, Workflow, Database, Code, GraduationCap } from "lucide-react";
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
                        Find resources, guides, and training materials to help you get the most out of the iNteract-AOE platform.
                    </p>
                </div>
                <Button onClick={handleUpdate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Content
                </Button>
            </div>
            <Separator />
            
            <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* iNteract AOE Documentation */}
                <DocSection title="iNteract AOE Platform Guide" icon={<Rocket className="text-primary"/>}>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Layers className="h-5 w-5 text-primary" />
                                    <span>System Overview</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>Purpose and Vision</h4>
                                <p>The iNteract Admin & Operations Environment (AOE) is the central command center for a multi-tenant retail technology platform. Its vision is to empower a network of retailers by providing a scalable, configurable, and secure MVP (Minimum Viable Product) that enhances the in-store customer experience through QR code and AI-driven interactions.</p>
                                <h4>Objectives and Value Proposition</h4>
                                <ul>
                                    <li><strong>Scalability:</strong> Easily onboard and manage multiple retailers from a single interface.</li>
                                    <li><strong>Customization:</strong> Provide each retailer with their own branded, sandboxed MVP.</li>
                                    <li><strong>Security:</strong> Ensure robust security, data privacy, and compliance across the entire platform.</li>
                                    <li><strong>Innovation:</strong> Centrally manage and deploy cutting-edge features like AI-powered recommendations, analytics, and in-store digital displays.</li>
                                </ul>
                                <h4>Technology Stack</h4>
                                <p>The platform is built on a modern, robust technology stack designed for performance and scalability:</p>
                                <ul>
                                    <li><strong>Frontend:</strong> Next.js, React, TypeScript</li>
                                    <li><strong>UI:</strong> Tailwind CSS, ShadCN UI Components</li>
                                    <li><strong>Backend & Database:</strong> Firebase (Firestore, Authentication, Storage)</li>
                                    <li><strong>Generative AI:</strong> Genkit with Google's Gemini models</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Server className="h-5 w-5 text-primary" />
                                    <span>Architecture & Infrastructure</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>High-Level Architecture</h4>
                                <p>The system is architected as a multi-tenant platform with two primary interfaces:</p>
                                <ol>
                                    <li><strong>iNteract AOE (Admin Panel):</strong> A central dashboard for platform administrators to manage retailers, configure system-wide settings, and monitor overall health.</li>
                                    <li><strong>Retailer MVP (Retailer Dashboard):</strong> A replicated, sandboxed dashboard provided to each onboarded retailer. Retailers use this to manage their own campaigns, users, and analytics.</li>
                                </ol>
                                <h4>Data Flow</h4>
                                <p>Customer scans a QR code &rarr; The request hits a serverless tracking endpoint &rarr; The endpoint logs the scan event and redirects to the appropriate product/interaction page &rarr; The page fetches data from Firestore &rarr; AI flows are triggered for personalization &rarr; Data is displayed to the customer.</p>
                                <h4>Security & Compliance</h4>
                                <p>Security is managed through Firebase Security Rules, role-based access control (RBAC) in Firestore, and client-side checks. The AI Policy & Compliance module provides a centralized place to govern data privacy, consent, and ethical AI use across the platform.</p>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-3">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span>Admin Workflows</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>Onboarding a New Retailer</h4>
                                <ol>
                                    <li>Navigate to the <strong>iNteract Admin Panel</strong>.</li>
                                    <li>Click "Add New Retailer" and enter the retailer's name.</li>
                                    <li>Configure their brands, stores, and initial user accounts.</li>
                                    <li>Use the "Manage Access" dropdown to set permissions for the Retailer MVP sidebar.</li>
                                    <li>Click "Save Retailer Configuration". This generates their unique landing page and MVP dashboard, which can be viewed from the admin panel.</li>
                                </ol>
                                <h4>Core Integration & Security</h4>
                                <p>Use the "Core Integration" section to generate and manage API keys for retailers. The security pages ("Platform Security", "AOE Security", etc.) provide real-time overviews of system health and potential threats.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </DocSection>

                 {/* Retailer MVP Documentation */}
                <DocSection title="Retailer MVP Guide" icon={<FileText className="text-primary"/>}>
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-4">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Workflow className="h-5 w-5 text-primary" />
                                    <span>Shopper Interaction Workflow</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The core customer journey is simple and powerful:</p>
                                <ol>
                                    <li>A shopper scans a QR code on a product in-store.</li>
                                    <li>The code redirects to a tracking URL that logs the scan event.</li>
                                    <li>The user is then sent to an interactive loading screen where an AI assistant provides a brief, engaging message.</li>
                                    <li>After the message, the user clicks "Continue" to land on the product's detail page, complete with AI-powered recommendations.</li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Database className="h-5 w-5 text-primary" />
                                    <span>Database Schema</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The platform relies on several key Firestore collections to manage data:</p>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Collection</TableHead>
                                            <TableHead>Purpose</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell>`bulkQrRequests`</TableCell><TableCell>Stores metadata and items for bulk QR code generation jobs.</TableCell></TableRow>
                                        <TableRow><TableCell>`qrcodes`</TableCell><TableCell>Master list of all individual QR codes and their properties.</TableCell></TableRow>
                                        <TableRow><TableCell>`scanEvents`</TableCell><TableCell>Logs every scan event for analytics.</TableCell></TableRow>
                                        <TableRow><TableCell>`ai_profiles`</TableCell><TableCell>Stores configurable AI personalities that can be assigned to QR codes.</TableCell></TableRow>
                                        <TableRow><TableCell>`users`</TableCell><TableCell>Manages retailer-specific user accounts and their permissions.</TableCell></TableRow>
                                        <TableRow><TableCell>`subscriptions`</TableCell><TableCell>Handles retailer billing plans and invoice history.</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-6">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Code className="h-5 w-5 text-primary" />
                                    <span>Development & Deployment</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>Development Progress</h4>
                                <p>So far, we have built the foundational structure for both the iNteract AOE and the Retailer MVP. This includes user management, retailer onboarding, dynamic sidebars based on permissions, and initial implementations for QR code management, AI-driven analytics, and security/compliance dashboards.</p>
                                <h4>Deployment</h4>
                                <p>The application is a Next.js project designed for serverless deployment on platforms like Firebase App Hosting or Vercel. Continuous integration and deployment (CI/CD) pipelines can be set up using GitHub Actions to automate testing and deployment processes.</p>
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
}
