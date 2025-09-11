
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import QrCampaignDashboard from '@/components/dashboard/qr-campaign-dashboard';
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Save, Paintbrush, Sparkles, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getQrTemplates } from '@/ai/flows/get-qr-templates';
import type { QrTemplate } from '@/ai/flows/save-qr-template';
import { saveQrTemplate } from '@/ai/flows/save-qr-template';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const qrOptionsSchema = z.object({
    colorHex: z.string().optional(),
    bgColorHex: z.string().optional(),
    logoPath: z.string().url().optional(),
    errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
    aiTone: z.string().optional(),
    aiGoal: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    redirectType: z.enum(['permanent', 'temporary']).default('temporary'),
});

const formSchema = z.object({
    campaignId: z.string().min(1, "Campaign ID is required."),
    count: z.coerce.number().int().min(1, "Count must be at least 1.").max(500, "Count must be 500 or less."),
    baseRedirect: z.string().url("Must be a valid URL.").refine(s => s.startsWith('https://'), "Base redirect URL must be HTTPS."),
    options: qrOptionsSchema.optional(),
});

type FormValues = z.infer<typeof formSchema>;

const newTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required.'),
    description: z.string().optional(),
});

export default function QrManagementPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [templates, setTemplates] = useState<QrTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            campaignId: `campaign-${Math.random().toString(36).substring(2, 8)}`,
            count: 10,
            baseRedirect: 'https://example.com/product',
            options: {
                colorHex: '#000000',
                bgColorHex: '#FFFFFF',
                errorCorrection: 'M',
                aiTone: 'Friendly and helpful',
                aiGoal: 'Encourage user to explore product features',
                redirectType: 'temporary'
            }
        },
    });

     useEffect(() => {
        const fetchTemplates = async () => {
            const fetchedTemplates = await getQrTemplates({ retailerId: 'simulated-retailer-id' });
            setTemplates(fetchedTemplates);
        };
        fetchTemplates();
    }, []);

    const handleApplyTemplate = (template: QrTemplate) => {
        form.reset({
            ...form.getValues(), // keep campaignId, count, baseRedirect
            options: template.defaults as FormValues['options'],
        });
        setSelectedTemplateId(template.templateId);
         toast({
            title: "Template Applied",
            description: `Settings from "${template.name}" have been applied to the form.`,
        });
    };
    
    const templateForm = useForm<z.infer<typeof newTemplateSchema>>({
        resolver: zodResolver(newTemplateSchema),
        defaultValues: { name: '', description: '' },
    });

    const handleSaveTemplate = async (templateData: z.infer<typeof newTemplateSchema>) => {
        try {
            const currentOptions = form.getValues().options;
            const result = await saveQrTemplate({
                ...templateData,
                retailerId: 'simulated-retailer-id',
                defaults: currentOptions || {},
            });
            const newTemplate: QrTemplate = { 
                templateId: result.templateId,
                retailerId: 'simulated-retailer-id',
                ...templateData, 
                defaults: currentOptions || {} 
            };
            setTemplates(prev => [...prev, newTemplate]);
            toast({
                title: "Template Saved!",
                description: `"${templateData.name}" has been saved.`
            });
            setIsTemplateDialogOpen(false);
            templateForm.reset();
        } catch (error: any) {
            toast({
                title: "Failed to Save Template",
                description: error.message,
                variant: 'destructive',
            });
        }
    };


    const handleSubmitRequest = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            const result = await submitBulkQrRequest({
                ...values,
                retailerId: 'simulated-retailer-id',
            });
            toast({
                title: "Request Submitted",
                description: `Bulk QR request for ${values.count} codes has been queued with ID: ${result.requestId}`,
            });
            setIsRequestDialogOpen(false);
            form.reset({
                ...form.getValues(),
                campaignId: `campaign-${Math.random().toString(36).substring(2, 8)}`
            });
        } catch (error: any) {
            console.error("Failed to submit request:", error);
            toast({
                title: "Submission Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">QR Code Management</h2>
                    <p className="text-muted-foreground max-w-3xl">Create, monitor, and download bulk QR code campaigns.</p>
                </div>
                 <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                    <DialogTrigger asChild>
                         <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Bulk Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>New Bulk QR Code Request</DialogTitle>
                            <DialogDescription>
                                Configure and submit a job to generate multiple QR codes. Select a template or configure manually.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">1. Choose a Template</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                                    {templates.map(template => (
                                        <Card 
                                            key={template.templateId} 
                                            className={cn(
                                                "cursor-pointer hover:border-primary transition-colors flex flex-col",
                                                selectedTemplateId === template.templateId && "border-primary ring-2 ring-primary"
                                            )}
                                            onClick={() => handleApplyTemplate(template)}
                                        >
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex justify-between items-start">
                                                    <span>{template.name}</span>
                                                    {template.retailerId === 'GLOBAL' && <Badge variant="secondary">Global</Badge>}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-xs text-muted-foreground space-y-3 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Paintbrush className="h-4 w-4" />
                                                    <div className="flex items-center gap-1">
                                                        <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: template.defaults.bgColorHex }}></div>
                                                        <div className="h-4 w-4 rounded-sm border" style={{ backgroundColor: template.defaults.colorHex }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <Sparkles className="h-4 w-4 mt-0.5"/>
                                                    <div>
                                                        <p><strong>Tone:</strong> {template.defaults.aiTone}</p>
                                                        <p><strong>Goal:</strong> {template.defaults.aiGoal}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="p-2">
                                                 <Button size="sm" variant="ghost" className="w-full justify-start text-primary">
                                                    {selectedTemplateId === template.templateId && <Check className="mr-2"/>}
                                                    {selectedTemplateId === template.templateId ? "Applied" : "Apply"}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                 <h3 className="text-lg font-semibold">2. Configure Request</h3>
                                 <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleSubmitRequest)} className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                                        <FormField
                                            control={form.control}
                                            name="campaignId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Campaign ID</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="count"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Number of Codes</FormLabel>
                                                    <FormControl><Input type="number" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="baseRedirect"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Base Redirect URL</FormLabel>
                                                    <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="options.colorHex"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>QR Color</FormLabel>
                                                        <FormControl><Input type="color" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="options.bgColorHex"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Background</FormLabel>
                                                        <FormControl><Input type="color" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="options.errorCorrection"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Error Correction</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select level" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="L">Low (L)</SelectItem>
                                                            <SelectItem value="M">Medium (M)</SelectItem>
                                                            <SelectItem value="Q">Quartile (Q)</SelectItem>
                                                            <SelectItem value="H">High (H)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur-sm pt-4 -mx-1 px-1">
                                             <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button type="button" variant="outline"><Save className="mr-2 h-4 w-4"/>Save as Template</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Save Current Settings as Template</DialogTitle>
                                                    </DialogHeader>
                                                    <Form {...templateForm}>
                                                        <form onSubmit={templateForm.handleSubmit(handleSaveTemplate)} className="space-y-4">
                                                            <FormField
                                                                control={templateForm.control}
                                                                name="name"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Template Name</FormLabel>
                                                                        <FormControl><Input {...field} placeholder="e.g., Summer Sale Style" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={templateForm.control}
                                                                name="description"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Description (Optional)</FormLabel>
                                                                        <FormControl><Input {...field} /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <DialogFooter>
                                                                <Button type="submit">Save Template</Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </Form>
                                                </DialogContent>
                                            </Dialog>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? "Submitting..." : "Submit Request"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Separator />
            
            <QrCampaignDashboard />

        </div>
    );
}
