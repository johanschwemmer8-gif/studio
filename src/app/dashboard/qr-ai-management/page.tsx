
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PhoneMockup from "@/components/dashboard/phone-mockup";
import ProductPagePreview from "@/components/dashboard/product-page-preview";
import QrCodeGenerator from "@/components/dashboard/qr-code-generator";
import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Trash2, QrCode, Sparkles, AlertTriangle, Copy, Upload } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { generateBulkQrCodes, GenerateBulkQrCodesOutput } from "@/ai/flows/generate-bulk-qr-codes";
import { importExternalQrCodes, ImportExternalQrCodesOutput } from "@/ai/flows/import-external-qr-codes";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type GeneratedQrCode = {
  url: string;
  qrCodeUrl: string;
};

const bulkGenerateSchema = z.object({
  retailerId: z.string().min(1, { message: 'Retailer ID is required.' }),
  campaignId: z.string().min(1, { message: 'Campaign ID is required.' }),
  quantity: z.coerce.number().int().min(1, 'Must be at least 1').max(500, 'Maximum is 500'),
  baseUrl: z.string().url({ message: 'Please enter a valid base URL.' }),
  customParams: z.string().optional(),
});

type BulkGenerateFormValues = z.infer<typeof bulkGenerateSchema>;

const externalImportSchema = z.object({
  retailerId: z.string().min(1, { message: 'Retailer ID is required.' }),
  campaignId: z.string().min(1, { message: 'Campaign ID is required.' }),
  file: z.any().refine(files => files?.length === 1, 'CSV file is required.'),
});

type ExternalImportFormValues = z.infer<typeof externalImportSchema>;


type BatchResult = GenerateBulkQrCodesOutput & {
    timestamp: string;
}

type ImportResult = ImportExternalQrCodesOutput & {
    timestamp: string;
}


export default function QrAiManagementPage() {
    const [generatedCodes, setGeneratedCodes] = useState<GeneratedQrCode[]>([]);
    const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
    const [importResults, setImportResults] = useState<ImportResult[]>([]);
    const [isGenerating, startGenerating] = useTransition();
    const [isImporting, startImporting] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const bulkForm = useForm<BulkGenerateFormValues>({
        resolver: zodResolver(bulkGenerateSchema),
        defaultValues: {
            retailerId: 'example-retailer',
            campaignId: 'summer-sale-2024',
            quantity: 10,
            baseUrl: 'https://example.com/product',
            customParams: 'utm_source=instore&utm_medium=qr'
        }
    });

    const importForm = useForm<ExternalImportFormValues>({
        resolver: zodResolver(externalImportSchema),
        defaultValues: {
            retailerId: 'example-retailer',
            campaignId: 'external-promo-2024',
        }
    });

    const handleQrGenerated = (url: string, qrCodeUrl: string) => {
        setGeneratedCodes(prev => [...prev, { url, qrCodeUrl }]);
    };

    const handleRemoveCode = (index: number) => {
        setGeneratedCodes(prev => prev.filter((_, i) => i !== index));
    };

    const onBulkSubmit = (values: BulkGenerateFormValues) => {
        setError(null);
        startGenerating(async () => {
            try {
                const result = await generateBulkQrCodes(values);
                setBatchResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
                toast({
                    title: 'Batch Generation Successful',
                    description: `${result.count} QR codes have been created with batch ID: ${result.batchId}`,
                });
            } catch (e) {
                console.error(e);
                setError('Failed to generate QR code batch. Please check the console for details.');
            }
        });
    };
    
    const onImportSubmit = (values: ExternalImportFormValues) => {
        setError(null);
        const file = values.file[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const csvData = e.target?.result as string;
            startImporting(async () => {
                try {
                    const result = await importExternalQrCodes({
                        retailerId: values.retailerId,
                        campaignId: values.campaignId,
                        csvData,
                    });
                    setImportResults(prev => [...prev, {...result, timestamp: new Date().toISOString() }]);
                    toast({
                        title: 'Import Successful',
                        description: `Imported: ${result.importedCount}, Errors: ${result.errorCount}. Batch ID: ${result.batchId}`,
                    });
                } catch(e) {
                     console.error(e);
                     setError('Failed to import QR code batch. Please check the console for details.');
                }
            });
        };
        reader.readAsText(file);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: 'Batch ID copied to clipboard.',
        });
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
                </div>
                {/* BULK GENERATOR AND RESULTS */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Bulk QR Code Generator</CardTitle>
                            <CardDescription>
                                Create a large batch of unique QR codes for your campaigns. Each code will have a unique ID appended to the base URL.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...bulkForm}>
                                <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={bulkForm.control} name="retailerId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Retailer ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={bulkForm.control} name="campaignId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Campaign ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={bulkForm.control} name="baseUrl" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Base URL</FormLabel>
                                            <FormControl><Input placeholder="https://your-store.com/product" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={bulkForm.control} name="customParams" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Custom URL Parameters (Optional)</FormLabel>
                                            <FormControl><Input placeholder="utm_source=instore&utm_medium=qr" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={bulkForm.control} name="quantity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl><Input type="number" min="1" max="500" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Generation Failed</AlertTitle>
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                    <Button type="submit" disabled={isGenerating}>
                                        {isGenerating ? 'Generating...' : 'Generate Batch'}
                                        {isGenerating && <Sparkles className="ml-2 h-4 w-4 animate-spin" />}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Upload className="text-primary"/> Import External QR Codes</CardTitle>
                            <CardDescription>
                                Upload a CSV of your existing QR code IDs and URLs to wrap them with iNteract tracking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...importForm}>
                                <form onSubmit={importForm.handleSubmit(onImportSubmit)} className="space-y-6">
                                     <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={importForm.control} name="retailerId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Retailer ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={importForm.control} name="campaignId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Campaign ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={importForm.control} name="file" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CSV File</FormLabel>
                                            <FormDescription>Must contain 'id' and 'url' columns.</FormDescription>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept=".csv"
                                                    onChange={(e) => field.onChange(e.target.files)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <Button type="submit" disabled={isImporting}>
                                        {isImporting ? 'Importing...' : 'Import Codes'}
                                        {isImporting && <Sparkles className="ml-2 h-4 w-4 animate-spin" />}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {(isGenerating || batchResults.length > 0) &&
                        <Card>
                             <CardHeader>
                                <CardTitle>Batch Generation History</CardTitle>
                                <CardDescription>
                                    A list of all QR code batches you have generated in this session.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Batch ID</TableHead>
                                            <TableHead>Count</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isGenerating && (
                                            <TableRow>
                                                <TableCell colSpan={4}>
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4 animate-spin text-primary"/>
                                                        <span className="text-muted-foreground">Generating new batch...</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {batchResults.slice().reverse().map((batch) => (
                                            <TableRow key={batch.batchId}>
                                                <TableCell className="font-mono text-xs">
                                                     <div className="flex items-center gap-2">
                                                        <span>{batch.batchId}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(batch.batchId)}><Copy className="h-3 w-3"/></Button>
                                                     </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{batch.count}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{new Date(batch.timestamp).toLocaleTimeString()}</TableCell>
                                                <TableCell className="text-right">
                                                     <Button variant="outline" size="sm">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Export
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    }

                    {importResults.length > 0 &&
                        <Card>
                             <CardHeader>
                                <CardTitle>Import History</CardTitle>
                                <CardDescription>
                                    A list of all external QR code batches you have imported.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Batch ID</TableHead>
                                            <TableHead>Imported</TableHead>
                                            <TableHead>Errors</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {importResults.slice().reverse().map((batch) => (
                                            <TableRow key={batch.batchId}>
                                                <TableCell className="font-mono text-xs">
                                                     <div className="flex items-center gap-2">
                                                        <span>{batch.batchId}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(batch.batchId)}><Copy className="h-3 w-3"/></Button>
                                                     </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-green-500">{batch.importedCount}</TableCell>
                                                <TableCell className="font-medium text-red-500">{batch.errorCount}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{new Date(batch.timestamp).toLocaleTimeString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    }

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

    