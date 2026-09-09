'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  ArrowRight,
  Barcode,
  CheckCircle2,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  PlusCircle,
  Trash2,
  Layers,
  ChevronRight,
  ChevronLeft,
  QrCode,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
import { createCampaign } from '@/ai/flows/create-campaign';
import { listCampaigns } from '@/ai/flows/list-campaigns';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  retailerId: z.string().min(1, 'Retailer ID is required'),
  campaignId: z.string().min(1, 'Campaign association is required'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  productType: z.string().optional(),
  brandName: z.string().optional(),
  targetProductGtin: z.string().optional(),
  productGtins: z.array(z.string()).default([]),
  storeId: z.string().optional(),
  storeName: z.string().min(1, 'Store is required'),
  location: z.string().min(1, 'Physical location is required'),
  shopperObjective: z.string().min(1, 'Select what you want the shopper to do'),
  assistantPersona: z.string().optional(),
  assistantTone: z.string().optional(),
  assistantGoal: z.string().optional(),
  scanDestination: z.enum(['ai', 'url']).default('ai'),
  landingPageUrl: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

type RetailerProduct = {
  id?: string;
  gtin?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
};

type RetailerCampaign = {
  campaignId: string;
  campaignName: string;
  campaignType: 'promotion' | 'engagement';
  campaignMode: 'single-target' | 'collection';
};

const OBJECTIVES = [
  { value: 'discover', label: 'Discover', description: 'Help shoppers discover relevant products or categories.' },
  { value: 'compare', label: 'Compare', description: 'Help shoppers compare products in this decision context.' },
  { value: 'choose', label: 'Choose', description: 'Help shoppers make a confident product choice.' },
  { value: 'learn', label: 'Learn', description: 'Provide useful information about the products or category.' },
  { value: 'recommendation', label: 'Get a recommendation', description: 'Use Ari to guide the shopper toward the right option.' },
  { value: 'promote', label: 'Promote a specific product', description: 'Direct attention toward the selected target product.' },
];

interface BulkQRCodeGeneratorProps {
  isBulkMode?: boolean;
}

export default function BulkQRCodeGenerator({ isBulkMode = false }: BulkQRCodeGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [batch, setBatch] = useState<FormValues[]>([]);
  const [isAddingToBatch, setIsAddingToBatch] = useState(true);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchResults, setBatchResults] = useState<{ id: string; status: string; error?: string }[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const [products, setProducts] = useState<RetailerProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // --- Campaign picker state ---
  const [campaigns, setCampaigns] = useState<RetailerCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignType, setNewCampaignType] = useState<'promotion' | 'engagement'>('promotion');
  const [newCampaignMode, setNewCampaignMode] = useState<'single-target' | 'collection'>('single-target');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      retailerId: user?.retailerId || '',
      campaignId: '',
      category: '',
      subCategory: '',
      productType: '',
      brandName: '',
      targetProductGtin: '',
      productGtins: [],
      storeId: '',
      storeName: '',
      location: '',
      shopperObjective: '',
      assistantPersona: '',
      assistantTone: '',
      assistantGoal: '',
      scanDestination: 'ai',
      landingPageUrl: '',
    },
  });

  const watched = form.watch();
  const selectedTargetGtin = watched.targetProductGtin;
  const selectedContextGtins = watched.productGtins;
  const selectedCategory = watched.category;

  useEffect(() => {
    const retailerId = user?.retailerId;
    if (!retailerId || !db) {
      setLoadingProducts(false);
      return;
    }

    async function fetchRetailerProducts() {
      setLoadingProducts(true);
      try {
        const productsQuery = query(collection(db, 'products'), where('retailerId', '==', retailerId));
        const snapshot = await getDocs(productsQuery);
        const fetchedProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<RetailerProduct, 'id'>),
        }));
        setProducts(fetchedProducts);
        form.setValue('retailerId', retailerId);
      } catch (error) {
        console.error('[QR Activation] Failed to fetch retailer products:', error);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchRetailerProducts();
  }, [user?.retailerId, form]);

  useEffect(() => {
    const retailerId = user?.retailerId;
    if (!retailerId) {
      setLoadingCampaigns(false);
      return;
    }

    async function fetchCampaigns() {
      setLoadingCampaigns(true);
      try {
        const idToken = await user?.getIdToken();
        if (!idToken) return;
        const result = await listCampaigns({ idToken, retailerId });
        setCampaigns(result.campaigns as RetailerCampaign[]);
      } catch (error) {
        console.error('[QR Campaign] Failed to fetch campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    fetchCampaigns();
  }, [user?.retailerId]);

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast({ title: 'Campaign name required', variant: 'destructive' });
      return;
    }

    const retailerId = user?.retailerId;
    if (!retailerId) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return;
    }

    setIsCreatingCampaign(true);
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        toast({ title: 'Authentication required', variant: 'destructive' });
        return;
      }

      const result = await createCampaign({
        idToken,
        retailerId,
        campaignName: newCampaignName,
        campaignType: newCampaignType,
        campaignMode: newCampaignMode,
      });

      const created: RetailerCampaign = {
        campaignId: result.campaignId,
        campaignName: newCampaignName,
        campaignType: newCampaignType,
        campaignMode: newCampaignMode,
      };

      setCampaigns((prev) => [created, ...prev]);
      form.setValue('campaignId', result.campaignId, { shouldDirty: true, shouldValidate: true });
      setShowNewCampaignForm(false);
      setNewCampaignName('');
      toast({ title: 'Campaign Created', description: `"${created.campaignName}" is ready to use.` });
    } catch (err: any) {
      toast({ title: 'Campaign Creation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const categories = useMemo(() => {
    const values = products.map((p) => p.category?.trim()).filter((v): v is string => Boolean(v));
    return Array.from(new Set(values)).sort();
  }, [products]);

  const targetProduct = useMemo(() => {
    if (!selectedTargetGtin) return undefined;
    return products.find((p) => p.gtin === selectedTargetGtin);
  }, [products, selectedTargetGtin]);

  const toggleContextProduct = (gtin: string) => {
    const current = form.getValues('productGtins');
    if (current.includes(gtin)) {
      form.setValue('productGtins', current.filter((v) => v !== gtin), { shouldDirty: true });
    } else {
      form.setValue('productGtins', [...current, gtin], { shouldDirty: true });
    }
  };

  const onAddToBatch = (data: FormValues) => {
    setBatch(prev => [...prev, data]);
    setIsAddingToBatch(false);
    setStep(1);
    form.reset({
      ...data,
      targetProductGtin: '',
      productGtins: [],
      location: '',
      campaignId: data.campaignId, // Preserve campaign for convenience
    });
    toast({ title: "Activation Added", description: "Intent captured in batch builder." });
  };

  const onRemoveFromBatch = (index: number) => {
    setBatch(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmittingBatch(true);
    const idToken = await user?.getIdToken();
    if (!idToken) {
      toast({ title: "Authentication required", variant: "destructive" });
      setIsSubmittingBatch(false);
      return;
    }

    try {
      const result = await submitBulkQrRequest({
        idToken,
        retailerId: data.retailerId,
        brandId: 'default',
        campaignId: data.campaignId,
        target: {
          category: data.category || undefined,
          subCategory: data.subCategory || undefined,
          productType: data.productType || undefined,
          brandName: data.brandName || undefined,
          targetProductName: products.find(p => p.gtin === data.targetProductGtin)?.name || undefined,
          targetProductGtin: data.targetProductGtin || undefined,
        },
        productGtins: data.productGtins,
        storeName: data.storeName,
        location: data.location,
        shopperObjective: data.shopperObjective,
        count: 1,
        options: {
          isGs1DigitalLink: true,
          isBulk: isBulkMode,
        },
        productName: products.find(p => p.gtin === data.targetProductGtin)?.name,
      });

      setBatchResults([{ id: result.requestId, status: 'QUEUED' }]);
      setIsSuccess(true);
      toast({ title: "Shelf Activated", description: "Point-of-Decision identity established." });
    } catch (err: any) {
      toast({ title: "Activation Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmittingBatch(true);
    setBatchResults([]);
    const idToken = await user?.getIdToken();
    if (!idToken) {
      toast({ title: "Authentication required", variant: "destructive" });
      setIsSubmittingBatch(false);
      return;
    }

    const results = [];
    let successCount = 0;

    for (let i = 0; i < batch.length; i++) {
      const data = batch[i];
      try {
        const result = await submitBulkQrRequest({
          idToken,
          retailerId: data.retailerId,
          brandId: 'default',
          campaignId: data.campaignId,
          target: {
            category: data.category || undefined,
            subCategory: data.subCategory || undefined,
            productType: data.productType || undefined,
            brandName: data.brandName || undefined,
            targetProductName: products.find(p => p.gtin === data.targetProductGtin)?.name || undefined,
            targetProductGtin: data.targetProductGtin || undefined,
          },
          productGtins: data.productGtins,
          storeName: data.storeName,
          location: data.location,
          shopperObjective: data.shopperObjective,
          count: 1,
          options: {
            isGs1DigitalLink: true,
            isBulk: isBulkMode,
          },
          productName: products.find(p => p.gtin === data.targetProductGtin)?.name,
        });

        results.push({ id: result.requestId, status: 'QUEUED' });
        successCount++;
      } catch (err: any) {
        results.push({ id: `Error ${i+1}`, status: 'ERROR', error: err.message });
      }
      setBatchResults([...results]);
    }

    setIsSubmittingBatch(false);
    if (successCount === batch.length) {
      setIsSuccess(true);
      toast({ title: "Batch Activated", description: `Authoritative identities created for ${successCount} Points of Decision.` });
    } else {
      toast({ title: "Batch Partial Success", description: `${successCount} activations created. Some errors detected.`, variant: "destructive" });
    }
  };

  const resetGenerator = () => {
    setBatch([]);
    setBatchResults([]);
    setIsAddingToBatch(true);
    setIsSuccess(false);
    setStep(1);
    form.reset();
  };

  if (isSuccess) {
    return (
      <Card className="overflow-hidden border-green-200 bg-green-50 shadow-xl">
        <CardHeader className="pb-4 pt-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-lg">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-green-800">
            {isBulkMode ? 'Batch Activated' : 'Shelf Activated'}
          </CardTitle>
          <CardDescription className="font-medium text-green-700">
            Point-of-Decision identities have been successfully established.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10">
          <div className="mx-auto max-w-xl space-y-4 mb-8">
            <div className="rounded-xl border border-green-200 bg-white/70 p-4">
              <p className="text-[10px] font-black uppercase text-green-700/60 mb-2">Activation Pipeline Status</p>
              <div className="space-y-2">
                {batchResults.map(res => (
                   <div key={res.id} className="flex justify-between items-center text-xs font-mono">
                      <span className="truncate max-w-[200px]">{res.id}</span>
                      <Badge className="bg-green-500 text-white text-[8px] px-1.5">{res.status}</Badge>
                   </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={resetGenerator} variant="outline" className="h-12 border-green-200 font-black uppercase text-[10px] tracking-widest text-green-700">
               Establish More Identities
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isBulkMode && !isAddingToBatch) {
    return (
      <div className="space-y-6">
        <Card className="border-primary/10 shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-lg">Batch Builder Summary</CardTitle>
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">
                {batch.length} Point-of-Decision Activations defined
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAddingToBatch(true)} className="font-black text-[10px] uppercase tracking-widest">
               <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Add Activation
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="text-[10px] font-black uppercase">
                    <TableHead className="px-6">Point of Decision</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Shopper Objective</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="px-6">
                        <div className="flex flex-col">
                           <span className="font-bold text-sm">{item.location}</span>
                           <span className="text-[10px] text-muted-foreground uppercase">{item.storeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-[9px] font-bold uppercase">{item.category} → {item.brandName || 'Mixed'}</Badge>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold uppercase opacity-60">
                        {item.shopperObjective}
                      </TableCell>
                      <TableCell className="text-right px-6">
                         <Button variant="ghost" size="icon" onClick={() => onRemoveFromBatch(idx)} className="text-destructive">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
          </CardContent>
          <CardFooter className="bg-muted/10 p-6 flex flex-col gap-4">
             <div className="w-full rounded-lg bg-primary/5 p-4 border border-primary/10 flex items-center gap-4">
                <Sparkles className="h-6 w-6 text-accent" />
                <p className="text-sm font-bold leading-tight">Review Batch: Each entry above results in exactly ONE unique digital identity record.</p>
             </div>
             <Button 
                onClick={handleFinalSubmit} 
                disabled={batch.length === 0 || isSubmittingBatch} 
                className="w-full h-14 font-black uppercase text-xs tracking-widest shadow-xl"
              >
                {isSubmittingBatch ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                Activate {batch.length} Shelves
             </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b flex flex-row justify-between items-center py-4">
           <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                {step}
              </div>
              <CardTitle className="text-lg">
                {isBulkMode ? `Activation #${batch.length + 1} Definition` : 'Activation Definition'}
              </CardTitle>
           </div>
           {isBulkMode && batch.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setIsAddingToBatch(false)} className="text-[10px] font-bold uppercase">
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back to Batch
              </Button>
           )}
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={form.handleSubmit(isBulkMode ? onAddToBatch : onSubmit)}>
             {step === 1 && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retailer Store</Label>
                      <Input {...form.register('storeName')} placeholder="e.g. Sandton City" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shelf / Point of Decision Location</Label>
                      <Input {...form.register('location')} placeholder="e.g. Wine Aisle 4 - End Cap" className="h-11" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Campaign</Label>

                    {!showNewCampaignForm ? (
                      <div className="flex gap-2">
                        <Controller
                          control={form.control}
                          name="campaignId"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="h-11 flex-1">
                                <SelectValue
                                  placeholder={loadingCampaigns ? 'Loading campaigns...' : 'Select a campaign...'}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {campaigns.map((c) => (
                                  <SelectItem key={c.campaignId} value={c.campaignId}>
                                    {c.campaignName}
                                    <span className="ml-1.5 text-[10px] uppercase opacity-50">
                                      ({c.campaignType})
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 shrink-0"
                          onClick={() => setShowNewCampaignForm(true)}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" /> New
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                        <Input
                          value={newCampaignName}
                          onChange={(e) => setNewCampaignName(e.target.value)}
                          placeholder="Campaign name, e.g. Festive Wine Promotion 2026"
                          className="h-11"
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          <Select
                            value={newCampaignType}
                            onValueChange={(v) => setNewCampaignType(v as 'promotion' | 'engagement')}
                          >
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="promotion">Marketing / Promotion</SelectItem>
                              <SelectItem value="engagement">Engagement</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={newCampaignMode}
                            onValueChange={(v) => setNewCampaignMode(v as 'single-target' | 'collection')}
                          >
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single-target">Single Target (one product/brand)</SelectItem>
                              <SelectItem value="collection">Collection (many products/categories)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setShowNewCampaignForm(false)}>
                            Cancel
                          </Button>
                          <Button type="button" onClick={handleCreateCampaign} disabled={isCreatingCampaign}>
                            {isCreatingCampaign ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Create Campaign
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={() => setStep(2)} className="h-11 font-black text-[10px] uppercase tracking-widest px-8">Next Step <ChevronRight className="ml-2 h-4 w-4" /></Button>
                  </div>
               </div>
             )}

             {step === 2 && (
               <div className="space-y-6 animate-in fade-in duration-300">
                 <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category Target</Label>
                      {categories.length > 0 ? (
                        <Controller control={form.control} name="category" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Select Category..." /></SelectTrigger>
                            <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        )} />
                      ) : <Input {...form.register('category')} placeholder="e.g. Wine" className="h-11" />}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brand (Optional)</Label>
                      <Input {...form.register('brandName')} placeholder="e.g. Heritage Vineyards" className="h-11" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Promoted Product (Optional)</Label>
                    <Controller control={form.control} name="targetProductGtin" render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select specific product from catalogue..." /></SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.gtin && (!watched.category || p.category === watched.category)).map(p => (
                            <SelectItem key={p.gtin} value={p.gtin as string}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )} />
                 </div>
                 <div className="flex justify-between pt-4">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                    <Button type="button" onClick={() => setStep(3)} className="h-11 font-black text-[10px] uppercase tracking-widest px-8">Next Step <ChevronRight className="ml-2 h-4 w-4" /></Button>
                  </div>
               </div>
             )}

             {step === 3 && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">Product Decision Context (Contextual GTINs)</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {products.filter(p => p.gtin && (!watched.category || p.category === watched.category)).map(product => {
                      const gtin = product.gtin as string;
                      const checked = selectedContextGtins.includes(gtin);
                      return (
                        <label key={gtin} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors", checked ? 'border-primary bg-primary/[0.04]' : 'hover:bg-muted/30')}>
                          <Checkbox checked={checked} onCheckedChange={() => toggleContextProduct(gtin)} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{product.name}</p>
                            <p className="mt-1 font-mono text-[9px] opacity-60">GTIN {gtin}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
                    <Button type="button" onClick={() => setStep(4)} className="h-11 font-black text-[10px] uppercase tracking-widest px-8">Next Step <ChevronRight className="ml-2 h-4 w-4" /></Button>
                  </div>
               </div>
             )}

             {step === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">Shopper Objective at Point of Decision</Label>
                   <Controller control={form.control} name="shopperObjective" render={({ field }) => (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {OBJECTIVES.map(obj => (
                          <button key={obj.value} type="button" onClick={() => field.onChange(obj.value)} className={cn("rounded-xl border p-4 text-left transition-all", field.value === obj.value ? 'border-primary bg-primary/[0.05] shadow-sm' : 'hover:border-primary/30 hover:bg-muted/30')}>
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-xs font-black uppercase">{obj.label}</span>
                               {field.value === obj.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="text-[10px] leading-relaxed text-muted-foreground">{obj.description}</p>
                          </button>
                        ))}
                      </div>
                   )} />
                   <div className="flex justify-between pt-4">
                    <Button type="button" variant="ghost" onClick={() => setStep(3)}>Back</Button>
                    <Button type="button" onClick={() => setStep(5)} className="h-11 font-black text-[10px] uppercase tracking-widest px-8">Review Intent <ChevronRight className="ml-2 h-4 w-4" /></Button>
                  </div>
                </div>
             )}

             {step === 5 && (
               <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="rounded-xl border p-4 bg-muted/20">
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Physical Context</p>
                          <p className="font-bold text-sm">{watched.storeName} — {watched.location}</p>
                        </div>
                        <div className="rounded-xl border p-4 bg-muted/20">
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Retailer Target</p>
                          <p className="font-bold text-sm">{watched.category} {watched.brandName ? `— ${watched.brandName}` : ''}</p>
                          {targetProduct && <p className="text-xs text-primary mt-1">Promoting: {targetProduct.name}</p>}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="rounded-xl border p-4 bg-muted/20">
                           <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Contextual Products</p>
                           <p className="font-bold text-sm">{selectedContextGtins.length} identifiers assigned</p>
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                           <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">Expected Identity Result</p>
                           <div className="flex items-center gap-2">
                             <QrCode className="h-5 w-5 text-primary" />
                             <span className="font-black text-lg">1 UNIQUE QR IDENTITY</span>
                           </div>
                        </div>
                     </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <Button type="button" variant="ghost" onClick={() => setStep(4)}>Back</Button>
                    <Button type="submit" disabled={isSubmittingBatch} className="h-14 font-black uppercase text-xs tracking-widest px-10 shadow-xl">
                      {isSubmittingBatch ? <Loader2 className="animate-spin mr-2" /> : <Layers className="mr-2" />}
                      {isBulkMode ? 'Add to Batch' : 'Establish Digital Link'}
                    </Button>
                  </div>
               </div>
             )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
