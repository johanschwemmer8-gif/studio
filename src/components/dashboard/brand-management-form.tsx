
'use client';

import { useForm, useFieldArray, Control, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2, Save, Building2, Upload, Palette, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const colorRegex = /^#[0-9a-f]{6}$/i;
const hexColorSchema = z.string().regex(colorRegex, "Must be a valid hex color");

// Simplified schema for a single supplier brand
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
  advertisement: z.object({
      type: z.enum(['image', 'video']).optional(),
      url: z.string().url("Must be a valid URL").or(z.literal('')).optional(),
  }).optional(),
});

const formSchema = z.object({
  brands: z.array(brandSchema),
});

export type FormValues = z.infer<typeof formSchema>;
type BrandForm = ReturnType<typeof useForm<FormValues>>;

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
      try {
        const parsedData = JSON.parse(savedData);
        // Ensure the loaded data structure matches the new simplified one
        if (parsedData.brands && Array.isArray(parsedData.brands)) {
            const sanitizedBrands = parsedData.brands.map((brand: any) => ({
                name: brand.name || '',
                logoUrl: brand.logoUrl || '',
                colors: brand.colors || defaultColors,
                advertisement: brand.advertisement || { type: 'image', url: '' },
            }));
            form.reset({ brands: sanitizedBrands });
        }
      } catch (error) {
        console.error("Failed to parse brand management data from localStorage", error);
      }
    }
  }, [form]);

  const onSubmit = (data: FormValues) => {
    localStorage.setItem('brandManagement', JSON.stringify(data));
    toast({
      title: 'Supplier Brands Saved!',
      description: 'Your supplier brand information has been updated.',
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
       <Card>
        <CardHeader>
            <CardTitle>Supplier Brand Management</CardTitle>
            <CardDescription>
                Define your supplier brands, their specific branding (logo, colors), and advertisement media.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {brandFields.map((brandField, brandIndex) => (
            <BrandCard
                key={brandField.id}
                brandIndex={brandIndex}
                removeBrand={removeBrand}
                {...form}
            />
            ))}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <Button
            type="button"
            variant="outline"
            onClick={() => appendBrand({ name: '', logoUrl: '', colors: defaultColors, advertisement: { type: 'image', url: '' } })}
            >
            <PlusCircle className="mr-2" /> Add Supplier Brand
            </Button>
            <Button type="submit">
            <Save className="mr-2" /> Save Configuration
            </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function BrandCard({ brandIndex, removeBrand, ...form }: { brandIndex: number, removeBrand: (index: number) => void } & BrandForm) {
  const { control, register, watch, setValue } = form;
  
  const logoUrl = watch(`brands.${brandIndex}.logoUrl`);
  const adUrl = watch(`brands.${brandIndex}.advertisement.url`);
  const adType = watch(`brands.${brandIndex}.advertisement.type`);

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
        <CardTitle className="text-lg flex-grow">
          <Input
            {...register(`brands.${brandIndex}.name`)}
            placeholder="Supplier Brand Name"
            className="text-lg font-semibold p-0 h-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
        </CardTitle>
        <Button type="button" variant="ghost" size="icon" onClick={() => removeBrand(brandIndex)}>
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

        {/* Advertisement Section */}
         <div className="space-y-4 p-4 border rounded-md bg-background/50">
            <h4 className="font-medium flex items-center gap-2"><Video className="text-primary"/> Brand Advertisement</h4>
            <div className="space-y-2">
                <Label>Advertisement Type</Label>
                <Controller
                    control={control}
                    name={`brands.${brandIndex}.advertisement.type`}
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                            <Label htmlFor={`ad-type-image-${brandIndex}`} className="flex items-center gap-2 cursor-pointer">
                                <RadioGroupItem value="image" id={`ad-type-image-${brandIndex}`} />
                                Image
                            </Label>
                            <Label htmlFor={`ad-type-video-${brandIndex}`} className="flex items-center gap-2 cursor-pointer">
                                <RadioGroupItem value="video" id={`ad-type-video-${brandIndex}`} />
                                Video
                            </Label>
                        </RadioGroup>
                    )}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`advertisement-url-${brandIndex}`}>Advertisement Media URL</Label>
                <Input
                    id={`advertisement-url-${brandIndex}`}
                    placeholder="https://example.com/ad.mp4"
                    {...register(`brands.${brandIndex}.advertisement.url`)}
                />
            </div>
            {adUrl && (
                <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden relative border">
                        {adType === 'image' ? (
                            <Image src={adUrl} alt="Ad Preview" layout="fill" objectFit="contain" />
                        ) : (
                            <video key={adUrl} controls src={adUrl} className="w-full h-full object-contain bg-black" />
                        )}
                    </div>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
