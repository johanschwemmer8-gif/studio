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
import {
  RefreshCw,
  Loader2,
  Sparkles,
  ShieldCheck,
  Barcode,
  ExternalLink,
  Info,
  ChevronRight,
  ShoppingBasket
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/context/auth-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const styleSchema = z.object({
  gtin: z.string().length(14, "Product Identifier must be exactly 14 digits.").optional().or(z.literal('')),
  batchNumber: z.string().optional().or(z.literal('')),
  serialNumber: z.string().optional().or(z.literal('')),
  colorHex: z.string().optional().default('#000000'),
  bgColorHex: z.string().optional().default('#FFFFFF'),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).optional().default('M'),
  aiPersona: z.string().optional(),
  aiTone: z.string().optional(),
  aiGoal: z.string().optional(),
  scanDestination: z.enum(['url', 'ai']).default('ai'),
});

const formSchema = z.object({
  retailerId: z.string().min(1, 'Retailer ID is required'),
  brandId: z.string().min(1, 'Brand ID is required'),
  campaignId: z.string().min(1, 'Campaign name is required'),
  count: z.number().int().min(1).max(5000),
  options: styleSchema.optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BulkQRCodeGenerator() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            retailerId: user?.retailerId || '',
            brandId: 'default',
            campaignId: '',
            count: 10,
            options: {
              gtin: '',
              batchNumber: '',
              serialNumber: '',
              colorHex: '#000000',
              bgColorHex: '#FFFFFF',
              errorCorrection: 'M',
              scanDestination: 'ai',
            }
        },
    });

    useEffect(() => {
        if (!user?.retailerId || !db) return;
        
        async function fetchRetailerProducts() {
            setLoadingProducts(true);
            try {
                const q = query(collection(db, 'products'), where('retailerId', '==', user?.retailerId));
                const snap = await getDocs(q);
                const fetched = snap.docs.map(doc => doc.data());
                setProducts(fetched);
            } catch (e) {
                console.error("Failed to fetch products:", e);
            } finally {
                setLoadingProducts(false);
            }
        }

        fetchRetailerProducts();
        form.setValue('retailerId', user.retailerId);
    }, [user?.retailerId, form]);

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const idToken = await user?.getIdToken();
            if (!idToken) throw new Error("Please log in again to continue.");

            const result = await submitBulkQrRequest({
                ...data,
                idToken
            });

            if (result.success) {
                toast({ 
                    title: 'QR Activation Created!', 
                    description: `Batch ${data.campaignId} has been successfully added to your network.` 
                });
                form.reset({
                    ...form.getValues(),
                    campaignId: ''
                });
            } else {
                throw new Error('Could not create batch.');
            }
        } catch (error: any) {
            toast({ 
                title: "Setup Error", 
                description: error.message, 
                variant: 'destructive' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProductSelect = (gtin: string) => {
        form.setValue('options.gtin', gtin, { shouldValidate: true });
    };

    const currentGtin = form.watch('options.gtin');

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 text-primary uppercase">
                    <Barcode className="h-8 w-8" />
                    QR Activation
                </h2>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified Standards
                    </Badge>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="border-primary/10 shadow-lg">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-lg">Activate a Product</CardTitle>
                        <CardDescription>Link a product from your catalog to a new digital activation batch.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                        <div className="space-y-2 lg:col-span-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Product</Label>
                            {loadingProducts ? (
                                <div className="h-11 w-full bg-muted animate-pulse rounded-md"></div>
                            ) : (
                                <Select onValueChange={handleProductSelect} value={currentGtin}>
                                    <SelectTrigger className="h-11 bg-white">
                                        <SelectValue placeholder="Choose product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(p => (
                                            <SelectItem key={p.gtin} value={p.gtin}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="gtin" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                Product Barcode
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>The unique identifier used for Digital Link resolution.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <Input id="gtin" {...form.register('options.gtin')} readOnly placeholder="Select product above" className="font-mono bg-muted/30 h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="campaignId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Promotion Name</Label>
                            <Input id="campaignId" {...form.register('campaignId')} placeholder="e.g. In-Store Launch" className="bg-white h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="count" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sticker Count</Label>
                            <Input id="count" type="number" {...form.register('count', { valueAsNumber: true })} className="bg-white h-11" />
                        </div>
                    </CardContent>

                    <Accordion type="single" collapsible className="px-6 pb-6">
                        <AccordionItem value="gs1-advanced" className="border-none">
                            <AccordionTrigger className="text-xs font-black uppercase tracking-widest text-primary/60 hover:no-underline py-4">
                                <Sparkles className="h-3.5 w-3.5 mr-2 text-accent" />
                                Custom Assistant & Destination
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 grid md:grid-cols-2 gap-8 border-t">
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase">Assistant Persona</Label>
                                        <Input {...form.register('options.aiPersona')} placeholder="e.g., Expert Sommelier" className="bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase">Shopper Destination</Label>
                                        <Controller
                                            control={form.control}
                                            name="options.scanDestination"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ai">Ari Guidance (Interactive)</SelectItem>
                                                        <SelectItem value="url">Direct to Website</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-2xl text-center space-y-4 border-2 border-primary/20 shadow-inner mt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Standard Resolution URI</p>
                                    <div className="bg-white/5 p-3 rounded-lg flex items-center justify-between gap-3 group border border-white/10">
                                        <code className="text-xs break-all text-white font-mono opacity-80 text-left">
                                            {typeof window !== 'undefined' ? window.location.origin : ''}/01/{currentGtin || '...'}
                                        </code>
                                        <ExternalLink className="h-4 w-4 text-blue-400 shrink-0" />
                                    </div>
                                    <p className="text-[8px] text-slate-400 uppercase font-black">Interoperable Identity Link</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <CardFooter className="bg-muted/20 p-6 flex justify-end gap-3 border-t border-black/5">
                        <Button type="submit" disabled={isSubmitting || !currentGtin} className="h-12 px-12 font-black gap-2 bg-primary text-white shadow-xl hover:shadow-2xl transition-all uppercase tracking-tighter">
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                            Execute Activation
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
