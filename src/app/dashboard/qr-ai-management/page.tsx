
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PhoneMockup from "@/components/dashboard/phone-mockup";
import ProductPagePreview from "@/components/dashboard/product-page-preview";
import QrCodeGenerator from "@/components/dashboard/qr-code-generator";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

type GeneratedQrCode = {
  url: string;
  qrCodeUrl: string;
};

export default function QrAiManagementPage() {
    const [generatedCodes, setGeneratedCodes] = useState<GeneratedQrCode[]>([]);
    
    const handleQrGenerated = (url: string, qrCodeUrl: string) => {
        setGeneratedCodes(prev => [...prev, { url, qrCodeUrl }]);
    };

    const handleRemoveCode = (index: number) => {
        setGeneratedCodes(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    QR & AI Management
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Generate, manage, and analyze your QR code campaigns. Simulate the customer journey and configure AI-driven interactions.
                </p>
            </div>
            <Separator />
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* PREVIEW AND SINGLE GENERATOR */}
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
                {/* RESULTS */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Single QR Code Generator</CardTitle>
                            <CardDescription>
                                Create a single scannable QR code for a specific product URL to test the customer journey.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QrCodeGenerator onQrGenerated={handleQrGenerated} />
                        </CardContent>
                    </Card>
                    {generatedCodes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Generated Single Codes</CardTitle>
                                <CardDescription>
                                    A list of all single QR codes you have generated for testing.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product URL</TableHead>
                                            <TableHead>QR Code</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {generatedCodes.map((code, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono text-xs max-w-xs truncate">
                                                    <a href={code.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {code.url}
                                                    </a>
                                                </TableCell>
                                                <TableCell>
                                                    <a href={code.qrCodeUrl} download={`qr-code-${index}.png`} className="hover:opacity-80 transition-opacity">
                                                        <img src={code.qrCodeUrl} alt="QR Code" className="w-12 h-12 rounded-sm border" />
                                                    </a>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveCode(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

        </div>
    );
}
