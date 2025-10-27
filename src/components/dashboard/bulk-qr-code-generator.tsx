
'use client';

import * as React from 'react';
import { useState, useEffect, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Info,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Link as LinkIcon,
  Sparkles,
  PlusCircle,
  Store,
  Send,
  X,
  Printer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
import { getQrTemplates, type QrTemplate } from '@/ai/flows/get-qr-templates';
import { type FormValues as BrandFormValues } from './brand-management-form';
import Image from 'next/image';

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

type User = {
    id: string;
    fullName: string;
    email: string;
    brand: string;
    division?: string;
    region?: string;
    area?: string;
    store?: string;
};

type Selection = {
    brands: string[];
    divisions: string[];
    regions: string[];
    areas: string[];
    stores: string[];
};

const PrintableQrCode = React.forwardRef<HTMLDivElement, { url: string }>(({ url }, ref) => {
    return (
        <div ref={ref} className="p-4">
            <h1 className="text-lg font-bold mb-4 text-center">QR Code Test Print</h1>
            <Image src={url} alt="Test QR Code" width={300} height={300} />
            <p className="text-xs text-center mt-2">Scan to test. This is for quality assurance only.</p>
        </div>
    );
});
PrintableQrCode.displayName = 'PrintableQrCode';


export default function BulkQRCodeGenerator() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [templates, setTemplates] = useState<QrTemplate[]>([]);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    const [brandData, setBrandData] = useState<BrandFormValues | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selection, setSelection] = useState<Selection>({ brands: [], divisions: [], regions: [], areas: [], stores: [] });

    const testQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      'https://'
    )}`;

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
    
    useEffect(() => {
        // Load organizational structure and users from localStorage
        const savedBrandData = localStorage.getItem('brandManagement');
        if (savedBrandData) setBrandData(JSON.parse(savedBrandData));

        const savedUsers = localStorage.getItem('userManagement');
        if (savedUsers) setUsers(JSON.parse(savedUsers));

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

    const handleSelectionChange = (type: keyof Selection, value: string, checked: boolean) => {
        setSelection(prev => {
            const newSelection = { ...prev };
            if (checked) {
                newSelection[type] = [...newSelection[type], value];
            } else {
                newSelection[type] = newSelection[type].filter(item => item !== value);
            }
            return newSelection;
        });
    };

    const getSelectedEmails = () => {
        const emails = new Set<string>();
        users.forEach(user => {
            if (selection.brands.includes(user.brand) && !user.division && !user.region && !user.area && !user.store) emails.add(user.email);
            if (user.division && selection.divisions.includes(user.division)) emails.add(user.email);
            if (user.region && selection.regions.includes(user.region)) emails.add(user.email);
            if (user.area && selection.areas.includes(user.area)) emails.add(user.email);
            if (user.store && selection.stores.includes(user.store)) emails.add(user.email);
        });
        return Array.from(emails);
    };
    
    const selectedEmails = getSelectedEmails();

    return (
        <TooltipProvider>
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
                                    <Button type="button" variant="outline" onClick={handlePrint}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        Test Print
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </form>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Send to Stores</CardTitle>
                        <CardDescription>Distribute the generated QR codes for a campaign to specific stores or regions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="campaign-select">Select Campaign</Label>
                                <Select>
                                    <SelectTrigger id="campaign-select">
                                        <SelectValue placeholder="Choose a campaign to send..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="summer-sale-2024">summer-sale-2024</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
                                <DialogTrigger asChild>
                                    <div>
                                        <Label htmlFor="store-select-trigger">Select Stores/Regions</Label>
                                        <Button id="store-select-trigger" variant="outline" className="w-full justify-start text-left font-normal">
                                            <Store className="mr-2 h-4 w-4" />
                                            Choose destinations...
                                        </Button>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                        <DialogTitle>Select Destinations</DialogTitle>
                                        <DialogDescription>Choose brands, divisions, regions, or stores to send this campaign to.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold">Organizational Structure</h4>
                                            {brandData?.brands.map(brand => (
                                                <Accordion key={brand.name} type="multiple" className="w-full">
                                                    <AccordionItem value={brand.name}>
                                                        <div className="flex items-center">
                                                          <div className="flex items-center gap-2 py-4 font-medium flex-1">
                                                              <Checkbox id={`brand-${brand.name}`} onCheckedChange={(checked) => handleSelectionChange('brands', brand.name, !!checked)} />
                                                              <Label htmlFor={`brand-${brand.name}`} className="font-semibold cursor-pointer">{brand.name}</Label>
                                                          </div>
                                                          <AccordionTrigger className="w-10 hover:no-underline justify-center" />
                                                        </div>
                                                        <AccordionContent className="pl-6">
                                                            {brand.divisions.map(division => (
                                                                <Accordion key={division.name} type="multiple" className="w-full">
                                                                     <AccordionItem value={division.name}>
                                                                        <div className="flex items-center">
                                                                            <div className="flex items-center gap-2 py-4 font-medium flex-1">
                                                                                <Checkbox id={`div-${division.name}`} onCheckedChange={(checked) => handleSelectionChange('divisions', division.name, !!checked)} />
                                                                                <Label htmlFor={`div-${division.name}`} className="cursor-pointer">{division.name}</Label>
                                                                            </div>
                                                                            <AccordionTrigger className="w-10 hover:no-underline justify-center" />
                                                                        </div>
                                                                         <AccordionContent className="pl-6">
                                                                            {division.regions.map(region => (
                                                                                <Accordion key={region.name} type="multiple" className="w-full">
                                                                                    <AccordionItem value={region.name}>
                                                                                        <div className="flex items-center">
                                                                                            <div className="flex items-center gap-2 py-4 font-medium flex-1">
                                                                                                 <Checkbox id={`reg-${region.name}`} onCheckedChange={(checked) => handleSelectionChange('regions', region.name, !!checked)} />
                                                                                                <Label htmlFor={`reg-${region.name}`} className="cursor-pointer">{region.name}</Label>
                                                                                            </div>
                                                                                            <AccordionTrigger className="w-10 hover:no-underline justify-center" />
                                                                                        </div>
                                                                                        <AccordionContent className="pl-6">
                                                                                            {region.areas.map(area => (
                                                                                                <div key={area.name} className="mt-2">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <Checkbox id={`area-${area.name}`} onCheckedChange={(checked) => handleSelectionChange('areas', area.name, !!checked)} />
                                                                                                        <Label htmlFor={`area-${area.name}`} className="font-semibold cursor-pointer">{area.name}</Label>
                                                                                                    </div>
                                                                                                    <div className="pl-6 mt-1 space-y-1">
                                                                                                        {area.stores.map(store => (
                                                                                                             <div key={store.code} className="flex items-center gap-2">
                                                                                                                <Checkbox id={`store-${store.name}`} onCheckedChange={(checked) => handleSelectionChange('stores', store.name, !!checked)} />
                                                                                                                <Label htmlFor={`store-${store.name}`} className="font-normal cursor-pointer">{store.name}</Label>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </AccordionContent>
                                                                                    </AccordionItem>
                                                                                </Accordion>
                                                                            ))}
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                </Accordion>
                                                            ))}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="font-semibold">Selected Emails ({selectedEmails.length})</h4>
                                            <div className="border rounded-md p-2 h-72 overflow-y-auto bg-muted/50 text-sm text-muted-foreground">
                                                {selectedEmails.length > 0 ? selectedEmails.join(', ') : 'No emails selected.'}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={() => setIsStoreModalOpen(false)}>Done</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                    <CardContent>
                         <Button>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Selected Stores
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </TooltipProvider>
    );

    
}
    
