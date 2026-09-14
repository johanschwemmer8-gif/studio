'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PhoneMockup from "@/components/dashboard/phone-mockup";
import ProductPagePreview from "@/components/dashboard/product-page-preview";

export default function QrAiManagementPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    QR & AI Management
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Preview and simulate the AI-driven shopper experience.
                </p>
            </div>
            <Separator />

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Mobile Preview</CardTitle>
                            <CardDescription>
                                This is how the product page will render on a customer's cellphone after they scan a QR code.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <PhoneMockup>
                                <ProductPagePreview />
                            </PhoneMockup>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
