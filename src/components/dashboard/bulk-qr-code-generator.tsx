
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  RefreshCw,
  Loader2,
  Link as LinkIcon,
  Sparkles,
  PlusCircle,
  Store,
  Send,
  Printer,
  Image as ImageIcon,
  Video,
  Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
import { getQrTemplates } from '@/ai/flows/get-qr-templates';
import type { QrTemplate } from '@/lib/schemas/qr-templates';
import { type FormValues as BrandFormValues } from './brand-management-form';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const styleSchema = z.object({
  logoPath: z.string().url().optional().or(z.literal('')),
  // AI Options
  aiTone: z.string().optional(),
  aiGoal: z.string().optional(),
  aiPersona: z.string().optional(),
  aiGreeting: z.string().optional(),
  aiKeyPoints: z.string().optional(),
  aiOffer: z.string().optional(),
  aiRecommendations: z.string().optional(),
  // Media Options
  mediaType: z.enum(['image', 'video']).optional(),
  mediaUrl: z.string().optional().or(z.literal('')),
  headline: z.string().optional(),
  subhead: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().optional(),
  category: z.string().optional(),
});

const formSchema = z.object({
  retailerId: z.string().min(1, 'Retailer ID is required'),
  brandId: z.string().min(1, 'Brand is required'),
  campaignId: z.string().min(1, 'Campaign ID is required'),
  count: z.number().int().min(1, "Must request at least 1 code.").max(10000, "Cannot request more than 10,000 codes."),
  baseRedirect: z.string().url("Must be a valid HTTPS URL.").refine(s => s.startsWith('https://'), "URL must be HTTPS."),
  options: styleSchema.optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BulkQRCodeGenerator() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [templates, setTemplates] = useState<QrTemplate[]>([]);
    const [mediaInputMethod, setMediaInputMethod] = useState<'url' | 'upload'>('url');
    const [brands, setBrands] = useState<BrandFormValues['brands']>([]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const result = await getQrTemplates({ retailerId: 'simulated-retailer-id' });
                setTemplates(result);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Could not load QR code templates.',
                    variant: 'destructive',
                });
            }
        };
        fetchTemplates();
        
        try {
            const savedBrandData = localStorage.getItem('brandManagement');
            if (savedBrandData) {
                const parsedData: BrandFormValues = JSON.parse(savedBrandData);
                setBrands(parsedData.brands || []);
            }
        } catch (error) {
            console.error("Failed to parse brand data from localStorage", error);
            toast({
                title: 'Error Loading Brands',
                description: 'Could not load brand data from your browser storage.',
                variant: 'destructive',
            });
        }
    }, [toast]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            retailerId: 'simulated-retailer-id',
            campaignId: `campaign-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            count: 100,
            baseRedirect: 'https://',
            options: {
              aiTone: 'Professional',
              aiGoal: 'Drive sales',
              aiPersona: 'Knowledgeable product expert',
              aiGreeting: 'Hello! How can I help you with this product today?',
              aiKeyPoints: '',
              aiOffer: '',
              aiRecommendations: '',
              mediaType: undefined,
              mediaUrl: '',
              headline: '',
              subhead: '',
            }
        },
    });
    
    const handleTemplateChange = (templateId: string) => {
        const selectedTemplate = templates.find(t => t.templateId === templateId);
        if (selectedTemplate) {
            form.setValue('options.aiTone', selectedTemplate.defaults.aiTone || '');
            form.setValue('options.aiGoal', selectedTemplate.defaults.aiGoal || '');
            toast({
                title: 'Template Applied',
                description: `"${selectedTemplate.name}" styles have been loaded.`,
            });
        }
    };

    const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                form.setValue('options.mediaUrl', reader.result as string);
                toast({
                    title: 'Media Selected',
                    description: `File "${file.name}" has been loaded and added as a data URL.`,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const result = await submitBulkQrRequest(data);

            if (result.success) {
                toast({
                    title: 'Request Submitted!',
                    description: `Job ${result.requestId} for campaign "${data.campaignId}" has been queued.`,
                });
                form.reset();
            } else {
                 throw new Error('Submission failed on the server.');
            }

        } catch (error: any) {
             toast({
                title: 'Submission Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
     const handlePrint = () => {
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(form.getValues('baseRedirect') || 'https://example.com')}`;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>Test Print</title></head>
                    <body style="text-align: center; margin-top: 50px;">
                        <img src="${url}" alt="Test QR Code" />
                        <p>Scan to test</p>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } else {
            toast({
                title: "Print Error",
                description: "Could not open print window. Please check your browser's pop-up settings.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Create New QR Code Campaign
                    </h2>
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Campaign
                    </Button>
                </div>
                <p className="text-muted-foreground max-w-3xl mb-4">
                    Generate a large batch of unique, trackable QR codes for your products or campaigns.
                </p>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
                                <div>
                                    <Label htmlFor="retailerId">Retailer ID</Label>
                                    <Input id="retailerId" {...form.register('retailerId')} placeholder="e.g., store-123" />
                                    {form.formState.errors.retailerId && <p className="text-sm text-destructive mt-1">{form.formState.errors.retailerId.message}</p>}
                                </div>
                                <Controller
                                    control={form.control}
                                    name="brandId"
                                    render={({ field }) => (
                                        <div className="space-y-2">
                                            <Label>Brand</Label>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select a brand..." /></SelectTrigger>
                                                <SelectContent>
                                                    {brands.length > 0 ? brands.map(brand => (
                                                        <SelectItem key={brand.name} value={brand.name}>{brand.name}</SelectItem>
                                                    )) : <SelectItem value="none" disabled>No brands configured.</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                            {form.formState.errors.brandId && <p className="text-sm text-destructive mt-1">{form.formState.errors.brandId.message}</p>}
                                        </div>
                                    )}
                                />
                                <div>
                                    <Label htmlFor="campaignId">Campaign ID</Label>
                                    <Input id="campaignId" {...form.register('campaignId')} placeholder="e.g., summer-sale-2024" />
                                    {form.formState.errors.campaignId && <p className="text-sm text-destructive mt-1">{form.formState.errors.campaignId.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="count">Number of Codes</Label>
                                    <Input id="count" type="number" {...form.register('count', { valueAsNumber: true })} />
                                    {form.formState.errors.count && <p className="text-sm text-destructive mt-1">{form.formState.errors.count.message}</p>}
                                </div>
                                <div className="lg:col-span-2">
                                    <Label htmlFor="baseRedirect">Final Redirect URL</Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="baseRedirect" {...form.register('baseRedirect')} placeholder="https://your-store.com/product" className="pl-9"/>
                                    </div>
                                    {form.formState.errors.baseRedirect && <p className="text-sm text-destructive mt-1">{form.formState.errors.baseRedirect.message}</p>}
                                </div>
                            </div>
                        </div>
                        <Accordion type="multiple" className="w-full mt-4">
                            {/* AI Generation Accordion */}
                            <AccordionItem value="ai-generation">
                                <AccordionTrigger className="font-semibold">
                                    <Sparkles className="mr-2 h-4 w-4 text-accent" /> AI Content Generation
                                </AccordionTrigger>
                                <AccordionContent className="pt-4">
                                     <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Load from Template</Label>
                                            <Select onValueChange={handleTemplateChange}>
                                                <SelectTrigger><SelectValue placeholder="Select a template to apply styles..." /></SelectTrigger>
                                                <SelectContent>
                                                    {templates.map(template => (
                                                        <SelectItem key={template.templateId} value={template.templateId}>{template.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Selecting a template will pre-fill the options below.</p>
                                        </div>
                                         <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                              <div>
                                                  <Label htmlFor="aiPersona">AI Persona / Role</Label>
                                                  <Input id="aiPersona" {...form.register('options.aiPersona')} placeholder="e.g., Expert Denim Stylist" />
                                              </div>
                                              <div>
                                                  <Label htmlFor="aiTone">AI Tone</Label>
                                                  <Input id="aiTone" {...form.register('options.aiTone')} placeholder="e.g., Playful and exciting" />
                                              </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="aiGoal">Campaign Goal</Label>
                                                    <Textarea id="aiGoal" {...form.register('options.aiGoal')} placeholder="e.g., Drive sales for the new shoe line" />
                                                </div>
                                            </div>
                                        </div>
                                     </div>
                                </AccordionContent>
                            </AccordionItem>
                             {/* Campaign Media Accordion */}
                             <AccordionItem value="campaign-media">
                                <AccordionTrigger className="font-semibold">
                                    <ImageIcon className="mr-2 h-4 w-4 text-primary" /> Campaign Media
                                </AccordionTrigger>
                                <AccordionContent className="pt-4">
                                    <div className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="headline">Headline</Label>
                                                <Input id="headline" {...form.register('options.headline')} placeholder="e.g., The Ultimate Summer Companion" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="subhead">Subheading</Label>
                                                <Input id="subhead" {...form.register('options.subhead')} placeholder="e.g., Available in 5 vibrant colors" />
                                            </div>
                                        </div>
                                         <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="mediaType">Media Type</Label>
                                                 <Controller
                                                    control={form.control}
                                                    name="options.mediaType"
                                                    render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger id="mediaType"><SelectValue placeholder="Select media type..." /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="image">Image</SelectItem>
                                                                <SelectItem value="video">Video</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Media Source</Label>
                                                    <RadioGroup value={mediaInputMethod} onValueChange={(v) => setMediaInputMethod(v as 'url' | 'upload')} className="flex gap-4">
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="url" id="media-url-option" />
                                                            <Label htmlFor="media-url-option" className="font-normal">URL</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="upload" id="media-upload-option" />
                                                            <Label htmlFor="media-upload-option" className="font-normal">Upload</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                                {mediaInputMethod === 'url' ? (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="mediaUrl">Media URL</Label>
                                                        <Input
                                                            id="mediaUrl"
                                                            {...form.register('options.mediaUrl')}
                                                            placeholder="https://example.com/image.png"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="media-upload-input">File Upload</Label>
                                                        <Input 
                                                            id="media-upload-input"
                                                            type="file" 
                                                            accept="image/*,video/*"
                                                            onChange={handleMediaUpload}
                                                        />
                                                    </div>
                                                )}
                                                {form.formState.errors.options?.mediaUrl && <p className="text-sm text-destructive mt-1">{form.formState.errors.options.mediaUrl.message}</p>}
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-6 pt-4 border-t">
                                            <div className="space-y-2">
                                                <Label htmlFor="barcode">Barcode/SKU</Label>
                                                <Input id="barcode" {...form.register('options.barcode')} placeholder="e.g., 9780321765723" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="price">Price</Label>
                                                <Input id="price" type="number" step="0.01" {...form.register('options.price', { valueAsNumber: true })} placeholder="e.g., 199.99" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="category">Category</Label>
                                                <Input id="category" {...form.register('options.category')} placeholder="e.g., Footwear" />
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                             </AccordionItem>
                        </Accordion>
                        <div className="flex flex-wrap gap-2 mt-6">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                                Queue Generation Job
                            </Button>
                            <Button type="button" variant="outline" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Test Print
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
}

    