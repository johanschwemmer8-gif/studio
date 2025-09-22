
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
                                <p>The iNteract Admin & Operations Environment (AOE) is the central command center for a multi-tenant retail technology platform. Its core purpose is to bridge the gap between physical and digital retail by providing a scalable, configurable, and secure MVP (Minimum Viable Product) to a network of retailers. The platform's vision is to empower retailers of all sizes to enhance their in-store customer experience through QR code and AI-driven interactions, turning every product into a potential point of engagement.</p>
                                <h4>Objectives and Value Proposition</h4>
                                <ul>
                                    <li><strong>Scalability & Onboarding:</strong> Easily onboard and manage numerous distinct retailers from a single, centralized administrative interface.</li>
                                    <li><strong>Customization & Branding:</strong> Provide each retailer with their own branded, sandboxed MVP dashboard, ensuring their brand identity is maintained.</li>
                                    <li><strong>Data-Driven Insights:</strong> Aggregate high-level analytics across all retailers to identify trends, while providing each retailer with detailed insights into their own customer behavior.</li>
                                    <li><strong>Security & Compliance:</strong> Ensure robust security, data privacy, and compliance (e.g., GDPR, POPIA) across the entire multi-tenant platform.</li>
                                    <li><strong>Centralized Innovation:</strong> Centrally manage and deploy cutting-edge features like AI-powered recommendations, generative campaign content, and in-store digital display management to all retailers simultaneously.</li>
                                </ul>
                                <h4>Technology Stack</h4>
                                <p>The platform is built on a modern, robust technology stack designed for performance, scalability, and rapid development:</p>
                                <ul>
                                    <li><strong>Frontend:</strong> Next.js with the App Router, React, and TypeScript for a type-safe, component-based architecture.</li>
                                    <li><strong>UI Framework:</strong> Tailwind CSS paired with ShadCN UI components for a highly customizable and modern design system.</li>
                                    <li><strong>Backend & Database:</strong> Firebase Suite, including Firestore for the NoSQL database, Firebase Authentication for user management, and Cloud Storage for assets like QR codes and logos.</li>
                                    <li><strong>Generative AI:</strong> Genkit, Google's open-source AI framework, powers all generative features, utilizing Google's Gemini family of models for tasks like content generation, data analysis, and conversational chat.</li>
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
                                <p>The system is architected as a multi-tenant platform with two primary interfaces, logically separated but managed from one codebase:</p>
                                <ol>
                                    <li><strong>iNteract AOE (Admin Panel):</strong> The super-admin dashboard for platform administrators to manage the entire ecosystem. Its primary role is retailer onboarding, system-wide configuration (security, AI policies), and monitoring overall platform health.</li>
                                    <li><strong>Retailer MVP (Retailer Dashboard):</strong> A replicated, sandboxed dashboard provided to each onboarded retailer. Retailers use this interface to manage their own QR campaigns, users, branding, billing, and view their specific analytics. Data is strictly segregated using Firestore Security Rules based on the authenticated user's `retailerId`.</li>
                                </ol>
                                <h4>Data Flow Example (QR Scan)</h4>
                                <p>A typical data flow for a customer interaction demonstrates the component communication:</p>
                                <ol>
                                    <li>A shopper scans a QR code, which points to a URL like `/track/&#123;qrId&#125;`.</li>
                                    <li>This hits a server-side Next.js Route Handler.</li>
                                    <li>The handler fetches the QR code data from Firestore and logs the scan event (device info, timestamp).</li>
                                    <li>Based on whether an `aiProfileId` is attached to the QR code, the handler redirects the user to either the final product URL or to an intermediary `/scan/&#123;qrId&#125;` page.</li>
                                    <li>The `/scan` page triggers a Genkit flow, which calls the Gemini LLM to generate an engaging message.</li>
                                    <li>The user sees the AI message and then proceeds to the final product page.</li>
                                </ol>
                                <h4>Security & Compliance</h4>
                                <p>Security is foundational, managed through Firebase Security Rules that enforce data access based on a user's custom claims (`retailerId`). All server-side operations are handled by Genkit flows, which run in a secure environment with `firebase-admin`, ensuring that database rules are bypassed safely for administrative tasks. The AI Policy & Compliance module provides a centralized place to govern data privacy, consent, and ethical AI use across the platform.</p>
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
                                    <li>Configure their brands, stores, and initial user accounts in the "Retailer Configuration" card that appears.</li>
                                    <li>For each user, use the "Manage Access" dropdown to set granular permissions for what they can see and do in their Retailer MVP sidebar.</li>
                                    <li>Click "Save Retailer Configuration". This action stores the configuration in `localStorage` (for this prototype) and generates a unique landing page URL (e.g., `/retailer/example-retail-group`) and a link to their sandboxed dashboard.</li>
                                </ol>
                                <h4>Core Integration & Security</h4>
                                <p>The "Core Integration" section is where platform-wide API keys can be managed for connecting to third-party systems. The various security pages ("Platform Security", "AOE Security", "External Security & Integrations") provide real-time overviews of system health, potential threats, and integration statuses.</p>
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
                                <p>The core customer journey is designed to be seamless and engaging:</p>
                                <ol>
                                    <li>A shopper scans a QR code on a product in-store using their smartphone.</li>
                                    <li>The code redirects to a tracking URL (`/track/&#123;qrId&#125;`) which logs the scan event and increments analytics counters in Firestore.</li>
                                    <li>The user is then redirected to an interactive loading screen (`/scan/&#123;qrId&#125;`) where an AI assistant provides a brief, engaging message tailored to the campaign's AI Profile.</li>
                                    <li>After reading the message, the user clicks "Continue" to land on the product's detail page, complete with product information, images, and AI-powered cross-sell recommendations.</li>
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
                                <p>The platform relies on several key Firestore collections to manage data for each retailer:</p>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Collection</TableHead>
                                            <TableHead>Purpose</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell>`bulkQrRequests`</TableCell><TableCell>Stores metadata, status, and subcollections for each bulk QR code generation job initiated by a retailer.</TableCell></TableRow>
                                        <TableRow><TableCell>`qrcodes`</TableCell><TableCell>A master list of all individual QR codes, their properties (like `redirectUrl`, `aiProfileId`), and scan counts.</TableCell></TableRow>
                                        <TableRow><TableCell>`scanEvents`</TableCell><TableCell>Logs every individual scan event, capturing timestamp, user agent, and other metadata for detailed analytics.</TableCell></TableRow>
                                        <TableRow><TableCell>`ai_profiles`</TableCell><TableCell>Stores configurable AI personalities (tone, intent, constraints) that can be assigned to QR codes to drive interactions.</TableCell></TableRow>
                                        <TableRow><TableCell>`users`</TableCell><TableCell>Manages retailer-specific user accounts, their roles, and their granular permissions for the Retailer MVP dashboard.</TableCell></TableRow>
                                        <TableRow><TableCell>`subscriptions`</TableCell><TableCell>Handles retailer billing plans, payment methods, and contains a subcollection for invoice history.</TableCell></TableRow>
                                        <TableRow><TableCell>`displays`</TableCell><TableCell>Manages physical in-store display devices, their status, and assigned content configurations.</TableCell></TableRow>
                                        <TableRow><TableCell>`inStoreConfigs`</TableCell><TableCell>Contains the content definitions (e.g., static images, AI prompts) that can be assigned to in-store displays.</TableCell></TableRow>
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
                                <p>So far, we have built the foundational structure for both the iNteract AOE and the Retailer MVP. This includes user management, dynamic sidebars based on permissions, and initial implementations for QR code management, AI-driven analytics, in-store display management, and security/compliance dashboards. Many features are currently powered by mock data to facilitate rapid UI/UX development and will be connected to live Firestore data sources as backend development progresses.</p>
                                <h4>Deployment</h4>
                                <p>The application is a Next.js project designed for serverless deployment on platforms like Firebase App Hosting or Vercel. Genkit flows are intended to be deployed as Cloud Functions. Continuous integration and deployment (CI/CD) pipelines can be set up using GitHub Actions to automate testing and deployment processes, ensuring a stable and reliable release cycle.</p>
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
