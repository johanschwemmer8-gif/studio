
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Save, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  code: z.string().min(1, 'Store code is required'),
});

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  stores: z.array(storeSchema),
});

const formSchema = z.object({
  brands: z.array(brandSchema),
});

type FormValues = z.infer<typeof formSchema>;

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
    // Load saved data from localStorage when component mounts
    const savedData = localStorage.getItem('brandManagement');
    if (savedData) {
      form.reset(JSON.parse(savedData));
    }
  }, [form]);

  const onSubmit = (data: FormValues) => {
    // Save data to localStorage
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
          onClick={() => appendBrand({ name: '', stores: [] })}
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


// We extract the BrandCard into its own component to manage its fields correctly
function BrandCard({ brandIndex, removeBrand, control, register }: { brandIndex: number, removeBrand: (index: number) => void } & ReturnType<typeof useForm<FormValues>>) {
  const { fields: storeFields, append: appendStore, remove: removeStore } = useFieldArray({
    control,
    name: `brands.${brandIndex}.stores`,
  });

  return (
    <Card className="bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg">
          <Input
            {...register(`brands.${brandIndex}.name`)}
            placeholder="Brand Name"
            className="text-lg font-semibold p-0 h-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
      <CardContent className="space-y-4">
        <Label>Stores</Label>
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
          <Building2 className="mr-2" /> Add Store
        </Button>
      </CardContent>
    </Card>
  );
}
