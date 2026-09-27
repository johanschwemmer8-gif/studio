'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

export function OrganizationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
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
    if (!user?.retailerId || !db) return;

    const docRef = doc(db, 'configurations', `${user.retailerId}_org`);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        form.reset(ensureOrganizationIds(data.data));
      } else {
        // Migration fallback: check localStorage
        const saved = localStorage.getItem('retail-organization-structure');
        if (saved) {
          try {
            form.reset(ensureOrganizationIds(JSON.parse(saved)));
          } catch (e) {
            console.error('Failed to parse legacy org structure');
          }
        }
      }
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [user?.retailerId, form]);


  const handleRetailerLogoUpload = async (file: File) => {
    if (!user?.retailerId) return;

    setIsLogoUploading(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const storage = getStorage(getApp());
      const logoRef = ref(storage, `retailer-assets/${user.retailerId}/organization/retailer-logo-${Date.now()}.${extension}`);
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

  const onSubmit = async (data: OrganizationValues) => {
    if (!user?.retailerId || !db) {
        toast({ title: 'Error', description: 'Authentication context missing.', variant: 'destructive' });
        return;
    }

    setIsLoading(true);
    try {
      const docRef = doc(db, 'configurations', `${user.retailerId}_org`);
      await setDoc(docRef, {
        retailerId: user.retailerId,
        type: 'org',
        data: data,
        updatedAt: serverTimestamp()
      });
      
      // Clean up legacy storage once migrated
      localStorage.removeItem('retail-organization-structure');

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
            <div key={store.id} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md group">
               <Store className="h-3 w-3 text-muted-foreground shrink-0" />
               <Input 
                {...register(`brands.${brandIndex}.divisions.${divisionIndex}.regions.${regionIndex}.areas.${index}.stores.${sIndex}.name`)} 
                placeholder="Store Name" 
                className="text-[11px] h-6 bg-transparent border-none focus-visible:ring-0 p-0"
              />
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeStore(sIndex)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="text-[10px] h-6 border-dashed"
            onClick={() => appendStore({ id: crypto.randomUUID(), name: '' })}
          >
            <PlusCircle className="mr-1 h-3 w-3" /> Add Store
          </Button>
        </div>
      </div>
    );
}