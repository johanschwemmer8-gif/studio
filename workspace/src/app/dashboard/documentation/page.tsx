
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, BrainCircuit, FileText, Download, RefreshCw, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const DocSection = ({ title, version, date, icon, defaultOpen = false, children }: { title: string, version: string, date: string, children: React.ReactNode, icon: React.ReactNode, defaultOpen?: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">{icon}{title}</CardTitle>
            <CardDescription>Version: {version} | Effective Date: {date}</CardDescription>
        </CardHeader>
        <CardContent>
             <Accordion type="single" collapsible className="w-full" defaultValue={defaultOpen ? "item-1" : ""}>
                {children}
            </Accordion>
        </CardContent>
    </Card>
);

const SectionContent = ({ title, children, value }: { title: string, children: React.ReactNode, value: string }) => (
    <AccordionItem value={value}>
        <AccordionTrigger className="text-lg font-semibold">{title}</AccordionTrigger>
        <AccordionContent className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-primary">
            {children}
        </AccordionContent>
    </AccordionItem>
);

export default function AdminDocumentationPage() {
    const { toast } = useToast();
    const currentDate = new Date().toLocaleDateString('en-CA');
    const nextReviewDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-CA');

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
                        Governance, Risk & Compliance
                    </h2>
                    <p className="text-muted-foreground max-w-3xl">
                        Official policies governing information security, AI ethics, and data privacy for the iNteract AOE platform.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleUpdate}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check for Updates
                    </Button>
                     <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Download All as PDF
                    </Button>
                </div>
            </div>
            <Separator />
            
            <div className="space-y-8">
                 {/* TERMS AND CONDITIONS */}
                <DocSection title="Terms of Service for Retailers" version="1.0" date={currentDate} icon={<Briefcase className="text-primary"/>}>
                    <SectionContent title="1. Introduction & Acceptance" value="tos-1">
                        <h4>1.1 Introduction</h4>
                        <p>These Terms of Service ("Terms") govern your access to and use of the iNteract AOE software-as-a-service platform, including all related dashboards, APIs, and services (collectively, the "Service"). The Service is provided by iNteract AOE Pty Ltd., a company registered in South Africa ("iNteract AOE", "we", "us", "our").</p>
                        <h4>1.2 Acceptance</h4>
                        <p>By creating an account, signing a Service Order, or by accessing or using the Service, you, on behalf of the retail entity you represent ("Retailer", "you", "your"), agree to be bound by these Terms, our Privacy Policy, and our Information Security Policy. If you do not agree to these Terms, you may not use the Service.</p>
                        <h4>1.3 Authority</h4>
                        <p>You represent and warrant that you have the legal authority to bind the Retailer to these Terms. If you do not have such authority, you must not accept these Terms or use the Service.</p>
                    </SectionContent>
                    <SectionContent title="2. The Service" value="tos-2">
                        <h4>2.1 Service Description</h4>
                        <p>The Service is a white-label retail technology platform designed to enhance the in-store customer experience through QR code engagement, AI-powered personalization, and data analytics. The specific features, functionalities, and service levels available to you are defined in the subscription plan you have selected (the "Subscription Plan").</p>
                        <h4>2.2 License Grant</h4>
                        <p>Subject to your compliance with these Terms and payment of all applicable fees, iNteract AOE grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service for your internal business operations during the subscription term.</p>
                        <h4>2.3 Service Modifications</h4>
                        <p>We continuously improve the Service. We reserve the right to modify, enhance, or discontinue features of the Service at any time. We will provide at least thirty (30) days' notice for any material deprecation of functionality. For new features, we may release them at any time, and they may be subject to additional terms or fees.</p>
                    </SectionContent>
                    <SectionContent title="3. Retailer Obligations & Acceptable Use" value="tos-3">
                        <h4>3.1 Account Security</h4>
                        <p>You are responsible for all activities that occur under your account. You must maintain the confidentiality of your account credentials (usernames, passwords, API keys) and immediately notify us of any unauthorized use.</p>
                        <h4>3.2 Retailer Data</h4>
                        <p>You are solely responsible for the accuracy, quality, and legality of all data you provide or make accessible to the Service ("Retailer Data"), including product catalogs, pricing information, and any customer data shared via integrations. You must ensure you have all necessary rights and consents to use this data with the Service.</p>
                        <h4>3.3 Acceptable Use</h4>
                        <p>You agree not to, and not to permit your users to:</p>
                        <ul>
                            <li>Use the Service for any illegal or fraudulent purpose.</li>
                            <li>Reverse-engineer, decompile, or otherwise attempt to discover the source code of the Service.</li>
                            <li>Introduce any viruses, malware, or other harmful code into the Service.</li>
                            <li>Use the Service to send spam or unsolicited messages.</li>
                            <li>Attempt to gain unauthorized access to our systems or another user's data.</li>
                            <li>Exceed any rate limits or usage quotas specified in your Subscription Plan without prior written consent.</li>
                        </ul>
                    </SectionContent>
                    <SectionContent title="4. Fees, Payment, and Term" value="tos-4">
                        <h4>4.1 Subscription Fees</h4>
                        <p>You agree to pay all fees specified in your selected Subscription Plan. Fees are billed in advance on a monthly or annual basis, as agreed upon. All fees are non-refundable except as expressly stated otherwise in these Terms.</p>
                        <h4>4.2 Payment</h4>
                        <p>Payments will be processed via our designated payment processor. You must provide valid and up-to-date payment information. By providing this information, you authorize us to charge the recurring subscription fees to your payment method.</p>
                        <h4>4.3 Late Payments</h4>
                        <p>If any fees are not received by the due date, we may, without limiting our other rights, charge a late fee of 1.5% per month on the outstanding balance and/or suspend your access to the Service until payment is made in full.</p>
                        <h4>4.4 Term and Termination</h4>
                        <p>The initial term of your subscription will be as specified in your Service Order. Subscriptions automatically renew for successive periods of the same duration unless either party provides written notice of non-renewal at least thirty (30) days before the end of the current term. We may terminate these Terms and your access to the Service for cause if you are in material breach of these Terms and fail to cure such breach within thirty (30) days of receiving written notice.</p>
                    </SectionContent>
                    <SectionContent title="5. Data Ownership & Intellectual Property" value="tos-5">
                        <h4>5.1 Retailer Data</h4>
                        <p>As between you and iNteract AOE, you own all right, title, and interest in and to your Retailer Data. You grant us a worldwide, non-exclusive, royalty-free license to use, process, and transmit your Retailer Data as necessary to provide, maintain, and improve the Service.</p>
                        <h4>5.2 Anonymized & Aggregated Data</h4>
                        <p>You agree that iNteract AOE may collect, use, and create derivative works from anonymized and aggregated data derived from your use of the Service for the purposes of analytics, industry benchmarking, and improving our AI models and services. This aggregated data will not identify you or any individual.</p>
                        <h4>5.3 iNteract AOE Intellectual Property</h4>
                        <p>We own all right, title, and interest in and to the Service, including all underlying software, AI models, documentation, and know-how. No rights are granted to you hereunder other than as expressly set forth herein.</p>
                    </SectionContent>
                    <SectionContent title="6. Confidentiality" value="tos-6">
                        <p>"Confidential Information" means all information disclosed by one party to the other, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential. Your Confidential Information includes your Retailer Data; our Confidential Information includes the Service and its pricing. Each party agrees to use the same degree of care that it uses to protect its own confidential information (but not less than reasonable care) and not to use or disclose any Confidential Information of the other party except as necessary to perform its obligations under these Terms.</p>
                    </SectionContent>
                    <SectionContent title="7. Disclaimers & Limitation of Liability" value="tos-7">
                        <h4>7.1 Disclaimer of Warranties</h4>
                        <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.</p>
                        <h4>7.2 Limitation of Liability</h4>
                        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL INTERACT AOE'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS EXCEED THE TOTAL AMOUNT PAID BY YOU HEREUNDER IN THE TWELVE (12) MONTHS PRECEDING THE FIRST INCIDENT OUT OF WHICH THE LIABILITY AROSE. IN NO EVENT WILL WE BE LIABLE FOR ANY LOST PROFITS, REVENUE, OR FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, HOWEVER CAUSED.</p>
                    </SectionContent>
                    <SectionContent title="8. General Provisions" value="tos-8">
                        <h4>8.1 Governing Law</h4>
                        <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa, without regard to its conflict of law principles. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of South Africa.</p>
                        <h4>8.2 Entire Agreement</h4>
                        <p>These Terms, together with the Privacy Policy, Information Security Policy, and any applicable Service Order, constitute the entire agreement between the parties and supersede all prior agreements and communications.</p>
                        <h4>8.3 Severability</h4>
                        <p>If any provision of these Terms is held by a court of competent jurisdiction to be contrary to law, the provision will be modified by the court and interpreted so as best to accomplish the objectives of the original provision to the fullest extent permitted by law, and the remaining provisions will remain in effect.</p>
                        <h4>8.4 Contact Information</h4>
                        <p>For any questions about these Terms, please contact us at: legal@interact-aoe.com.</p>
                    </SectionContent>
                </DocSection>

                {/* INFORMATION SECURITY POLICY */}
                <DocSection title="Information Security Policy" version="1.0" date={currentDate} icon={<Shield className="text-primary"/>}>
                    <SectionContent title="1. Executive Summary" value="isp-1">
                        <h4>1.1 Purpose and Scope</h4>
                        <p>This Information Security Policy establishes the framework for protecting the confidentiality, integrity, and availability of all information assets belonging to iNteract AOE Pty Ltd. and its clients. It provides the guiding principles for our security program, ensuring data is protected against unauthorized access, use, disclosure, alteration, or destruction. The scope covers all systems, networks, data, employees, and third-party contractors associated with the iNteract AOE platform.</p>
                        <h4>1.2 Management Commitment</h4>
                        <p>iNteract AOE management, led by the CEO, is fully committed to implementing and maintaining a robust Information Security Management System (ISMS) aligned with ISO 27001 principles. We pledge to provide the necessary resources to support this policy and to continually improve our security posture in response to evolving threats and business requirements.</p>
                        <h4>1.3 Policy Objectives</h4>
                        <ul>
                            <li><strong>Confidentiality:</strong> Ensure that information is accessible only to those authorized to have access.</li>
                            <li><strong>Integrity:</strong> Safeguard the accuracy and completeness of information and processing methods.</li>
                            <li><strong>Availability:</strong> Ensure that authorized users have access to information and associated assets when required.</li>
                            <li><strong>Compliance:</strong> Comply with all applicable legal, statutory, regulatory, and contractual requirements, including the Protection of Personal Information Act (POPIA) of South Africa.</li>
                            <li><strong>Risk Management:</strong> Systematically identify, assess, and treat information security risks to an acceptable level.</li>
                        </ul>
                    </SectionContent>
                    <SectionContent title="2. Scope & Applicability" value="isp-2">
                        <h4>2.1 Systems Covered</h4>
                        <p>This policy applies to all information technology systems and data managed by iNteract AOE, including but not limited to:</p>
                        <ul>
                            <li><strong>Backend Infrastructure:</strong> All cloud servers (Node.js applications), databases (PostgreSQL), and serverless functions hosted on Google Cloud Platform (GCP) or Amazon Web Services (AWS).</li>
                            <li><strong>Frontend Applications:</strong> The iNteract AOE Admin Panel and the Retailer MVP dashboards, built with Next.js and React.</li>
                            <li><strong>AI/ML Models:</strong> All proprietary and third-party models (e.g., Google Gemini) used for personalization, analytics, and other platform features.</li>
                            <li><strong>Databases:</strong> All production and development databases containing customer data, retailer metrics, and application data.</li>
                            <li><strong>Source Code Repositories:</strong> All company source code hosted on platforms like GitHub.</li>
                        </ul>
                        <h4>2.2 Personnel Covered</h4>
                        <p>This policy applies to all individuals who have access to iNteract AOE's information assets, including:</p>
                        <ul>
                            <li>All full-time and part-time employees.</li>
                            <li>All contractors, consultants, and temporary staff.</li>
                            <li>Third-party vendors and partners with access to our systems.</li>
                            <li>All platform users, to the extent of the Acceptable Use Policy.</li>
                        </ul>
                        <h4>2.3 Geographic Scope</h4>
                        <p>This policy is effective across all operational jurisdictions. Initially, this primarily covers the Republic of South Africa. As iNteract AOE expands, this policy will be updated to reflect compliance with the legal and regulatory frameworks of new territories across Africa and other regions.</p>
                    </SectionContent>
                    <SectionContent title="3. Information Security Governance" value="isp-3">
                         <h4>3.1 Organizational Structure</h4>
                        <p>Information security governance at iNteract AOE is structured to ensure clear lines of authority, responsibility, and accountability. It operates on a top-down model, with ultimate responsibility resting with the CEO and the board (once established). The structure is designed to be agile, allowing for rapid response to security incidents while maintaining rigorous oversight.</p>
                        
                        <h4>3.2 Roles and Responsibilities</h4>
                        <ul>
                            <li><strong>Chief Executive Officer (CEO) / Founder (Johan Schwemmer):</strong> Holds ultimate accountability for the company's information security program. Responsible for approving the Information Security Policy, allocating sufficient resources for its implementation, and leading the company's security culture.</li>
                            <li><strong>Chief Technology Officer (CTO) / Technical Lead:</strong> Responsible for the hands-on implementation, management, and monitoring of all technical security controls outlined in this policy. Oversees the secure development lifecycle, infrastructure security, and incident response team.</li>
                            <li><strong>Data Protection Officer (DPO):</strong> Responsible for ensuring compliance with data protection regulations, primarily POPIA. The DPO handles data subject access requests, liaises with the Information Regulator, and conducts Privacy Impact Assessments (PIAs). Initially, this role is held by the CEO.</li>
                            <li><strong>All Team Members:</strong> Every employee and contractor is responsible for complying with this policy in their day-to-day activities. This includes using strong passwords, reporting security incidents promptly, and handling data according to its classification level.</li>
                        </ul>

                        <h4>3.3 Security Committee Structure</h4>
                        <p>An Ethics & Security Committee is established to provide cross-functional oversight. Its mandate includes:</p>
                        <ul>
                            <li>Reviewing and approving security policies and procedures.</li>
                            <li>Reviewing the results of risk assessments and security audits.</li>
                            <li>Overseeing the response to major security incidents.</li>
                            <li>Assessing the security implications of new technologies or business initiatives.</li>
                        </ul>
                        <p>The committee meets quarterly and is composed of the CEO, CTO, and DPO.</p>

                        <h4>3.4 Escalation Procedures</h4>
                        <p>A clear escalation path is defined for security incidents:</p>
                        <ol>
                            <li><strong>Initial Detection:</strong> Any team member who detects a potential security incident must immediately report it to the CTO.</li>
                            <li><strong>Initial Triage (CTO):</strong> The CTO performs an initial assessment to determine the severity and immediate containment steps required.</li>
                            <li><strong>Escalation to CEO:</strong> For any medium or high-severity incidents, the CTO must escalate to the CEO within one hour of triage.</li>
                            <li><strong>Escalation to DPO:</strong> If the incident involves personal information, the DPO must be notified concurrently with the CEO.</li>
                            <li><strong>Committee Convening:</strong> For high-severity incidents, the CEO will convene an emergency meeting of the Security Committee within 24 hours.</li>
                        </ol>
                    </SectionContent>
                </DocSection>
                
                {/* AI ETHICS & BIAS PREVENTION POLICY */}
                 <DocSection title="AI Ethics & Bias Prevention Policy" version="1.0" date={currentDate} icon={<BrainCircuit className="text-primary"/>}>
                    <SectionContent title="1. Executive Summary" value="aip-1">
                        <h4>1.1 Purpose</h4>
                        <p>This policy defines the ethical principles and bias prevention framework governing the design, development, deployment, and monitoring of all Artificial Intelligence (AI) and Machine Learning (ML) models within the iNteract AOE platform. Its purpose is to ensure our AI systems are fair, transparent, accountable, and aligned with our commitment to responsible innovation.</p>
                        <h4>1.2 Scope</h4>
                        <p>This policy applies to all AI/ML models, algorithms, and data-driven features used in the iNteract platform. This includes, but is not limited to, product recommendation engines, personalization algorithms, customer service chatbots, and analytical models that generate business insights.</p>
                        <h4>1.3 Commitment to Responsible AI</h4>
                        <p>iNteract AOE is committed to developing and deploying AI that benefits our clients and their customers without causing unfair or discriminatory outcomes. We believe that ethical considerations are not an add-on but a core component of building robust and trustworthy technology. This policy serves as the foundation for that commitment.</p>
                    </SectionContent>
                 </DocSection>

                {/* DATA PROTECTION & PRIVACY POLICY */}
                <DocSection title="Data Protection & Privacy Policy" version="1.0" date={currentDate} icon={<FileText className="text-primary"/>}>
                    <SectionContent title="1. Executive Summary" value="dpp-1">
                        <h4>1.1 Commitment to Data Protection</h4>
                        <p>iNteract AOE Pty Ltd. ("we," "us," or "our") is unequivocally committed to protecting the privacy and personal information of our clients, their customers, and our employees. This policy outlines our comprehensive approach to data protection, ensuring that all personal information is handled securely, lawfully, and transparently.</p>
                        <h4>1.2 POPIA Compliance Statement</h4>
                        <p>This policy is designed to ensure full compliance with the Protection of Personal Information Act (POPIA), Act 4 of 2013, of South Africa. It details the principles we follow, the rights of data subjects, and the security measures we have implemented to meet and exceed our legal obligations.</p>
                        <h4>1.3 Scope of Policy</h4>
                        <p>This policy applies to all personal information processed by iNteract AOE in the course of providing our services. This includes data collected from end-users (shoppers) in retail environments, data provided by our retailer clients, and data from our own employees and business partners.</p>
                    </SectionContent>
                </DocSection>
            </div>
        </div>
    );
}
