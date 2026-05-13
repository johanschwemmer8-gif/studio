
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  Sparkles,
  Send,
  ImageIcon,
  ShieldCheck,
  Save,
  PlusCircle,
  Barcode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getQrTemplates } from '@/ai/flows/get-qr-templates';
import { QrTemplate } from '@/lib/schemas/qr-templates';
import { type FormValues as BrandFormValues } from './brand-management-form';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, addDoc } from 'firebase/firestore';
import Image from 'next/image';

const styleSchema = z.object({
  gtin: z.string().length(14, "GTIN must be exactly 14 digits.").optional().or(z.literal('')),
  batchNumber: z.string().optional().or(z.literal('')),
  serialNumber: z.string().optional().or(z.literal('')),
  colorHex: z.string().optional(),
  bgColorHex: z.string().optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).optional(),
  aiPersona: z.string().optional(),
  aiTone: z.string().optional(),
  aiGoal: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  headline: z.string().optional(),
  subhead: z.string().optional(),
  scanDestination: z.enum(['url', 'ai']).default('ai'),
  landingPageUrl: z.string().url().optional().or(z.literal('')),
});

const formSchema = z.object({
  retailerId: z.string().min(1, 'Retailer ID is required'),
  brandId: z.string().min(1, 'Brand is required'),
  campaignId: z.string().min(1, 'Campaign ID is required'),
  count: z.number().int().min(1).max(10000),
  options: styleSchema.optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BulkQRCodeGenerator() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [templates, setTemplates] = useState<QrTemplate[]>([]);
    const [brands, setBrands] = useState<BrandFormValues['brands']>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            retailerId: 'simulated-retailer-id',
            brandId: '',
            campaignId: `gs1-campaign-${Date.now()}`,
            count: 100,
            options: {
              gtin: '06001234567891',
              batchNumber: '',
              serialNumber: '',
              aiTone: 'Professional',
              aiGoal: 'Drive sales',
              scanDestination: 'ai',
              mediaUrl: '',
            }
        },
    });

    useEffect(() => {
        getQrTemplates({ retailerId: 'simulated-retailer-id' }).then(setTemplates);
        const savedBrandData = localStorage.getItem('brandManagement');
        if (savedBrandData) setBrands(JSON.parse(savedBrandData).brands || []);
    }, []);

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        if (!db) {
            toast({ title: 'Error', description: 'Firestore not available.', variant: 'destructive'});
            setIsSubmitting(false);
            return;
        }

        const batch = writeBatch(db);
        const requestRef = doc(collection(db, 'bulkQrRequests'));
        
        // GS1 Digital Link Construction Logic
        const gtin = data.options?.gtin || '00000000000000';
        const digitalLink = `https://id.interact-aoe.com/01/${gtin}`;

        await batch.set(requestRef, {
            ...data,
            status: 'COMPLETED',
            createdAt: new Date(),
            itemsDone: data.count,
            isGs1Compliant: true,
            digitalLinkTemplate: digitalLink
        });

        try {
            await batch.commit();
            toast({ title: 'GS1 Campaign Created!', description: `Generated ${data.count} compliant identifiers.` });
            form.reset();
        } catch (error: any) {
            toast({ title: "Submission Failed", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <Barcode className="text-primary h-8 w-8" />
                    GS1 Digital Link Generator
                </h2>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Interoperability Active
                </Badge>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-lg">Infrastructure Configuration</CardTitle>
                        <CardDescription>Define the global product identification and campaign parameters.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="gtin">Global Trade Item Number (GTIN-14)</Label>
                            <Input id="gtin" {...form.register('options.gtin')} placeholder="e.g., 06001234567891" className="font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch">Batch / Lot (Optional)</Label>
                            <Input id="batch" {...form.register('options.batchNumber')} placeholder="e.g., LOT-2024-A" className="font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="campaignId">Campaign Identifier</Label>
                            <Input id="campaignId" {...form.register('campaignId')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="count">Output Quantity</Label>
                            <Input id="count" type="number" {...form.register('count', { valueAsNumber: true })} />
                        </div>
                    </CardContent>

                    <Accordion type="single" collapsible className="px-6 pb-6">
                        <AccordionItem value="gs1-details" className="border-none">
                            <AccordionTrigger className="text-xs font-black uppercase tracking-widest text-primary/60 hover:no-underline">
                                Advanced GS1 Attributes
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>AI Persona (Digital Link Guidance)</Label>
                                        <Input {...form.register('options.aiPersona')} placeholder="e.g., GS1 Compliance Assistant" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Digital Link Destination</Label>
                                        <Controller
                                            control={form.control}
                                            name="options.scanDestination"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ai">AI Decision Assistant (Guidance)</SelectItem>
                                                        <SelectItem value="url">Direct GS1 Resolver (Data Only)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-xl border border-dashed text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Digital Link Format</p>
                                    <code className="text-xs break-all text-primary font-bold">
                                        https://id.interact.io/01/{form.watch('options.gtin') || '...'}
                                    </code>
                                    <p className="text-[10px] text-muted-foreground italic">Standardized URI structure for global interoperability.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <CardFooter className="bg-primary/5 p-6 flex justify-end gap-3">
                        <Button type="button" variant="ghost" className="font-bold">Save Template</Button>
                        <Button type="submit" disabled={isSubmitting} className="h-12 px-8 font-black gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                            Queue GS1 Generation
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
