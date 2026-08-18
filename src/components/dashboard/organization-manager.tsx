'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  PlusCircle, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Store, 
  MapPin, 
  Globe, 
  Layers,
  Save,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  code: z.string().optional(),
  address: z.string().optional(),
});

const areaSchema = z.object({
  name: z.string().min(1, 'Area name is required'),
  stores: z.array(storeSchema).default([]),
});

const regionSchema = z.object({
  name: z.string().min(1, 'Region name is required'),
  areas: z.array(areaSchema).default([]),
});

const divisionSchema = z.object({
  name: z.string().min(1, 'Division name is required'),
  regions: z.array(regionSchema).default([]),
});

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  divisions: z.array(divisionSchema).default([]),
});

const organizationSchema = z.object({
  brands: z.array(brandSchema),
});

type OrganizationValues = z.infer<typeof organizationSchema>;

export function OrganizationManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      brands: [
        { 
          name: 'Default Brand', 
          divisions: [
            { 
              name: 'Main Division', 
              regions: [
                { name: 'Gauteng', areas: [{ name: 'Sandton', stores: [{ name: 'Sandton City' }] }] }
              ] 
            }
          ] 
        }
      ],
    },
  });

  const { fields: brandFields, append: appendBrand, remove: removeBrand } = useFieldArray({
    control: form.control,
    name: 'brands',
  });

  useEffect(() => {
    const saved = localStorage.getItem('retail-organization-structure');
    if (saved) {
      try {
        form.reset(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load org structure');
      }
    }
  }, [form]);

  const onSubmit = (data: OrganizationValues) => {
    setIsLoading(true);
    localStorage.setItem('retail-organization-structure', JSON.stringify(data));
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Organization Saved',
        description: 'Your retail hierarchy has been updated across the platform.',
      });
    }, 800);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
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
          onClick={() => appendBrand({ name: 'New Brand', divisions: [] })}
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
          onClick={() => appendDivision({ name: 'New Division', regions: [] })}
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
          onClick={() => appendRegion({ name: 'New Region', areas: [] })}
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
            placeholder="Region Name (e.g. Western Cape)" 
            className="font-semibold text-xs h-7"
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
            onClick={() => appendArea({ name: 'New Area', stores: [] })}
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
            onClick={() => appendStore({ name: '' })}
          >
            <PlusCircle className="mr-1 h-3 w-3" /> Add Store
          </Button>
        </div>
      </div>
    );
}
