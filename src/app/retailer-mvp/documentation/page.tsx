
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowUp, Clock, Percent, Sparkles, Tag, User, TrendingUp } from "lucide-react";

const metrics = [
    {
        icon: <User className="h-5 w-5 text-primary" />,
        title: "Unique Scans",
        definition: "This metric counts the number of individual, unique customers who have scanned a QR code. If the same person scans five different products, they are counted as one unique scan.",
        meaning: "This is a primary indicator of customer adoption and reach. A high number of unique scans suggests your in-store QR campaigns are successfully capturing the attention of a wide range of shoppers."
    },
    {
        icon: <TrendingUp className="h-5 w-5 text-primary" />,
        title: "Engagement Rate",
        definition: "This is the percentage of unique visitors who scanned a QR code. It measures how effectively your physical displays are converting store footfall into digital interactions.",
        meaning: "A rising engagement rate indicates that your QR code placements, calls-to-action, and in-store marketing are improving. It shows you're getting better at convincing customers to interact with your brand digitally."
    },
    {
        icon: <Tag className="h-5 w-5 text-primary" />,
        title: "Offer Redemption",
        definition: "This metric shows the percentage of personalized offers (delivered after a scan) that were redeemed by customers at checkout.",
        meaning: "This is a direct measure of how compelling your offers are. A high redemption rate means your AI is successfully identifying what motivates your customers, leading to direct sales impact."
    },
    {
        icon: <ArrowUp className="h-5 w-5 text-primary" />,
        title: "Basket Uplift",
        definition: "This shows the percentage increase in the average basket size of shoppers who engaged with the AOE platform compared to those who did not.",
        meaning: "This is a critical ROI metric. A positive uplift demonstrates that interacting with the platform leads customers to purchase more items, directly increasing your revenue per transaction."
    },
    {
        icon: <Percent className="h-5 w-5 text-primary" />,
        title: "Conversion Rate",
        definition: "The percentage of engaged users (those who scanned a QR code) who went on to make a purchase during their store visit.",
        meaning: "This metric connects digital engagement to a final sale. A strong conversion rate proves that the information and offers provided by the platform are effectively influencing purchasing decisions."
    },
    {
        icon: <Clock className="h-5 w-5 text-primary" />,
        title: "Dwell Time",
        definition: "The average amount of time, in seconds, a customer spends on the product page after scanning a QR code.",
        meaning: "Dwell time indicates the level of interest and engagement with your product content. Longer dwell times suggest that customers are finding the information valuable and are actively considering the product."
    }
];

export default function DocumentationPage() {
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-accent"/>
                        Getting Started Guide
                    </CardTitle>
                    <CardDescription>
                        A comprehensive guide to understanding and using your Retailer MVP Dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg font-semibold">1. Understanding the Metrics</AccordionTrigger>
                            <AccordionContent>
                                <p className="mb-4 text-muted-foreground">Your Executive Summary dashboard provides six key performance indicators (KPIs) to give you a high-level overview of the platform's impact. Here's what each one means.</p>
                                <div className="space-y-4">
                                    {metrics.map((metric) => (
                                        <div key={metric.title} className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                                            <div className="flex-shrink-0 mt-1">{metric.icon}</div>
                                            <div>
                                                <h4 className="font-semibold">{metric.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1"><strong>What it is:</strong> {metric.definition}</p>
                                                <p className="text-sm text-muted-foreground mt-1"><strong>What it means:</strong> {metric.meaning}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-lg font-semibold">2. Analyzing Performance (Coming Soon)</AccordionTrigger>
                            <AccordionContent>
                                This section will explain how to use the AI-powered analysis tools to get deeper insights from your data.
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-3">
                            <AccordionTrigger className="text-lg font-semibold">3. Managing QR Campaigns (Coming Soon)</AccordionTrigger>
                            <AccordionContent>
                                This section will walk you through creating, managing, and tracking your QR code campaigns.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
