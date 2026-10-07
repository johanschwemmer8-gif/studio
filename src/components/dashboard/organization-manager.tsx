'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  PlusCircle, 
  Trash2, 
  Globe, 
  Layers,
  Save,
  Loader2,
  MapPin,
  Store
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const storeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Store name is required'),
  code: z.string().optional(),
  address: z.string().optional(),
});

const areaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Area name is required'),
  stores: z.array(storeSchema).default([]),
});

const SOUTH_AFRICAN_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const;

const regionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Region name is required'),
  province: z.enum(SOUTH_AFRICAN_PROVINCES),
  areas: z.array(areaSchema).default([]),
});

const divisionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Division name is required'),
  regions: z.array(regionSchema).default([]),
});

const brandSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Brand name is required'),
  divisions: z.array(divisionSchema).default([]),
});

const organizationSchema = z.object({
  retailerName: z.string().default(''),
  retailerLogoUrl: z.string().default(''),
  brands: z.array(brandSchema),
});

export type OrganizationValues = z.infer<typeof organizationSchema>;


type NetworkCsvRow = {
  brand: string;
  division: string;
  region: string;
  province: string;
  area: string;
  storeCode: string;
  storeName: string;
  address?: string;
};

const NETWORK_CSV_HEADERS = [
  'brand',
  'division',
  'region',
  'province',
  'area',
  'storeCode',
  'storeName',
  'address',
] as const;

function buildOrganizationFromCsv(
  csvText: string,
  current: OrganizationValues
): OrganizationValues {
  const parsed = Papa.parse<NetworkCsvRow>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(
      `CSV parsing failed${first.row !== undefined ? ` on row ${first.row + 2}` : ''}: ${first.message}`
    );
  }

  const fields = parsed.meta.fields ?? [];
  const missingHeaders = NETWORK_CSV_HEADERS.filter(
    (header) => header !== 'address' && !fields.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}`);
  }

  if (parsed.data.length === 0) {
    throw new Error('The CSV does not contain any store rows.');
  }

  const storeCodes = new Set<string>();
  const brands = new Map<string, OrganizationValues['brands'][number]>();

  parsed.data.forEach((row, rowIndex) => {
    const csvRowNumber = rowIndex + 2;

    const requiredValues = {
      brand: row.brand,
      division: row.division,
      region: row.region,
      province: row.province,
      area: row.area,
      storeCode: row.storeCode,
      storeName: row.storeName,
    };

    const missingValues = Object.entries(requiredValues)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingValues.length > 0) {
      throw new Error(
        `Row ${csvRowNumber} is missing required values: ${missingValues.join(', ')}`
      );
    }

    if (!SOUTH_AFRICAN_PROVINCES.includes(row.province as any)) {
      throw new Error(
        `Row ${csvRowNumber} has an invalid province: ${row.province}`
      );
    }

    const normalizedStoreCode = row.storeCode.toLowerCase();
    if (storeCodes.has(normalizedStoreCode)) {
      throw new Error(
        `Duplicate store code "${row.storeCode}" found on row ${csvRowNumber}.`
      );
    }
    storeCodes.add(normalizedStoreCode);

    const brandKey = row.brand.toLowerCase();
    let brand = brands.get(brandKey);
    if (!brand) {
      brand = {
        id: crypto.randomUUID(),
        name: row.brand,
        divisions: [],
      };
      brands.set(brandKey, brand);
    }

    let division = brand.divisions.find(
      (item) => item.name.toLowerCase() === row.division.toLowerCase()
    );
    if (!division) {
      division = {
        id: crypto.randomUUID(),
        name: row.division,
        regions: [],
      };
      brand.divisions.push(division);
    }

    let region = division.regions.find(
      (item) =>
        item.name.toLowerCase() === row.region.toLowerCase() &&
        item.province === row.province
    );
    if (!region) {
      region = {
        id: crypto.randomUUID(),
        name: row.region,
        province: row.province as (typeof SOUTH_AFRICAN_PROVINCES)[number],
        areas: [],
      };
      division.regions.push(region);
    }

    let area = region.areas.find(
      (item) => item.name.toLowerCase() === row.area.toLowerCase()
    );
    if (!area) {
      area = {
        id: crypto.randomUUID(),
        name: row.area,
        stores: [],
      };
      region.areas.push(area);
    }

    area.stores.push({
      id: crypto.randomUUID(),
      name: row.storeName,
      code: row.storeCode,
      address: row.address || undefined,
    });
  });

  return {
    retailerName: current.retailerName,
    retailerLogoUrl: current.retailerLogoUrl,
    brands: Array.from(brands.values()),
  };
}

function ensureOrganizationIds(data: any): OrganizationValues {
  return {
    retailerName: typeof data?.retailerName === 'string' ? data.retailerName : '',
    retailerLogoUrl: typeof data?.retailerLogoUrl === 'string' ? data.retailerLogoUrl : '',
    brands: Array.isArray(data?.brands)
      ? data.brands.map((brand: any) => ({
          ...brand,
          id: brand.id || crypto.randomUUID(),
          divisions: Array.isArray(brand.divisions)
            ? brand.divisions.map((division: any) => ({
                ...division,
                id: division.id || crypto.randomUUID(),
                regions: Array.isArray(division.regions)
                  ? division.regions.map((region: any) => ({
                      ...region,
                      id: region.id || crypto.randomUUID(),
                      areas: Array.isArray(region.areas)
                        ? region.areas.map((area: any) => ({
                            ...area,
                            id: area.id || crypto.randomUUID(),
                            stores: Array.isArray(area.stores)
                              ? area.stores.map((store: any) => ({
                                  ...store,
                                  id: store.id || crypto.randomUUID(),
                                }))
                              : [],
                          }))
                        : [],
                    }))
                  : [],
              }))
            : [],
        }))
      : [],
  };
}

type OrganizationManagerProps = {
  retailerId?: string;
  platformContext?: boolean;
};

export function OrganizationManager({
  retailerId,
  platformContext = false,
}: OrganizationManagerProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const effectiveRetailerId = platformContext ? retailerId : user?.retailerId;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  const form = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      retailerName: '',
      retailerLogoUrl: '',
      brands: [],
    },
  });

  const { fields: brandFields, append: appendBrand, remove: removeBrand } = useFieldArray({
    control: form.control,
    name: 'brands',
  });

  useEffect(() => {
    if (!effectiveRetailerId || !db) {
      setIsFetching(false);
      return;
    }

    const docRef = doc(db, 'configurations', `${effectiveRetailerId}_org`);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        form.reset(ensureOrganizationIds(data.data));
      } else if (!platformContext) {
        // Retailer-only migration fallback for historical local browser data.
        // Platform administration must never treat browser-local state as
        // authoritative data for a selected tenant.
        const saved = localStorage.getItem('retail-organization-structure');
        if (saved) {
          try {
            form.reset(ensureOrganizationIds(JSON.parse(saved)));
          } catch (e) {
            console.error('Failed to parse legacy org structure');
          }
        }
      } else {
        form.reset({
          retailerName: '',
          retailerLogoUrl: '',
          brands: [],
        });
      }
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [effectiveRetailerId, form, platformContext]);


  const handleRetailerLogoUpload = async (file: File) => {
    if (!effectiveRetailerId) return;

    setIsLogoUploading(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const storage = getStorage(getApp());
      const logoRef = ref(storage, `retailer-assets/${effectiveRetailerId}/organization/retailer-logo-${Date.now()}.${extension}`);
      await uploadBytes(logoRef, file);
      const downloadUrl = await getDownloadURL(logoRef);
      form.setValue('retailerLogoUrl', downloadUrl, { shouldDirty: true, shouldValidate: true });
      toast({ title: 'Logo Uploaded', description: 'Save the Retail Network to apply this logo to the Retailer MVP.' });
    } catch (e: any) {
      toast({ title: 'Logo Upload Failed', description: e.message || 'Firebase Storage upload failed.', variant: 'destructive' });
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csv = `${NETWORK_CSV_HEADERS.join(',')}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'interact-retail-network-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleNetworkCsvImport = async (file: File) => {
    try {
      const csvText = await file.text();
      const imported = buildOrganizationFromCsv(csvText, form.getValues());

      form.setValue('brands', imported.brands, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({
        title: 'Network Import Ready',
        description:
          'The CSV has been validated and loaded for review. Click Save Network Structure to persist it.',
      });
    } catch (error: any) {
      toast({
        title: 'Network Import Failed',
        description:
          error?.message || 'The CSV could not be validated.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: OrganizationValues) => {
    const storeCodes = data.brands.flatMap((brand) =>
      brand.divisions.flatMap((division) =>
        division.regions.flatMap((region) =>
          region.areas.flatMap((area) =>
            area.stores.map((store) => ({
              code: store.code?.trim() || '',
              name: store.name,
            }))
          )
        )
      )
    );

    const storeWithoutCode = storeCodes.find((store) => !store.code);
    if (storeWithoutCode) {
      toast({
        title: 'Store Code Required',
        description: `Enter a Store Code for ${storeWithoutCode.name || 'every store'} before saving.`,
        variant: 'destructive',
      });
      return;
    }

    const normalizedCodes = storeCodes.map((store) => store.code.toLowerCase());
    const duplicateCode = normalizedCodes.find(
      (code, index) => normalizedCodes.indexOf(code) !== index
    );

    if (duplicateCode) {
      const duplicateStore = storeCodes.find(
        (store) => store.code.toLowerCase() === duplicateCode
      );
      toast({
        title: 'Duplicate Store Code',
        description: `Store Code ${duplicateStore?.code || duplicateCode} is used more than once. Store Codes must be unique within the retail network.`,
        variant: 'destructive',
      });
      return;
    }

    if (!effectiveRetailerId || !db) {
        toast({ title: 'Error', description: 'Authoritative retailer context missing.', variant: 'destructive' });
        return;
    }

    setIsLoading(true);
    try {
      const docRef = doc(db, 'configurations', `${effectiveRetailerId}_org`);
      await setDoc(docRef, {
        retailerId: effectiveRetailerId,
        type: 'org',
        data: data,
        updatedAt: serverTimestamp()
      });
      
      // Retailer-only cleanup of historical browser migration state.
      if (!platformContext) {
        localStorage.removeItem('retail-organization-structure');
      }

      toast({
        title: 'Organization Saved',
        description: 'Network hierarchy synchronized with server.',
      });
    } catch (e: any) {
      toast({
        title: 'Save Failed',
        description: e.message || 'Firestore write error.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
      return (
          <div className="flex flex-col items-center justify-center p-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Retrieving Network Hierarchy...</p>
          </div>
      );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Retailer Identity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the identity used inside your authenticated Retailer MVP workspace. This is separate from shopper-facing Brand & Experience branding.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Retailer / Organisation Name</label>
            <Input
              {...form.register('retailerName')}
              placeholder="e.g. Woolworths"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Retailer MVP Logo</label>
            <p className="text-xs text-muted-foreground">
              This logo identifies your retailer inside the Retailer MVP. It does not change the shopper experience logo.
            </p>

            {form.watch('retailerLogoUrl') && (
              <div className="flex min-h-20 items-center rounded-md border bg-muted/30 p-4">
                <img
                  src={form.watch('retailerLogoUrl')}
                  alt="Retailer workspace logo"
                  className="max-h-14 max-w-[220px] object-contain"
                />
              </div>
            )}

            {platformContext ? (
              <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                Managed by the retailer through the Retailer MVP. Visible here for onboarding, support and verification.
              </p>
            ) : (
              <>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isLogoUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleRetailerLogoUpload(file);
                    event.target.value = '';
                  }}
                />

                {isLogoUploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading retailer logo...
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="text-primary" /> Setup My Network
        </h3>
        <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save Network Structure
        </Button>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Import Network Structure</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a complete retail network structure from CSV for larger rollouts.
            The imported hierarchy will replace the current unsaved network structure
            for review. Nothing is saved until you click Save Network Structure.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="file"
              accept=".csv,text/csv"
              className="sm:max-w-md"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleNetworkCsvImport(file);
                event.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadCsvTemplate}
            >
              Download CSV Template
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Required columns: brand, division, region, province, area,
            storeCode and storeName. Address is optional.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {brandFields.map((brand, index) => (
          <BrandNode 
            key={brand.id} 
            index={index} 
            control={form.control} 
            remove={() => removeBrand(index)}
            register={form.register}
          />
        ))}

        <Button 
          type="button" 
          variant="outline" 
          className="w-full h-16 border-dashed border-2 hover:border-primary hover:bg-primary/5"
          onClick={() => appendBrand({ id: crypto.randomUUID(), name: 'New Brand', divisions: [] })}
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Add Another Brand
        </Button>
      </div>
    </form>
  );
}

function BrandNode({ index, control, remove, register }: any) {
  const { fields: divisionFields, append: appendDivision, remove: removeDivision } = useFieldArray({
    control,
    name: `brands.${index}.divisions`,
  });

  return (
    <Card className="border-2 border-primary/10 shadow-md">
      <CardHeader className="bg-primary/5 flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-3 flex-1">
          <Globe className="text-primary h-5 w-5" />
          <Input 
            {...register(`brands.${index}.name`)} 
            placeholder="Brand Name (e.g. Woolworths)" 
            className="font-black text-lg bg-transparent border-none focus-visible:ring-0 p-0 h-auto"
          />
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={remove} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {divisionFields.map((division, dIndex) => (
          <DivisionNode 
            key={division.id} 
            brandIndex={index} 
            index={dIndex} 
            control={control} 
            remove={() => removeDivision(dIndex)}
            register={register}
          />
        ))}
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="w-full border border-dashed text-muted-foreground"
          onClick={() => appendDivision({ id: crypto.randomUUID(), name: 'New Division', regions: [] })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Division
        </Button>
      </CardContent>
    </Card>
  );
}

function DivisionNode({ brandIndex, index, control, remove, register }: any) {
  const { fields: regionFields, append: appendRegion, remove: removeRegion } = useFieldArray({
    control,
    name: `brands.${brandIndex}.divisions.${index}.regions`,
  });

  return (
    <div className="pl-4 border-l-2 border-primary/20 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary/60" />
        <Input 
          {...register(`brands.${brandIndex}.divisions.${index}.name`)} 
          placeholder="Division Name (e.g. Apparel)" 
          className="font-bold text-sm h-8"
        />
        <Button type="button" variant="ghost" size="icon" onClick={remove}><Trash2 className="h-3 w-3"/></Button>
      </div>
      <div className="pl-6 space-y-4">
        {regionFields.map((region, rIndex) => (
          <RegionNode 
            key={region.id}
            brandIndex={brandIndex}
            divisionIndex={index}
            index={rIndex}
            control={control}
            remove={() => removeRegion(rIndex)}
            register={register}
          />
        ))}
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => appendRegion({ id: crypto.randomUUID(), name: 'New Region', province: 'Gauteng', areas: [] })}
        >
          <PlusCircle className="mr-2 h-3 w-3" /> Add Region
        </Button>
      </div>
    </div>
  );
}

function RegionNode({ brandIndex, divisionIndex, index, control, remove, register }: any) {
    const { fields: areaFields, append: appendArea, remove: removeArea } = useFieldArray({
      control,
      name: `brands.${brandIndex}.divisions.${divisionIndex}.regions.${index}.areas`,
    });
  
    return (
      <div className="pl-4 border-l-2 border-slate-200 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Input 
            {...register(`brands.${brandIndex}.divisions.${divisionIndex}.regions.${index}.name`)} 
            placeholder="Region Name (e.g. Durban Region)" 
            className="font-semibold text-xs h-7"
          />
          <Controller
            control={control}
            name={`brands.${brandIndex}.divisions.${divisionIndex}.regions.${index}.province`}
            defaultValue="Gauteng"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-7 w-48 text-xs">
                  <SelectValue placeholder="Select Province" />
                </SelectTrigger>
                <SelectContent>
                  {SOUTH_AFRICAN_PROVINCES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={remove}><Trash2 className="h-3 w-3"/></Button>
        </div>
        <div className="pl-6 space-y-3">
          {areaFields.map((area, aIndex) => (
            <AreaNode 
              key={area.id}
              brandIndex={brandIndex}
              divisionIndex={divisionIndex}
              regionIndex={index}
              index={aIndex}
              control={control}
              remove={() => removeArea(aIndex)}
              register={register}
            />
          ))}
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => appendArea({ id: crypto.randomUUID(), name: 'New Area', stores: [] })}
          >
            <PlusCircle className="mr-2 h-3 w-3" /> Add Area
          </Button>
        </div>
      </div>
    );
}

function AreaNode({ brandIndex, divisionIndex, regionIndex, index, control, remove, register }: any) {
    const { fields: storeFields, append: appendStore, remove: removeStore } = useFieldArray({
      control,
      name: `brands.${brandIndex}.divisions.${divisionIndex}.regions.${regionIndex}.areas.${index}.stores`,
    });
  
    return (
      <div className="pl-4 border-l-2 border-slate-100 space-y-2">
        <div className="flex items-center gap-2">
          <Input 
            {...register(`brands.${brandIndex}.divisions.${divisionIndex}.regions.${regionIndex}.areas.${index}.name`)} 
            placeholder="Area Name (e.g. Sandton)" 
            className="text-[11px] h-6 italic"
          />
          <Button type="button" variant="ghost" size="icon" onClick={remove}><Trash2 className="h-3 w-3"/></Button>
        </div>
        <div className="pl-6 grid sm:grid-cols-2 gap-2">
          {storeFields.map((store, sIndex) => (
            <div
              key={store.id}
              className="sm:col-span-2 grid gap-2 rounded-md bg-muted/30 p-2 sm:grid-cols-[140px_1fr_1.5fr_auto]"
            >
              <div className="flex items-center gap-2">
                <Store className="h-3 w-3 shrink-0 text-muted-foreground" />
                <Input
                  {...register(`brands.${brandIndex}.divisions.${divisionIndex}.regions.${regionIndex}.areas.${index}.stores.${sIndex}.code`, {
                    required: 'Store code is required',
                  })}
                  placeholder="Store Code"
                  className="h-8 text-xs"
                />
              </div>
              <Input
                {...register(`brands.${brandIndex}.divisions.${divisionIndex}.regions.${regionIndex}.areas.${index}.stores.${sIndex}.name`)}
                placeholder="Store Name"
                className="h-8 text-xs"
              />
              <Input
                {...register(`brands.${brandIndex}.divisions.${divisionIndex}.regions.${regionIndex}.areas.${index}.stores.${sIndex}.address`)}
                placeholder="Address (optional)"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Remove store"
                onClick={() => removeStore(sIndex)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="text-[10px] h-6 border-dashed"
            onClick={() => appendStore({ id: crypto.randomUUID(), name: '', code: '', address: '' })}
          >
            <PlusCircle className="mr-1 h-3 w-3" /> Add Store
          </Button>
        </div>
      </div>
    );
}