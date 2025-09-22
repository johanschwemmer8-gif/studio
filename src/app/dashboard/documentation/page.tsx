
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, LifeBuoy, Rocket, Shield, Users } from "lucide-react";

const DocSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Card className="bg-muted/30">
        <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

export default function AdminDocumentationPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    Documentation & Training Modules
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Find resources, guides, and training materials to help you get the most out of the iNteract-AOE platform.
                </p>
            </div>
            <Separator />
            
            <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* iNteract AOE Documentation */}
                <DocSection title="iNteract AOE Platform Guide">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Rocket className="h-5 w-5 text-primary" />
                                    <span>Introduction</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The iNteract AOE (Admin & Operations Environment) is the central nervous system of the platform. As an administrator, you use this dashboard to manage all retailers, configure core system settings, monitor security, and deploy updates to the entire network.</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span>Retailer Management</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>Onboarding a New Retailer</h4>
                                <ol>
                                    <li>Navigate to the <strong>iNteract Admin Panel</strong>.</li>
                                    <li>Click "Add New Retailer" and enter the retailer's name.</li>
                                    <li>Configure their brands, stores, and initial user accounts.</li>
                                    <li>Define their access permissions using the "Manage Access" dropdown.</li>
                                    <li>Click "Save Retailer Configuration". This generates their unique landing page and MVP dashboard.</li>
                                </ol>
                                <h4>Core Integration</h4>
                                <p>Use the "Core Integration" section to generate and manage API keys. These keys are assigned to retailers to grant them secure access to iNteract services.</p>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-3">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <span>Security & Compliance</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>The security pages provide a real-time overview of system health, external integrations, and potential threats. Use the "AI Policy & Compliance" page to govern how AI is used across the platform, ensuring ethical standards and legal compliance are met.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </DocSection>

                 {/* Retailer MVP Documentation */}
                <DocSection title="Retailer MVP Guide">
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <span>Getting Started</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>Welcome to your Retailer MVP Dashboard! This is your hub for managing in-store digital experiences. Start by exploring your dashboard to see key metrics. Then, head to "QR Management" to create your first campaign.</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <span>QR & AI Management</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <h4>Bulk QR Generator</h4>
                                <p>Create thousands of unique QR codes for a campaign. You can upload a CSV of URLs or enter them manually. Apply custom styles to match your brand.</p>
                                <h4>AI Profile Manager</h4>
                                <p>Define AI personalities for customer interactions. Choose a personality (e.g., "Friendly," "Expert") and set goals (e.g., "Upsell," "Info-only"). These profiles can then be assigned to your QR codes.</p>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-3">
                             <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <span>Analytics & Reporting</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                <p>Use the analytics pages (Dashboard, ROI, Scan Analytics) to track performance. The AI-powered "Analyze" buttons on these pages provide automated insights, conclusions, and recommendations to help you optimize your campaigns.</p>
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
