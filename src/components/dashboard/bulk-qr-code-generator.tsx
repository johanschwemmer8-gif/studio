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

const formSchema = z.object({
  retailerId: z.string().min(1, 'Retailer ID is required'),
  campaignId: z.string().min(1, 'Campaign association is required'),
  category: z.string().min(1, 'Category is required'),
  targetProductGtin: z.string().min(1, 'Primary product is required'),
  productGtins: z.array(z.string()).default([]),
  storeName: z.string().min(1, 'Store is required'),
  location: z.string().min(1, 'Physical location is required'),
  shopperObjective: z.string().min(1, 'Select an objective'),
  count: z.number().int().min(1).max(500).default(1),
  scanDestination: z.enum(['ai', 'url']).default('ai'),
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
};

const OBJECTIVES = [
  { value: 'discover', label: 'Discover' },
  { value: 'compare', label: 'Compare' },
  { value: 'choose', label: 'Choose' },
  { value: 'learn', label: 'Learn' },
];

export default function BulkQRCodeGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [products, setProducts] = useState<RetailerProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [campaigns, setCampaigns] = useState<RetailerCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      retailerId: user?.retailerId || '',
      campaignId: '',
      category: '',
      targetProductGtin: '',
      productGtins: [],
      storeName: '',
      location: '',
      shopperObjective: '',
      count: 1,
      scanDestination: 'ai',
    },
  });

  const watched = form.watch();

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
        console.error('Failed to fetch retailer products:', error);
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
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    fetchCampaigns();
  }, [user?.retailerId, user]);

  const categories = useMemo(() => {
    const values = products.map((p) => p.category?.trim()).filter((v): v is string => Boolean(v));
    return Array.from(new Set(values)).sort();
  }, [products]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const idToken = await user?.getIdToken();
    if (!idToken) {
      toast({ title: "Auth required", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await submitBulkQrRequest({
        ...data,
        idToken,
        productName: products.find(p => p.gtin === data.targetProductGtin)?.name,
      });
      setRequestId(result.requestId);
      setIsSuccess(true);
      toast({ title: "Request Submitted" });
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black uppercase text-green-800">Generation Triggered</CardTitle>
          <CardDescription className="text-green-700">Request ID: {requestId}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => { setIsSuccess(false); form.reset(); }} variant="outline">Create More</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader>
        <CardTitle>Bulk QR Generator</CardTitle>
        <CardDescription>Generate multiple QR codes for your product catalog.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Category</Label>
              <Controller control={form.control} name="category" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select Category..." /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Primary Product</Label>
              <Controller control={form.control} name="targetProductGtin" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select product..." /></SelectTrigger>
                  <SelectContent>
                    {products.filter(p => !watched.category || p.category === watched.category).map(p => (
                      <SelectItem key={p.gtin} value={p.gtin as string}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input {...form.register('storeName')} placeholder="e.g. Sandton City" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" {...form.register('count', { valueAsNumber: true })} className="h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Physical Location</Label>
            <Input {...form.register('location')} placeholder="e.g. Aisle 4, Shelf 2" className="h-11" />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase tracking-widest">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2" />}
            Generate QR Codes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
