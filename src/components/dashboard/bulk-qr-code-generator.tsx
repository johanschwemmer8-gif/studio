'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller, type UseFormReturn } from 'react-hook-form';
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
import {
  listRetailerCampaigns,
  type RetailerCampaignOption,
} from '@/ai/flows/list-retailer-campaigns';
import {
  listRetailerStores,
  type RetailerStoreOption,
} from '@/ai/flows/list-retailer-stores';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

const deploymentFormSchema = z.object({
  storeId: z.string().min(1, "Store is required"),
  storeName: z.string().min(1, "Store is required"),
  location: z.string().min(1, "Physical location is required"),
});

const activationItemFormSchema = z.object({
  campaignId: z.string().min(1, "Campaign is required"),
  activationName: z.string().min(1, "Activation name is required"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  productType: z.string().optional(),
  brandName: z.string().optional(),
  targetProductGtin: z.string().optional(),
  productGtins: z.array(z.string()).default([]),
  shopperObjective: z.string().min(
    1,
    "Select what you want the shopper to do"
  ),
  experienceMode: z.string().min(1, "Experience mode is required"),
  approvalRequired: z.boolean().default(false),
  assistantPersona: z.string().optional(),
  assistantTone: z.string().optional(),
  assistantGoal: z.string().optional(),
  scanDestination: z.enum(["ai", "url"]).default("ai"),
  landingPageUrl: z.string().optional().or(z.literal("")),
  deployments: z.array(deploymentFormSchema).min(1, "At least one Deployment is required"),
});

const createDefaultDeployment = () => ({
  storeId: "",
  storeName: "",
  location: "",
});

const createDefaultActivationItem = () => ({
  campaignId: "",
  activationName: "",
  category: "",
  subCategory: "",
  productType: "",
  brandName: "",
  targetProductGtin: "",
  productGtins: [],
  shopperObjective: "",
  experienceMode: "",
  approvalRequired: false,
  assistantPersona: "",
  assistantTone: "",
  assistantGoal: "",
  scanDestination: "ai" as const,
  landingPageUrl: "",
  deployments: [createDefaultDeployment()],
});
const bulkFormSchema = z.object({
  retailerId: z.string().min(1, "Retailer ID is required"),
  items: z
    .array(activationItemFormSchema)
    .min(1, "At least one Activation is required"),
});

type BulkFormValues = z.infer<typeof bulkFormSchema>;
type RetailerProduct = {
  id?: string;
  gtin?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
};

type ActivationItemValues = z.infer<typeof activationItemFormSchema>;

function resolveActivationTarget(
  item: ActivationItemValues,
  products: RetailerProduct[]
) {
  const targetProduct = item.targetProductGtin
    ? products.find((product) => product.gtin === item.targetProductGtin)
    : undefined;

  const targetProductGtin =
    targetProduct?.gtin || item.targetProductGtin || undefined;

  if (targetProductGtin) {
    const productName = targetProduct?.name?.trim();

    return {
      level: "PRODUCT" as const,
      value: productName || targetProductGtin,
      label: productName || undefined,
      productGtin: targetProductGtin,
    };
  }

  if (item.brandName?.trim()) {
    const value = item.brandName.trim();
    return { level: "BRAND" as const, value, label: value };
  }

  if (item.productType?.trim()) {
    const value = item.productType.trim();
    return { level: "PRODUCT_TYPE" as const, value, label: value };
  }

  if (item.subCategory?.trim()) {
    const value = item.subCategory.trim();
    return { level: "SUBCATEGORY" as const, value, label: value };
  }

  const value = item.category.trim();
  return { level: "CATEGORY" as const, value, label: value };
}

function buildProductContext(
  item: ActivationItemValues,
  products: RetailerProduct[]
) {
  return item.productGtins.map((gtin) => {
    const product = products.find((candidate) => candidate.gtin === gtin);

    return {
      gtin,
      ...(product?.id ? { productId: product.id } : {}),
      ...(product?.name ? { productName: product.name } : {}),
    };
  });
}
function buildBulkActivationWorkItem(
  item: ActivationItemValues,
  products: RetailerProduct[]
) {
  const target = resolveActivationTarget(item, products);
  const productContext = buildProductContext(item, products);

  return {
    activation: {
      campaignId: item.campaignId,
      name: item.activationName,
      target,
      productContext,
      shopperObjective: item.shopperObjective,
      experienceMode: item.experienceMode,
      experienceConfig: {
        persona: item.assistantPersona || undefined,
        tone: item.assistantTone || undefined,
        goal: item.assistantGoal || undefined,
        scanDestination:
          item.scanDestination === "ai" ? ("AI" as const) : ("URL" as const),
        landingPageUrl:
          item.scanDestination === "url"
            ? item.landingPageUrl || undefined
            : undefined,
      },
      approvalRequired: item.approvalRequired,
    },
    deployments: item.deployments.map((deployment) => ({
      storeId: deployment.storeId,
      storeName: deployment.storeName,
      placement: {
        description: deployment.location,
      },
    })),
  };
}
type ActivationItemCardProps = {
  form: UseFormReturn<BulkFormValues>;
  index: number;
  products: RetailerProduct[];
  campaigns: Array<{
    campaignId: string;
    name: string;
    status: string;
  }>;
  stores: Array<{
    storeId: string;
    storeName: string;
    status?: string;
  }>;
  loadingProducts: boolean;
  loadingCampaigns: boolean;
  loadingStores: boolean;
  removeActivation: () => void;
  canRemove: boolean;
};

function ActivationItemCard({
  form,
  index,
  products,
  campaigns,
  stores,
  loadingProducts,
  loadingCampaigns,
  loadingStores,
  removeActivation,
  canRemove,
}: ActivationItemCardProps) {
  const {
    fields: deploymentFields,
    append: appendDeployment,
    remove: removeDeployment,
  } = useFieldArray({
    control: form.control,
    name: `items.${index}.deployments`,
  });
  const selectedCategory = form.watch(`items.${index}.category`);
  const selectedSubCategory = form.watch(`items.${index}.subCategory`);
  const selectedProductType = form.watch(`items.${index}.productType`);
  const selectedBrandName = form.watch(`items.${index}.brandName`);
  const selectedTargetGtin = form.watch(`items.${index}.targetProductGtin`);
  const selectedContextGtins = form.watch(`items.${index}.productGtins`);
  const scanDestination = form.watch(`items.${index}.scanDestination`);

  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category))
    )
  ).sort();

  const targetProduct = selectedTargetGtin
    ? products.find((product) => product.gtin === selectedTargetGtin)
    : undefined;
  const contextProducts = products.filter(
    (product) =>
      Boolean(product.gtin) &&
      selectedContextGtins.includes(product.gtin as string)
  );

  const toggleContextProduct = (gtin: string) => {
    const fieldName = `items.${index}.productGtins` as const;
    const current = form.getValues(fieldName);

    if (current.includes(gtin)) {
      form.setValue(
        fieldName,
        current.filter((value) => value !== gtin),
        { shouldDirty: true }
      );
    } else {
      form.setValue(fieldName, [...current, gtin], { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Activation {index + 1}</h3>
          <p className="text-sm text-muted-foreground">
            Configure one retailer-defined Point-of-Decision Activation.
          </p>
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="outline"
            onClick={removeActivation}
          >
            Remove Activation
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Campaign
          </Label>

          {loadingCampaigns ? (
            <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
          ) : campaigns.length > 0 ? (
            <Controller
              control={form.control}
              name={`items.${index}.campaignId`}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue placeholder="Select Campaign..." />
                  </SelectTrigger>

                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem
                        key={campaign.campaignId}
                        value={campaign.campaignId}
                      >
                        {campaign.name} ({campaign.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              No eligible Campaigns are available for this retailer.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Activation Name
          </Label>

          <Input
            {...form.register(`items.${index}.activationName`)}
            placeholder="e.g. Summer Wine Discovery"
            className="h-11 bg-white"
          />
        </div>
      </div>
      <div className="space-y-4 border-t pt-4">
        <div>
          <h4 className="text-sm font-semibold">Primary Target</h4>
          <p className="text-xs text-muted-foreground">
            Define the retailer&apos;s promotional or decision target. You can stop at any useful level of the hierarchy.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Category
            </Label>

            {categories.length > 0 ? (
              <Controller
                control={form.control}
                name={`items.${index}.category`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>

                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input
                {...form.register(`items.${index}.category`)}
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
              {...form.register(`items.${index}.subCategory`)}
              placeholder="e.g. Red Wine"
              className="h-11 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Product Type
            </Label>
            <Input
              {...form.register(`items.${index}.productType`)}
              placeholder="e.g. Merlot"
              className="h-11 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Brand
            </Label>
            <Input
              {...form.register(`items.${index}.brandName`)}
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
                name={`items.${index}.targetProductGtin`}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
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

            {targetProduct?.gtin && (
              <p className="font-mono text-[10px] text-muted-foreground">
                GTIN: {targetProduct.gtin}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4 md:col-span-2 lg:col-span-3">
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold">Target hierarchy</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {[
                    selectedCategory,
                    selectedSubCategory,
                    selectedProductType,
                    selectedBrandName,
                    targetProduct?.name,
                  ]
                    .filter(Boolean)
                    .join(" → ") ||
                    "Define the activation target above"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4 border-t pt-4">
        <div>
          <h4 className="text-sm font-semibold">Product Context</h4>
          <p className="text-xs text-muted-foreground">
            Select products available in the shopper&apos;s decision or comparison context. These do not receive separate QR identities.
          </p>
        </div>

        {loadingProducts ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-md bg-muted" />
            <div className="h-12 animate-pulse rounded-md bg-muted" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm font-medium">
              No retailer catalogue products available.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can still create category-level activations.
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
                const checked = selectedContextGtins.includes(gtin);

                return (
                  <label
                    key={gtin}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      checked
                        ? "border-primary bg-primary/[0.04]"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleContextProduct(gtin)}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {product.name || "Unnamed product"}
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

        <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">
            Product Context
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {contextProducts.length === 0
              ? "No products selected for comparison context."
              : `${contextProducts.length} catalogue product${
                  contextProducts.length === 1 ? "" : "s"
                } selected.`}
          </p>
        </div>
      </div>
      <div className="space-y-4 border-t pt-4">
        <div>
          <h4 className="text-sm font-semibold">Shopper Objective</h4>
          <p className="text-xs text-muted-foreground">
            Define what the shopper should achieve at this Point of Decision.
          </p>
        </div>

        <Controller
          control={form.control}
          name={`items.${index}.shopperObjective`}
          render={({ field }) => (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {OBJECTIVES.map((objective) => {
                const selected = field.value === objective.value;

                return (
                  <button
                    key={objective.value}
                    type="button"
                    onClick={() => field.onChange(objective.value)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/[0.05] shadow-sm"
                        : "hover:border-primary/30 hover:bg-muted/30"
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
      </div>
      <div className="space-y-4 border-t pt-4">
        <div>
          <h4 className="text-sm font-semibold">Shopper Experience</h4>
          <p className="text-xs text-muted-foreground">
            Define the shopper experience for this Activation, including its canonical Experience Mode and optional Ari configuration.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Experience Mode
            </Label>

            <Input
              {...form.register(`items.${index}.experienceMode`)}
              placeholder="Enter the retailer-defined experience mode"
              className="bg-white"
            />

            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Experience Mode is a required canonical Activation field. No fixed vocabulary is imposed until the platform defines one.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 md:col-span-2">
            <Controller
              control={form.control}
              name={`items.${index}.approvalRequired`}
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />

                  <div>
                    <Label className="text-xs font-bold">Approval Required</Label>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      When enabled, this Activation enters the canonical approval workflow before later lifecycle progression. When disabled, this request adds no approval gate.
                    </p>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Assistant Persona
            </Label>
            <Input
              {...form.register(`items.${index}.assistantPersona`)}
              placeholder="e.g. Expert Sommelier"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Assistant Tone
            </Label>
            <Input
              {...form.register(`items.${index}.assistantTone`)}
              placeholder="e.g. Helpful and concise"
              className="bg-white"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Assistant Goal
            </Label>
            <Textarea
              {...form.register(`items.${index}.assistantGoal`)}
              placeholder="e.g. Help the shopper choose the right Merlot for a summer dinner."
              className="min-h-24 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Shopper Destination
            </Label>

            <Controller
              control={form.control}
              name={`items.${index}.scanDestination`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">Ari Guidance (Interactive)</SelectItem>
                    <SelectItem value="url">Direct to Website</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {scanDestination === "url" && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Destination URL
              </Label>
              <Input
                {...form.register(`items.${index}.landingPageUrl`)}
                placeholder="https://..."
                className="bg-white"
              />
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4 border-t pt-4">
        <div>
          <h4 className="text-sm font-semibold">Deployments</h4>
          <p className="text-xs text-muted-foreground">
            Choose where this Activation will be deployed in-store.
          </p>
        </div>

        {deploymentFields.map((deploymentField, deploymentIndex) => (
          <div
            key={deploymentField.id}
            className="space-y-4 rounded-lg border bg-muted/10 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">
                Deployment {deploymentIndex + 1}
              </p>
              {deploymentFields.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDeployment(deploymentIndex)}
                >
                  Remove Deployment
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Store
                </Label>

                {loadingStores ? (
                  <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
                ) : stores.length > 0 ? (
                  <Controller
                    control={form.control}
                    name={`items.${index}.deployments.${deploymentIndex}.storeId`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(storeId) => {
                          field.onChange(storeId);

                          const store = stores.find(
                            (option) => option.storeId === storeId
                          );

                          form.setValue(
                            `items.${index}.deployments.${deploymentIndex}.storeName`,
                            store?.storeName || "",
                            { shouldValidate: true, shouldDirty: true }
                          );
                        }}
                      >
                        <SelectTrigger className="h-11 bg-white">
                          <SelectValue placeholder="Select Store..." />
                        </SelectTrigger>

                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem
                              key={store.storeId}
                              value={store.storeId}
                            >
                              {store.storeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    No active Stores are available for this retailer.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Placement
                </Label>

                <Input
                  {...form.register(
                    `items.${index}.deployments.${deploymentIndex}.location`
                  )}
                  placeholder="e.g. Wine Aisle 4 / Summer Display"
                  className="h-11 bg-white"
                />

                <p className="text-[10px] text-muted-foreground">
                  Recorded as the Deployment placement description.
                </p>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => appendDeployment(createDefaultDeployment())}
        >
          Add Deployment
        </Button>
      </div>
    </div>
  );
}
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

type BulkRequestReviewProps = {
  form: UseFormReturn<BulkFormValues>;
  campaigns: RetailerCampaignOption[];
  products: RetailerProduct[];
  isSubmitting: boolean;
};

function BulkRequestReview({
  form,
  campaigns,
  products,
  isSubmitting,
}: BulkRequestReviewProps) {
  const items = form.watch("items");

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-lg">Bulk Request Review</CardTitle>
        <CardDescription>
          Review every Activation and its Deployments before submitting the bulk request.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <p className="text-sm text-muted-foreground">
          {items.length} Activation{items.length === 1 ? "" : "s"} in this request.
        </p>

        <div className="space-y-4">
          {items.map((item, itemIndex) => {
            const campaign = campaigns.find(
              (candidate) => candidate.campaignId === item.campaignId
            );
            const target = resolveActivationTarget(item, products);
            const objective = OBJECTIVES.find(
              (candidate) => candidate.value === item.shopperObjective
            );

            return (
              <div
                key={`${item.campaignId}-${item.activationName}-${itemIndex}`}
                className="space-y-4 rounded-xl border p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary/70">
                      Activation {itemIndex + 1}
                    </p>
                    <h4 className="mt-1 text-base font-semibold">
                      {item.activationName || "Not specified"}
                    </h4>
                  </div>

                  <Badge variant="outline">
                    {item.deployments.length} Deployment
                    {item.deployments.length === 1 ? "" : "s"}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Campaign
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {campaign?.name || item.campaignId || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Primary Target
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {target.label || target.value || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Product Context
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {item.productGtins.length} product
                      {item.productGtins.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Shopper Objective
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {objective?.label || item.shopperObjective || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Experience Mode
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {item.experienceMode || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Approval
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {item.approvalRequired
                        ? "Approval required"
                        : "No approval gate requested"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Shopper Destination
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {item.scanDestination === "url"
                        ? "Direct to Website"
                        : "Ari Guidance (Interactive)"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold">Deployments</p>
                    <span className="text-xs text-muted-foreground">
                      {item.deployments.length} total
                    </span>
                  </div>

                  <div className="space-y-2">
                    {item.deployments.map((deployment, deploymentIndex) => (
                      <div
                        key={`${deployment.storeId}-${deployment.location}-${deploymentIndex}`}
                        className="grid gap-3 rounded-lg border bg-muted/10 p-3 md:grid-cols-2"
                      >
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Deployment {deploymentIndex + 1}
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {deployment.storeName || deployment.storeId || "Store not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Placement
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {deployment.location || "Not specified"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-bold">Canonical identity chain</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Each Campaign provides commercial context. Each Activation defines retailer intent. Each Deployment records a physical store placement. QR identity is not created by this bulk request and is bound later through the canonical QR lifecycle.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 p-5 text-white">
          <div className="flex items-center gap-2">
            <Barcode className="h-4 w-4 text-blue-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Product Identity / GTIN
            </p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            Product GTIN remains the authoritative product identifier. An Activation may target or reference products by GTIN, but GTIN remains separate from Activation, Deployment and QR identity.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 p-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Server-side canonical bulk request processing
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full px-10 font-black uppercase tracking-tight shadow-xl sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Bulk Request
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Submit Bulk Request
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
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
  const [campaigns, setCampaigns] = useState<RetailerCampaignOption[]>([]);
  const [stores, setStores] = useState<RetailerStoreOption[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);

  const bulkForm = useForm<BulkFormValues>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      retailerId: user?.retailerId || "",
      items: [createDefaultActivationItem()],
    },
  });

  const {
    fields: activationFields,
    append: appendActivation,
    remove: removeActivation,
  } = useFieldArray({
    control: bulkForm.control,
    name: "items",
  });

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
        bulkForm.setValue('retailerId', retailerId as string);
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
  }, [user?.retailerId, toast]);

  useEffect(() => {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!retailerId || !authenticatedUser) {
      setLoadingCampaigns(false);
      setLoadingStores(false);
      return;
    }

    async function fetchRetailerSelectors(
      currentUser: NonNullable<typeof authenticatedUser>,
      currentRetailerId: string
    ) {
      setLoadingCampaigns(true);
      setLoadingStores(true);

      try {
        const idToken = await currentUser.getIdToken();

        const [campaignOptions, storeOptions] = await Promise.all([
          listRetailerCampaigns({
            idToken,
            retailerId: currentRetailerId,
          }),
          listRetailerStores({
            idToken,
            retailerId: currentRetailerId,
          }),
        ]);

        setCampaigns(campaignOptions);
        setStores(storeOptions);
      } catch (error) {
        console.error(
          '[QR Activation] Failed to load Campaign or Store options:',
          error
        );

        toast({
          title: 'Could not load Campaigns or Stores',
          description:
            'Canonical Campaign and Store records could not be loaded.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCampaigns(false);
        setLoadingStores(false);
      }
    }

    fetchRetailerSelectors(authenticatedUser, retailerId);
  }, [user?.retailerId, user, toast]);
  const bulkOnSubmit = async (data: BulkFormValues) => {
    setIsSubmitting(true);

    try {
      const idToken = await user?.getIdToken();

      if (!idToken) {
        throw new Error("Please log in again to continue.");
      }

      const result = await submitBulkQrRequest({
        idToken,
        retailerId: data.retailerId,
        items: data.items.map((item) =>
          buildBulkActivationWorkItem(item, products)
        ),
      });

      if (!result.success) {
        throw new Error("The bulk activation request could not be queued.");
      }

      setCreatedRequestId(result.requestId);
      setIsSuccess(true);

      toast({
        title: "Bulk Request Queued",
        description:
          "The Activation and Deployment requests have been queued for server-side processing.",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      toast({
        title: "Bulk Request Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetActivation = () => {
    bulkForm.reset({
      retailerId: user?.retailerId || "",
      items: [createDefaultActivationItem()],
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
            Request Queued
          </CardTitle>

          <CardDescription className="font-medium text-green-700">
            Your bulk Activation and Deployment request has been accepted for
            server-side processing.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 text-center">
          <div className="mx-auto mb-8 max-w-xl space-y-4">
            <p className="text-sm leading-relaxed text-green-700/80">
              The request is now in the canonical processing queue. Successful
              processing will create the requested Activation and Deployment records.
              QR identity is not created at this stage and remains part of the
              later canonical QR lifecycle.
            </p>

            {createdRequestId && (
              <div className="rounded-lg border border-green-200 bg-white/70 p-4 text-left">
                <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-green-700/60">
                  Request ID
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
              Submit Another Bulk Request
            </Button>

            <Button
              asChild
              className="h-12 bg-green-600 px-8 font-black uppercase text-[10px] tracking-widest text-white hover:bg-green-500"
            >
              <a href="#bulk-activation-history">
                View Request History
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>

        <div className="mt-10 h-2 w-full bg-green-500/20" />
      </Card>
    );
  }
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-primary">
            <Barcode className="h-8 w-8" />
            Bulk Activation Request
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Submit one or more canonical Activations and their Deployment requests for
            server-side processing.
          </p>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-primary/20 bg-primary/5 px-3 py-1 font-bold uppercase tracking-wider text-[10px] text-primary"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified Standards
        </Badge>
      </div>

      <form onSubmit={bulkForm.handleSubmit(bulkOnSubmit)}>
        <div className="space-y-6">
          {activationFields.map((field, index) => (
            <ActivationItemCard
              key={field.id}
              form={bulkForm}
              index={index}
              products={products}
              campaigns={campaigns}
              stores={stores}
              loadingProducts={loadingProducts}
              loadingCampaigns={loadingCampaigns}
              loadingStores={loadingStores}
              removeActivation={() => removeActivation(index)}
              canRemove={activationFields.length > 1}
            />
          ))}

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-6 font-bold"
              onClick={() => appendActivation(createDefaultActivationItem())}
            >
              Add Activation
            </Button>
          </div>

          <BulkRequestReview
            form={bulkForm}
            campaigns={campaigns}
            products={products}
            isSubmitting={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}