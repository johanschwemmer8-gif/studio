
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, Palette, Save } from 'lucide-react';
import Image from 'next/image';
import themeConfig from '@/config/theme.json';

const colorToHex = (hsl: string) => {
  if (!hsl || typeof hsl !== 'string') return '#000000';
  const match = hsl.match(/(\d+)\s*(\d+)%\s*(\d+)%/);
  if (!match) return '#000000';
  
  const [, h, s, l] = match.map(Number);
  const s_norm = s / 100;
  const l_norm = l / 100;
  const a = s_norm * Math.min(l_norm, 1 - l_norm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l_norm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHsl = (hex: string) => {
  if (!hex || typeof hex !== 'string' || !hex.match(/^#[0-9a-f]{6}$/i)) return "0 0% 0%";
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
};


const formSchema = z.object({
  logoUrl: z.string().url().or(z.literal('')),
  colors: z.array(z.object({
    name: z.string(),
    value: z.string().regex(/^#[0-9a-f]{6}$/i, "Must be a valid hex color"),
  })),
});

type FormValues = z.infer<typeof formSchema>;

export default function BrandSettingsForm() {
  const { toast } = useToast();
  const [currentLogo, setCurrentLogo] = useState('');

  const getInitialFormValues = () => {
    const savedTheme = localStorage.getItem('globalBrandSettings');
    const theme = savedTheme ? JSON.parse(savedTheme) : themeConfig;

    const colors = Object.entries(theme.brandColors).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: colorToHex(value as string),
    }));

    return {
        logoUrl: theme.logoUrl,
        colors,
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialFormValues(),
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "colors",
  });

  useEffect(() => {
    // Set initial logo from loaded config
    setCurrentLogo(form.getValues('logoUrl'));

    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('colors')) {
        const colors = value.colors as {name: string, value: string}[];
        colors.forEach(color => {
          const variableName = `--${color.name.toLowerCase()}`;
          const hslValue = hexToHsl(color.value);
          document.documentElement.style.setProperty(variableName, hslValue);
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (data: FormValues) => {
    const newThemeConfig = { ...themeConfig };
    
    newThemeConfig.logoUrl = data.logoUrl;
    
    data.colors.forEach(color => {
        const key = color.name.toLowerCase() as keyof typeof newThemeConfig.brandColors;
        if(key in newThemeConfig.brandColors) {
            newThemeConfig.brandColors[key] = hexToHsl(color.value);
        }
    });

    localStorage.setItem('globalBrandSettings', JSON.stringify(newThemeConfig));

    toast({
      title: 'Theme Saved!',
      description: 'Your brand settings have been updated.',
    });
  };
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const dataUrl = reader.result as string;
              setCurrentLogo(dataUrl);
              form.setValue('logoUrl', dataUrl, { shouldValidate: true });
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="text-primary" /> Logo Upload
          </CardTitle>
          <CardDescription>
            Upload your company logo. It will be displayed in the sidebar. Recommended size: 24x24 pixels.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          {currentLogo && (
            <Image
              src={currentLogo}
              alt="Current Logo"
              width={48}
              height={48}
              className="rounded-full bg-muted p-1"
            />
          )}
          <div className="flex-1">
             <Label htmlFor="logo-upload" className="sr-only">Upload Logo</Label>
             <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="text-primary" /> Brand Colors
          </CardTitle>
           <CardDescription>
            Adjust the primary colors to match your brand identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`color-${field.name}`}>{field.name}</Label>
              <div className="flex items-center gap-2">
                 <Input
                    id={`color-${field.name}`}
                    type="color"
                    className="w-12 h-10 p-1"
                    {...form.register(`colors.${index}.value`)}
                 />
                <Input
                    className="flex-1"
                    {...form.register(`colors.${index}.value`)}
                />
              </div>
              {form.formState.errors.colors?.[index]?.value && (
                  <p className="text-sm text-destructive">{form.formState.errors.colors[index]?.value?.message}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" size="lg">
        <Save className="mr-2" />
        Save Brand Settings
      </Button>
    </form>
  );
}
