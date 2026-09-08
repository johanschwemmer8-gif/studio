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
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
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

  campaignId: z
    .string()
    .min(1, 'Activation name is required'),

  category: z.string().min(1, 'Category is required'),

  subCategory: z.string().optional(),

  productType: z.string().optional(),

  brandName: z.string().optional(),

  targetProductGtin: z.string().optional(),

  productGtins: z.array(z.string()).default([]),

  storeId: z.string().optional(),

  storeName: z.string().min(1, 'Store is required'),

  location: z.string().min(1, 'Physical location is required'),

  shopperObjective: z.string().min(
    1,
    'Select what you want the shopper to do'
  ),

  assistantPersona: z.string().optional(),

  assistantTone: z.string().optional(),

  assistantGoal: z.string().optional(),

  scanDestination: z
    .enum(['ai', 'url'])
    .default('ai'),

  landingPageUrl: z
    .string()
    .optional()
    .or(z.literal('')),
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

const OBJECTIVES = [
  {
    value: 'discover',
    label: 'Discover',
    description:
      'Help shoppers discover relevant products or categories.',
  },
  {
    value: 'compare',
    label: 'Compare',
    description:
      'Help shoppers compare products in this decision context.',
  },
  {
    value: 'choose',
    label: 'Choose',
    description:
      'Help shoppers make a confident product choice.',
  },
  {
    value: 'learn',
    label: 'Learn',
    description:
      'Provide useful information about the products or category.',
  },
  {
    value: 'recommendation',
    label: 'Get a recommendation',
    description:
      'Use Ari to guide the shopper toward the right option.',
  },
  {
    value: 'promote',
    label: 'Promote a specific product',
    description:
      'Direct attention toward the selected target product.',
  },
];

export default function BulkQRCodeGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(
    null
  );

  const [products, setProducts] = useState<RetailerProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

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

  const selectedTargetGtin = form.watch('targetProductGtin');
  const selectedContextGtins = form.watch('productGtins');
  const selectedCategory = form.watch('category');
  const selectedObjective = form.watch('shopperObjective');
  const scanDestination = form.watch('scanDestination');

  useEffect(() => {
    const retailerId = user?.retailerId;

    if (!retailerId || !db) {
      setLoadingProducts(false);
      return;
    }

    async function fetchRetailerProducts() {
      setLoadingProducts(true);

      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('retailerId', '==', retailerId)
        );

        const snapshot = await getDocs(productsQuery);

        const fetchedProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<RetailerProduct, 'id'>),
        }));

        setProducts(fetchedProducts);
        form.setValue('retailerId', retailerId as string);
      } catch (error) {
        console.error(
          '[QR Activation] Failed to fetch retailer products:',
          error
        );

        toast({
          title: 'Could not load products',
          description:
            'The activation form is available, but the retailer catalogue could not be loaded.',
          variant: 'destructive',
        });
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchRetailerProducts();
  }, [user?.retailerId, form, toast]);

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category?.trim())
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set(values)).sort();
  }, [products]);

  const targetProduct = useMemo(() => {
    if (!selectedTargetGtin) {
      return undefined;
    }

    return products.find(
      (product) => product.gtin === selectedTargetGtin
    );
  }, [products, selectedTargetGtin]);

  const contextProducts = useMemo(() => {
    return products.filter(
      (product) =>
        Boolean(product.gtin) &&
        selectedContextGtins.includes(product.gtin as string)
    );
  }, [products, selectedContextGtins]);

  const toggleContextProduct = (gtin: string) => {
    const current = form.getValues('productGtins');

    if (current.includes(gtin)) {
      form.setValue(
        'productGtins',
        current.filter((value) => value !== gtin),
        { shouldDirty: true }
      );
    } else {
      form.setValue(
        'productGtins',
        [...current, gtin],
        { shouldDirty: true }
      );
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      const idToken = await user?.getIdToken();

      if (!idToken) {
        throw new Error(
          'Please log in again to continue.'
        );
      }

      const target = {
        category: data.category || undefined,
        subCategory: data.subCategory || undefined,
        productType: data.productType || undefined,
        brandId: undefined,
        brandName: data.brandName || undefined,
        targetProductName: targetProduct?.name || undefined,
        targetProductGtin:
          targetProduct?.gtin ||
          data.targetProductGtin ||
          undefined,
      };

      const result = await submitBulkQrRequest({
        idToken,
        retailerId: data.retailerId,
        brandId: 'default',
        campaignId: data.campaignId,

        target,

        productGtins: data.productGtins,

        storeId: data.storeId || undefined,
        storeName: data.storeName,
        location: data.location,

        shopperObjective: data.shopperObjective,

        count: 1,

        options: {
          aiPersona: data.assistantPersona || undefined,
          aiTone: data.assistantTone || undefined,
          aiGoal: data.assistantGoal || undefined,
          scanDestination: data.scanDestination,
          landingPageUrl:
            data.scanDestination === 'url'
              ? data.landingPageUrl || undefined
              : undefined,
          isGs1DigitalLink: true,
          errorCorrection: 'M',
        },

        productName: targetProduct?.name,
      });

      if (!result.success) {
        throw new Error(
          'The activation could not be created.'
        );
      }

      setCreatedRequestId(result.requestId);
      setIsSuccess(true);

      toast({
        title: 'Activation Created',
        description:
          'Your Point-of-Decision activation has been queued successfully.',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';

      toast({
        title: 'Activation Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetActivation = () => {
    form.reset({
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
    });

    setCreatedRequestId(null);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <Card className="overflow-hidden border-green-200 bg-green-50 shadow-xl">
        <CardHeader className="pb-4 pt-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-lg">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>

          <CardTitle className="text-2xl font-black uppercase tracking-tight text-green-800">
            Activation Created
          </CardTitle>

          <CardDescription className="font-medium text-green-700">
            Your Point-of-Decision activation has been accepted by the network.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 text-center">
          <div className="mx-auto mb-8 max-w-xl space-y-4">
            <p className="text-sm leading-relaxed text-green-700/80">
              The activation now has its own digital QR identity. QR processing
              is handled by the server-side activation pipeline.
            </p>

            {createdRequestId && (
              <div className="rounded-lg border border-green-200 bg-white/70 p-4 text-left">
                <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-green-700/60">
                  Activation ID
                </p>

                <code className="break-all font-mono text-xs text-green-900">
                  {createdRequestId}
                </code>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={resetActivation}
              variant="outline"
              className="h-12 border-green-200 font-bold uppercase text-[10px] tracking-widest text-green-700 hover:bg-green-100"
            >
              Activate Another
            </Button>
          </div>
        </CardContent>

        <div className="mt-10 h-2 w-full bg-green-500/20" />
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">

          {/* STEP 1 — TARGET */}

          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                  1
                </div>

                <div>
                  <CardTitle className="text-lg">
                    Retailer Intent / Target
                  </CardTitle>

                  <CardDescription>
                    Define the promotional or decision target.
                    You can stop at any useful level of the hierarchy.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 pt-6 md:grid-cols-2 lg:grid-cols-3">

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Category
                </Label>

                {categories.length > 0 ? (
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-11 bg-white">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>

                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category}
                              value={category}
                            >
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Input
                    {...form.register('category')}
                    placeholder="e.g. Wine"
                    className="h-11 bg-white"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Sub-category
                </Label>

                <Input
                  {...form.register('subCategory')}
                  placeholder="e.g. Red Wine"
                  className="h-11 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Product Type
                </Label>

                <Input
                  {...form.register('productType')}
                  placeholder="e.g. Merlot"
                  className="h-11 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Brand
                </Label>

                <Input
                  {...form.register('brandName')}
                  placeholder="e.g. Brand X"
                  className="h-11 bg-white"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Specific Product
                  <Info className="h-3 w-3" />
                </Label>

                {loadingProducts ? (
                  <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
                ) : (
                  <Controller
                    control={form.control}
                    name="targetProductGtin"
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-11 bg-white">
                          <SelectValue placeholder="Optional — select a catalogue product..." />
                        </SelectTrigger>

                        <SelectContent>
                          {products
                            .filter((product) => product.gtin)
                            .filter(
                              (product) =>
                                !selectedCategory ||
                                product.category === selectedCategory
                            )
                            .map((product) => (
                              <SelectItem
                                key={product.gtin}
                                value={product.gtin as string}
                              >
                                {product.name || product.gtin}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>

              <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4 md:col-span-2 lg:col-span-3">
                <div className="flex items-start gap-3">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <div>
                    <p className="text-xs font-bold">
                      Target hierarchy
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {[
                        selectedCategory,
                        form.watch('subCategory'),
                        form.watch('productType'),
                        form.watch('brandName'),
                        targetProduct?.name,
                      ]
                        .filter(Boolean)
                        .join(' → ') ||
                        'Define the activation target above'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STEP 2 — PHYSICAL LOCATION */}

          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                  2
                </div>

                <div>
                  <CardTitle className="text-lg">
                    Physical Point of Decision
                  </CardTitle>

                  <CardDescription>
                    Identify where the QR will be deployed in-store.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 pt-6 md:grid-cols-2">

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Store
                </Label>

                <Input
                  {...form.register('storeName')}
                  placeholder="e.g. Sandton City"
                  className="h-11 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Location
                </Label>

                <Input
                  {...form.register('location')}
                  placeholder="e.g. Wine Aisle 4 / Summer Display"
                  className="h-11 bg-white"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Campaign Association
                </Label>

                <Input
                  {...form.register('campaignId')}
                  placeholder="e.g. Summer Wine Special"
                  className="h-11 bg-white"
                />

                <p className="text-[10px] text-muted-foreground">
                  This identifier links the activation to a specific retailer campaign context.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* STEP 3 — PRODUCT CONTEXT */}

          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                  3
                </div>

                <div>
                  <CardTitle className="text-lg">
                    Product Context
                  </CardTitle>

                  <CardDescription>
                    Select products available in the shopper&apos;s decision
                    context. These do not receive separate QR identities.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {loadingProducts ? (
                <div className="space-y-3">
                  <div className="h-12 animate-pulse rounded-md bg-muted" />
                  <div className="h-12 animate-pulse rounded-md bg-muted" />
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">
                    No catalogue products available.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {products
                    .filter((product) => product.gtin)
                    .filter(
                      (product) =>
                        !selectedCategory ||
                        product.category === selectedCategory
                    )
                    .map((product) => {
                      const gtin = product.gtin as string;
                      const checked =
                        selectedContextGtins.includes(gtin);

                      return (
                        <label
                          key={gtin}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                            checked
                              ? 'border-primary bg-primary/[0.04]'
                              : 'hover:bg-muted/30'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              toggleContextProduct(gtin)
                            }
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {product.name || 'Unnamed product'}
                            </p>

                            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                              GTIN {gtin}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 4 — SHOPPER OBJECTIVE */}

          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                  4
                </div>

                <div>
                  <CardTitle className="text-lg">
                    Shopper Objective
                  </CardTitle>

                  <CardDescription>
                    Define the intended outcome for this Point of Decision.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <Controller
                control={form.control}
                name="shopperObjective"
                render={({ field }) => (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {OBJECTIVES.map((objective) => {
                      const selected =
                        field.value === objective.value;

                      return (
                        <button
                          key={objective.value}
                          type="button"
                          onClick={() =>
                            field.onChange(objective.value)
                          }
                          className={`rounded-xl border p-4 text-left transition-all ${
                            selected
                              ? 'border-primary bg-primary/[0.05] shadow-sm'
                              : 'hover:border-primary/30 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold">
                              {objective.label}
                            </span>

                            {selected && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>

                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {objective.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* STEP 5 — REVIEW */}

          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                  5
                </div>

                <div>
                  <CardTitle className="text-lg">
                    Review Activation
                  </CardTitle>

                  <CardDescription>
                    Confirm the context before creating the digital identity.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Activation Context
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {form.watch('campaignId') || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Shopper Objective
                  </p>

                  <p className="mt-1 text-sm font-semibold capitalize">
                    {OBJECTIVES.find(
                      (objective) =>
                        objective.value === selectedObjective
                    )?.label || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Target Intent
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {[
                      selectedCategory,
                      form.watch('subCategory'),
                      form.watch('productType'),
                      form.watch('brandName'),
                      targetProduct?.name,
                    ]
                      .filter(Boolean)
                      .join(' → ') || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Point of Decision
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {[
                      form.watch('storeName'),
                      form.watch('location'),
                    ]
                      .filter(Boolean)
                      .join(' — ') || 'Not specified'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <div>
                    <p className="text-xs font-bold">
                      1 Activation = 1 QR Identity
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      The selected products provide context. The resulting QR code serves as the digital identity for this physical Point of Decision.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 p-6 sm:flex-row sm:justify-between">

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Authoritative activation pipeline active.
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full px-10 font-black uppercase tracking-tight shadow-xl sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Create Activation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
