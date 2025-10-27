
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Info,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Link as LinkIcon,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
import { getQrTemplates, type QrTemplate } from '@/ai/flows/get-qr-templates';

const styleSchema = z.object({
  logoPath: z.string().url().optional(),
  // Expanded AI Options
  aiTone: z.string().optional().describe("e.g., Playful and exciting, Professional and informative"),
  aiGoal: z.string().optional().describe("e.g., Drive sales for the new shoe line"),
  aiPersona: z.string().optional().describe("e.g., Expert Denim Stylist, Friendly In-Store Helper"),
  aiGreeting: z.string().optional().describe("e.g., Hi there! Ready to discover your perfect fit?"),
  aiKeyPoints: z.string().optional().describe("e.g., - Made from 100% organic cotton\n- Water-saving dye process\n- 5-year durability guarantee"),
  aiOffer: z.string().optional().describe("e.g., 15% off today only, Free sample with purchase"),
  aiRecommendations: z.string().optional().describe("e.g., Recommend matching accessories, Suggest the premium version of this product"),
});

const formSchema = z.object({
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

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
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
            }
        },
    });

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
    }, [toast]);
    
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


    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const result = await submitBulkQrRequest({
                ...data,
                retailerId: 'simulated-retailer-id' // This would come from auth context in a real app
            });

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

    return (
        <TooltipProvider>
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
                            <div className="grid sm:grid-cols-3 gap-4 flex-1 w-full">
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
                                <div>
                                    <Label htmlFor="baseRedirect">Base Redirect URL</Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="baseRedirect" {...form.register('baseRedirect')} placeholder="https://your-store.com/product" className="pl-9"/>
                                    </div>
                                    {form.formState.errors.baseRedirect && <p className="text-sm text-destructive mt-1">{form.formState.errors.baseRedirect.message}</p>}
                                </div>
                            </div>

                            <div className="flex-shrink-0 flex items-end gap-2 w-full sm:w-auto">
                                <Accordion type="single" collapsible className="w-full sm:w-auto">
                                    <AccordionItem value="styling" className="border-b-0">
                                        <AccordionTrigger className="h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md sm:w-auto">Choose QR Template</AccordionTrigger>
                                        <AccordionContent className="absolute z-10 mt-2 right-0 sm:right-auto p-0 w-full sm:w-[320px]">
                                            <Card className="p-4">
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <Label>Load from Template</Label>
                                                        <Select onValueChange={handleTemplateChange}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a template to apply styles..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {templates.map(template => (
                                                                    <SelectItem key={template.templateId} value={template.templateId}>{template.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-muted-foreground">Selecting a template will pre-fill the options below.</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="logoPath">Logo URL (Optional)</Label>
                                                        <Input id="logoPath" {...form.register('options.logoPath')} placeholder="https://your-cdn.com/logo.png" />
                                                        {form.formState.errors.options?.logoPath && <p className="text-sm text-destructive mt-1">{form.formState.errors.options.logoPath.message}</p>}
                                                    </div>
                                                </div>
                                            </Card>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                
                                <Accordion type="single" collapsible className="w-full sm:w-auto">
                                    <AccordionItem value="ai-generation" className="border-b-0">
                                        <AccordionTrigger className="h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md sm:w-auto">
                                            <Sparkles className="mr-2 h-4 w-4 text-accent" />
                                            AI Generation
                                        </AccordionTrigger>
                                        <AccordionContent className="absolute z-10 mt-2 right-0 sm:right-auto p-0 w-full sm:w-[500px]">
                                             <Card className="p-4">
                                                <div className="p-4 border rounded-md space-y-4 bg-muted/30">
                                                    <h4 className="font-semibold flex items-center gap-2"><Sparkles className="text-accent" /> AI Content Generation</h4>
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
                                                          <div>
                                                              <Label htmlFor="aiGreeting">Personal Greeting</Label>
                                                              <Textarea id="aiGreeting" {...form.register('options.aiGreeting')} placeholder="e.g., Hi there! Ready to discover your perfect fit?"/>
                                                          </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <Label htmlFor="aiGoal">Campaign Goal</Label>
                                                                <Textarea id="aiGoal" {...form.register('options.aiGoal')} placeholder="e.g., Drive sales for the new shoe line" />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="aiKeyPoints">Key Selling Points (one per line)</Label>
                                                                <Textarea id="aiKeyPoints" {...form.register('options.aiKeyPoints')} placeholder="- Made from 100% organic cotton&#x0a;- Water-saving dye process&#x0a;- 5-year durability guarantee" rows={3} />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="aiOffer">Offer / Incentive (optional)</Label>
                                                                <Input id="aiOffer" {...form.register('options.aiOffer')} placeholder="e.g., 15% off today only" />
                                                            </div>
                                                             <div>
                                                              <Label htmlFor="aiRecommendations">Recommendations</Label>
                                                              <Textarea id="aiRecommendations" {...form.register('options.aiRecommendations')} placeholder="e.g., Recommend matching accessories..." />
                                                          </div>
                                                        </div>
                                                    </div>
                                                     <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
                                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                                                        Queue Generation Job
                                                    </Button>
                                                </div>
                                             </Card>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </div>
                    </Card>
                </form>
            </div>
        </TooltipProvider>
    );
}
