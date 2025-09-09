
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, Save, Building2, Upload, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  code: z.string().min(1, 'Store code is required'),
});

const colorRegex = /^#[0-9a-f]{6}$/i;
const hexColorSchema = z.string().regex(colorRegex, "Must be a valid hex color");

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  logoUrl: z.string().url().or(z.literal('')),
  colors: z.object({
      primary: hexColorSchema,
      secondary: hexColorSchema,
      accent: hexColorSchema,
      background: hexColorSchema,
      foreground: hexColorSchema,
      destructive: hexColorSchema,
  }),
  stores: z.array(storeSchema),
});

const formSchema = z.object({
  brands: z.array(brandSchema),
});

type FormValues = z.infer<typeof formSchema>;

const defaultColors = {
    primary: '#0066ff',
    secondary: '#e5e7eb',
    accent: '#ffbf00',
    background: '#ffffff',
    foreground: '#0f172a',
    destructive: '#dc2626',
};

export default function BrandManagementForm() {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brands: [],
    },
  });

  const { fields: brandFields, append: appendBrand, remove: removeBrand } = useFieldArray({
    control: form.control,
    name: 'brands',
  });

  useEffect(() => {
    const savedData = localStorage.getItem('brandManagement');
    if (savedData) {
      form.reset(JSON.parse(savedData));
    }
  }, [form]);

  const onSubmit = (data: FormValues) => {
    localStorage.setItem('brandManagement', JSON.stringify(data));
    toast({
      title: 'Brands Saved!',
      description: 'Your brand and store structure has been updated.',
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {brandFields.map((brandField, brandIndex) => (
          <BrandCard
            key={brandField.id}
            brandIndex={brandIndex}
            removeBrand={removeBrand}
            {...form}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => appendBrand({ name: '', logoUrl: '', colors: defaultColors, stores: [] })}
        >
          <PlusCircle className="mr-2" /> Add Brand
        </Button>
        <Button type="submit">
          <Save className="mr-2" /> Save Configuration
        </Button>
      </div>
    </form>
  );
}

function BrandCard({ brandIndex, removeBrand, control, register, watch, setValue }: { brandIndex: number, removeBrand: (index: number) => void } & ReturnType<typeof useForm<FormValues>>) {
  const { fields: storeFields, append: appendStore, remove: removeStore } = useFieldArray({
    control,
    name: `brands.${brandIndex}.stores`,
  });

  const logoUrl = watch(`brands.${brandIndex}.logoUrl`);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const dataUrl = reader.result as string;
              setValue(`brands.${brandIndex}.logoUrl`, dataUrl, { shouldValidate: true });
          };
          reader.readAsDataURL(file);
      }
  };

  const colorFields: {name: keyof typeof defaultColors, label: string}[] = [
      { name: 'primary', label: 'Primary' },
      { name: 'secondary', label: 'Secondary' },
      { name: 'accent', label: 'Accent' },
      { name: 'background', label: 'Background' },
      { name: 'foreground', label: 'Foreground' },
      { name: 'destructive', label: 'Destructive' },
  ];


  return (
    <Card className="bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg">
          <Input
            {...register(`brands.${brandIndex}.name`)}
            placeholder="Brand Name"
            className="text-lg font-semibold p-0 h-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeBrand(brandIndex)}
        >
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Brand Styling Section */}
        <div className="space-y-4 p-4 border rounded-md bg-background/50">
            <h4 className="font-medium flex items-center gap-2"><Palette className="text-primary"/> Brand Styling</h4>
            <div className="space-y-2">
                <Label htmlFor={`logo-upload-${brandIndex}`} className="flex items-center gap-2"><Upload className="h-4 w-4"/> Logo</Label>
                 <div className="flex items-center gap-4">
                    {logoUrl && <Image src={logoUrl} alt="Brand Logo" width={40} height={40} className="rounded-md bg-slate-200 p-1" />}
                    <Input id={`logo-upload-${brandIndex}`} type="file" accept="image/*" onChange={handleLogoUpload} />
                </div>
            </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {colorFields.map(color => (
                     <div key={color.name} className="space-y-2">
                        <Label htmlFor={`${color.name}-color-${brandIndex}`}>{color.label}</Label>
                        <Input id={`${color.name}-color-${brandIndex}`} type="color" {...register(`brands.${brandIndex}.colors.${color.name}`)} className="p-1 h-10"/>
                    </div>
                ))}
            </div>
        </div>

        {/* Store Management Section */}
        <div className="space-y-4 p-4 border rounded-md bg-background/50">
            <h4 className="font-medium flex items-center gap-2"><Building2 className="text-primary"/> Stores</h4>
            <div className="space-y-2">
                {storeFields.map((storeField, storeIndex) => (
                    <div key={storeField.id} className="flex gap-2 items-center">
                        <Input
                            {...register(`brands.${brandIndex}.stores.${storeIndex}.name`)}
                            placeholder="Store Name"
                        />
                        <Input
                            {...register(`brands.${brandIndex}.stores.${storeIndex}.code`)}
                            placeholder="Store Code"
                            className="w-48"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStore(storeIndex)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendStore({ name: '', code: '' })}
            >
            <PlusCircle className="mr-2" /> Add Store
            </Button>
        </div>

      </CardContent>
    </Card>
  );
}
