
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PhoneMockup from "@/components/dashboard/phone-mockup";
import ProductPagePreview from "@/components/dashboard/product-page-preview";
import QrCodeGenerator from "@/components/dashboard/qr-code-generator";
import { useState, useTransition, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Trash2, QrCode, Sparkles, AlertTriangle, Copy, Check, Upload, FileText, BarChart2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { generateBulkQrCodes, GenerateBulkQrCodesOutput } from "@/ai/flows/generate-bulk-qr-codes";
import { importExternalQrCodes, ImportExternalQrCodesOutput } from "@/ai/flows/import-external-qr-codes";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Papa from 'papaparse';
import ScanAnalytics from "@/components/dashboard/scan-analytics";

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
  file: z.instanceof(FileList).refine(files => files?.length === 1, 'CSV file is required.'),
});

type ExternalImportFormValues = z.infer<typeof externalImportSchema>;


type BatchResult = GenerateBulkQrCodesOutput & {
    timestamp: string;
}

type ExternalBatchResult = ImportExternalQrCodesOutput & {
    timestamp: string;
}


export default function QrAiManagementPage() {
    const [generatedCodes, setGeneratedCodes] = useState<GeneratedQrCode[]>([]);
    const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
    const [externalBatchResults, setExternalBatchResults] = useState<ExternalBatchResult[]>([]);
    const [isGenerating, startGenerating] = useTransition();
    const [isImporting, startImporting] = useTransition();
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bulkGenerateForm = useForm<BulkGenerateFormValues>({
        resolver: zodResolver(bulkGenerateSchema),
        defaultValues: {
            retailerId: 'example-retailer',
            campaignId: 'summer-sale-2024',
            quantity: 10,
            baseUrl: 'https://example.com/product',
            customParams: 'utm_source=instore&utm_medium=qr'
        }
    });

    const externalImportForm = useForm<ExternalImportFormValues>({
        resolver: zodResolver(externalImportSchema),
        defaultValues: {
            retailerId: 'example-retailer',
            campaignId: 'spring-promo-2024',
        }
    });

    const handleQrGenerated = (url: string, qrCodeUrl: string) => {
        setGeneratedCodes(prev => [...prev, { url, qrCodeUrl }]);
    };

    const handleRemoveCode = (index: number) => {
        setGeneratedCodes(prev => prev.filter((_, i) => i !== index));
    };

    const onBulkSubmit = (values: BulkGenerateFormValues) => {
        setGenerationError(null);
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
                setGenerationError('Failed to generate QR code batch. Please check the console for details.');
            }
        });
    }

    const onExternalImportSubmit = (values: ExternalImportFormValues) => {
        const file = values.file[0];
        if (!file) return;

        setImportError(null);
        startImporting(async () => {
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const csvData = e.target?.result as string;
                    const result = await importExternalQrCodes({
                        retailerId: values.retailerId,
                        campaignId: values.campaignId,
                        csvData,
                    });
                     setExternalBatchResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
                     toast({
                        title: 'Import Successful',
                        description: `${result.importedCount} QR codes imported. ${result.errorCount} rows failed.`,
                    });
                    externalImportForm.reset();
                    if(fileInputRef.current) fileInputRef.current.value = "";
                };
                reader.onerror = () => {
                    setImportError('Failed to read the uploaded file.');
                }
                reader.readAsText(file);
            } catch(e) {
                 console.error(e);
                setImportError('Failed to import QR code batch. Please check the file format and console for details.');
            }
        });
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: 'Batch ID copied to clipboard.',
        });
    };
    
    const formFile = externalImportForm.register('file');

    return (
        <div className="space-y-8">
            <ScanAnalytics />
            
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
                            <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> iNteract QR Code Generation</CardTitle>
                            <CardDescription>
                                Create a large batch of unique QR codes managed by iNteract. Each code will have a unique ID appended to the base URL and stored in Firestore.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...bulkGenerateForm}>
                                <form onSubmit={bulkGenerateForm.handleSubmit(onBulkSubmit)} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={bulkGenerateForm.control} name="retailerId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Retailer ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={bulkGenerateForm.control} name="campaignId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Campaign ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={bulkGenerateForm.control} name="baseUrl" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Base URL</FormLabel>
                                            <FormControl><Input placeholder="https://your-store.com/product" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={bulkGenerateForm.control} name="customParams" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Custom URL Parameters (Optional)</FormLabel>
                                            <FormControl><Input placeholder="utm_source=instore&utm_medium=qr" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={bulkGenerateForm.control} name="quantity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl><Input type="number" min="1" max="500" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    {generationError && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Generation Failed</AlertTitle>
                                            <AlertDescription>{generationError}</AlertDescription>
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
                                Upload a CSV of your existing QR codes to track them with iNteract's analytics and engagement logic.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...externalImportForm}>
                                <form onSubmit={externalImportForm.handleSubmit(onExternalImportSubmit)} className="space-y-6">
                                     <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={externalImportForm.control} name="retailerId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Retailer ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={externalImportForm.control} name="campaignId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Campaign ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={externalImportForm.control} name="file" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CSV File</FormLabel>
                                            <FormDescription>Must contain 'id' and 'url' columns.</FormDescription>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept=".csv" 
                                                    {...formFile}
                                                    ref={fileInputRef}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    {importError && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Import Failed</AlertTitle>
                                            <AlertDescription>{importError}</AlertDescription>
                                        </Alert>
                                    )}
                                     <Button type="submit" disabled={isImporting}>
                                        {isImporting ? 'Importing...' : 'Import Codes'}
                                        {isImporting && <Sparkles className="ml-2 h-4 w-4 animate-spin" />}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {(isGenerating || batchResults.length > 0 || isImporting || externalBatchResults.length > 0) &&
                        <Card>
                             <CardHeader>
                                <CardTitle>Batch History</CardTitle>
                                <CardDescription>
                                    A list of all QR code batches you have generated or imported in this session.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Batch ID</TableHead>
                                            <TableHead>Count</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isGenerating && (
                                            <TableRow>
                                                <TableCell colSpan={5}>
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4 animate-spin text-primary"/>
                                                        <span className="text-muted-foreground">Generating new batch...</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {isImporting && (
                                            <TableRow>
                                                <TableCell colSpan={5}>
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4 animate-spin text-primary"/>
                                                        <span className="text-muted-foreground">Importing new batch...</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {externalBatchResults.slice().reverse().map((batch) => (
                                            <TableRow key={batch.batchId}>
                                                <TableCell><Badge variant="secondary">Imported</Badge></TableCell>
                                                <TableCell className="font-mono text-xs">
                                                     <div className="flex items-center gap-2">
                                                        <span>{batch.batchId}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(batch.batchId)}><Copy className="h-3 w-3"/></Button>
                                                     </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{batch.importedCount}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{new Date(batch.timestamp).toLocaleTimeString()}</TableCell>
                                                <TableCell className="text-right">
                                                     <Button variant="outline" size="sm">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Export
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {batchResults.slice().reverse().map((batch) => (
                                            <TableRow key={batch.batchId}>
                                                <TableCell><Badge>Generated</Badge></TableCell>
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
