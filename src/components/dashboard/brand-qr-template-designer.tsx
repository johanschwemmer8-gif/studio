
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Square, Circle, Dot, Eye, Upload, Image as ImageIcon, Eraser, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { saveQrTemplate } from '@/ai/flows/save-qr-template';
import Image from 'next/image';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';

const templateDesignerSchema = z.object({
  brandId: z.string().min(1, 'Brand is required'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  qrShape: z
    .enum([
      'square',
      'rounded',
      'dot',
      'extra-rounded',
      'classy',
      'classy-rounded',
      'top-left-rounded',
      'top-right-rounded',
      'bottom-left-rounded',
      'bottom-right-rounded',
      'diamond',
      'heart',
      'star',
    ])
    .default('square'),
  colorHex: z.string().default('#000000'),
  bgColorHex: z.string().default('#FFFFFF'),
  gradient: z.object({
    active: z.boolean().default(false),
    from: z.string().default('#000000'),
    to: z.string().default('#000000'),
    angle: z.number().min(0).max(360).default(0),
  }).optional(),
  eyeStyle: z.enum(['square', 'rounded', 'leaf']).default('square'),
  eyeColors: z.object({
    outer: z.string().optional(),
    inner: z.string().optional(),
  }).optional(),
  logoDataUrl: z.string().optional(),
  logoSizeRatio: z.number().min(0.1).max(0.3).default(0.2),
  backgroundImageDataUrl: z.string().optional(),
  backgroundImageOpacity: z.number().min(0).max(1).default(1),
  backgroundImageMode: z.enum(['cover', 'tile', 'contain']).default('cover'),
  quietZone: z.number().min(0).max(50).default(10),
  exportFormats: z.array(z.enum(['PNG', 'SVG', 'PDF'])).default(['PNG']),
  dpi: z.enum(['150', '300', '600']).default('300'),
});

type TemplateDesignerValues = z.infer<typeof templateDesignerSchema>;

type BrandQrTemplateDesignerProps = {
  templateId?: string;
  onSave: () => void;
  onCancel: () => void;
};

function LivePreview({ settings }: { settings: Partial<TemplateDesignerValues> }) {
  const { colorHex, bgColorHex, qrShape, eyeStyle, logoDataUrl, logoSizeRatio, gradient, backgroundImageDataUrl, backgroundImageOpacity } = settings;

  const getShapeStyles = (): React.CSSProperties => {
    switch (qrShape) {
      case 'square': return { borderRadius: '0.25rem' };
      case 'rounded': return { borderRadius: '1.5rem' };
      case 'extra-rounded': return { borderRadius: '50%' };
      case 'classy': return { borderRadius: '0.5rem 0.5rem 1.5rem 0.5rem' };
      case 'classy-rounded': return { borderRadius: '1.5rem 0.5rem 1.5rem 0.5rem' };
      case 'top-left-rounded': return { borderRadius: '1.5rem 0.25rem 0.25rem 0.25rem' };
      case 'top-right-rounded': return { borderRadius: '0.25rem 1.5rem 0.25rem 0.25rem' };
      case 'bottom-left-rounded': return { borderRadius: '0.25rem 0.25rem 0.25rem 1.5rem' };
      case 'bottom-right-rounded': return { borderRadius: '0.25rem 0.25rem 1.5rem 0.25rem' };
      case 'diamond': return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
      case 'heart': return { clipPath: 'path("M 96 40 C 96 21 81 6 64 6 C 53 6 44 11 38 19 L 32 28 L 26 19 C 20 11 11 6 0 6 C -17 6 -32 21 -32 40 C -32 68 -2 88 32 115 L 32 115 L 32 115 C 66 88 96 68 96 40 Z")' };
      case 'star': return { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
      case 'dot':
      default:
        return { borderRadius: '0.25rem' };
    }
  };

  const shapeStyles = getShapeStyles();
  
  const eyeShapeStyles: React.CSSProperties = {
    square: { borderRadius: 0 },
    rounded: { borderRadius: '0.5rem' },
    leaf: { borderRadius: '0.5rem 0 0.5rem 0' },
  }[eyeStyle || 'square'];
  
  const innerEyeShapeStyles: React.CSSProperties = {
    square: { borderRadius: 0 },
    rounded: { borderRadius: '0.25rem' },
     leaf: { borderRadius: '0.25rem 0 0.25rem 0' },
  }[eyeStyle || 'square'];
  
  const foregroundStyle = gradient?.active 
    ? { background: `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})` }
    : { backgroundColor: colorHex };


  return (
    <Card className="sticky top-0">
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
        <CardDescription>A real-time preview of your QR code style.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-4">
        <div 
          className="w-48 h-48 border-4 flex items-center justify-center relative overflow-hidden"
          style={{ 
            backgroundColor: bgColorHex,
            ...shapeStyles,
            borderColor: ['diamond', 'heart', 'star'].includes(qrShape || '') ? 'transparent' : colorHex,
          }}
        >
          {backgroundImageDataUrl && (
              <Image src={backgroundImageDataUrl} alt="background" layout="fill" objectFit={settings.backgroundImageMode} style={{ opacity: backgroundImageOpacity }} />
          )}
          <div className="absolute top-1 left-1 w-10 h-10 border-2 z-10" style={{ backgroundColor: bgColorHex, borderColor: settings.eyeColors?.outer || colorHex, ...eyeShapeStyles }}>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ backgroundColor: settings.eyeColors?.inner || colorHex, ...innerEyeShapeStyles }}></div>
          </div>
          <div className="absolute top-1 right-1 w-10 h-10 border-2 z-10" style={{ backgroundColor: bgColorHex, borderColor: settings.eyeColors?.outer || colorHex, ...eyeShapeStyles }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ backgroundColor: settings.eyeColors?.inner || colorHex, ...innerEyeShapeStyles }}></div>
          </div>
           <div className="absolute bottom-1 left-1 w-10 h-10 border-2 z-10" style={{ backgroundColor: bgColorHex, borderColor: settings.eyeColors?.outer || colorHex, ...eyeShapeStyles }}>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ backgroundColor: settings.eyeColors?.inner || colorHex, ...innerEyeShapeStyles }}></div>
          </div>
          {logoDataUrl && (
            <div className="absolute inset-0 flex items-center justify-center z-20" style={{ transform: `scale(${logoSizeRatio})`}}>
              <Image src={logoDataUrl} alt="logo preview" width={100} height={100} objectFit="contain" />
            </div>
          )}
           {qrShape === 'dot' ? <Circle className="w-16 h-16 relative z-10" style={{ color: colorHex }} fill={colorHex} /> : <div className="w-24 h-24 relative z-10" style={foregroundStyle} />}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomFormItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn('space-y-2', className)}>{children}</div>;

export default function BrandQrTemplateDesigner({
  templateId,
  onSave,
  onCancel,
}: BrandQrTemplateDesignerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TemplateDesignerValues>({
    resolver: zodResolver(templateDesignerSchema),
    defaultValues: {
      brandId: '',
      name: '',
      description: '',
      qrShape: 'square',
      colorHex: '#000000',
      bgColorHex: '#FFFFFF',
      gradient: { active: false, from: '#000000', to: '#000000', angle: 0},
      eyeStyle: 'square',
      logoDataUrl: '',
      logoSizeRatio: 0.2,
      backgroundImageDataUrl: '',
      backgroundImageOpacity: 1,
      backgroundImageMode: 'cover',
      quietZone: 10,
      exportFormats: ['PNG'],
      dpi: '300'
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (templateId) {
      // In a real app, fetch template data from Firestore
      console.log(`Editing template: ${templateId}`);
      // form.reset(fetchedTemplateData);
    }
  }, [templateId, form]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoDataUrl' | 'backgroundImageDataUrl') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              form.setValue(field, reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const onSubmit = async (data: TemplateDesignerValues) => {
    setIsLoading(true);
    try {
      const result = await saveQrTemplate({
          retailerId: 'simulated-retailer-id',
          name: data.name,
          description: data.description,
          defaults: data,
      });

      if (result.success) {
          toast({
              title: 'Template Saved!',
              description: `The template "${data.name}" has been successfully saved.`,
          });
          onSave();
      } else {
          throw new Error('Failed to save template.');
      }
    } catch (error: any) {
      toast({
        title: 'Error Saving Template',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const isGradientActive = useWatch({ control: form.control, name: 'gradient.active' });

  return (
      <div className="md:grid md:grid-cols-3 md:gap-8">
        <div className="md:col-span-2 space-y-8 md:max-h-[80vh] md:overflow-y-auto md:pr-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Controller name="brandId" control={form.control} render={({ field }) => (
                            <CustomFormItem>
                                <Label>Brand</Label>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select a brand..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="simulated-retailer-id">My Brand</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CustomFormItem>
                        )}/>
                        <CustomFormItem>
                           <Label htmlFor="templateName">Template Name</Label>
                           <Input id="templateName" placeholder="e.g., Summer Sale Style" {...form.register('name')} />
                        </CustomFormItem>
                    </div>
                     <CustomFormItem>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="A brief description of this template." {...form.register('description')} />
                    </CustomFormItem>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Palette />Foreground Styling</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <CustomFormItem>
                     <div className="flex items-center gap-2">
                        <Controller name="gradient.active" control={form.control} render={({ field }) => <Checkbox id="gradient-active" checked={field.value} onCheckedChange={field.onChange} />} />
                        <Label htmlFor="gradient-active">Enable Gradient</Label>
                     </div>
                   </CustomFormItem>

                   {isGradientActive ? (
                     <div className="space-y-4 p-4 border rounded-md">
                        <div className="grid md:grid-cols-2 gap-4">
                           <CustomFormItem>
                                <Label htmlFor="gradient-from">From</Label>
                                <Input id="gradient-from" type="color" {...form.register('gradient.from')} />
                           </CustomFormItem>
                          <CustomFormItem>
                                <Label htmlFor="gradient-to">To</Label>
                                <Input id="gradient-to" type="color" {...form.register('gradient.to')} />
                          </CustomFormItem>
                        </div>
                        <CustomFormItem>
                            <Label>Angle</Label>
                          <Controller name="gradient.angle" control={form.control} render={({ field }) => (
                              <Slider min={0} max={360} step={1} value={[field.value ?? 0]} onValueChange={(v) => field.onChange(v[0])} />
                          )} />
                        </CustomFormItem>
                     </div>
                   ) : (
                       <CustomFormItem>
                           <Label htmlFor="colorHex">Foreground Color</Label>
                           <Input id="colorHex" type="color" {...form.register('colorHex')} />
                       </CustomFormItem>
                   )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>QR Styling</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <CustomFormItem>
                        <Label>QR Code Shape</Label>
                         <Controller name="qrShape" control={form.control} render={({ field }) => (
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4 pt-2">
                                {(['square', 'rounded', 'extra-rounded', 'dot', 'classy', 'classy-rounded', 'top-left-rounded', 'top-right-rounded', 'bottom-left-rounded', 'bottom-right-rounded', 'diamond', 'heart', 'star'] as const).map(shape => (
                                    <CustomFormItem key={shape}>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value={shape} id={`shape-${shape}`} />
                                            <Label htmlFor={`shape-${shape}`} className="capitalize font-normal">{shape.replace(/-/g, ' ')}</Label>
                                        </div>
                                    </CustomFormItem>
                                ))}
                            </RadioGroup>
                         )} />
                    </CustomFormItem>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader><CardTitle className="flex items-center gap-2"><Eye /> Eye Styling</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                     <CustomFormItem>
                         <Label>Eye Shape</Label>
                         <Controller name="eyeStyle" control={form.control} render={({ field }) => (
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                {(['square', 'rounded', 'leaf'] as const).map(style => (
                                    <CustomFormItem key={style}>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value={style} id={`eye-${style}`} />
                                            <Label htmlFor={`eye-${style}`} className="capitalize font-normal">{style}</Label>
                                        </div>
                                    </CustomFormItem>
                                ))}
                            </RadioGroup>
                         )} />
                    </CustomFormItem>
                     <div className="grid md:grid-cols-2 gap-4">
                        <CustomFormItem>
                            <Label htmlFor="eye-outer">Outer Eye Color</Label>
                            <Input id="eye-outer" type="color" {...form.register('eyeColors.outer')} />
                        </CustomFormItem>
                        <CustomFormItem>
                            <Label htmlFor="eye-inner">Inner Eye Color</Label>
                            <Input id="eye-inner" type="color" {...form.register('eyeColors.inner')} />
                        </CustomFormItem>
                    </div>
                </CardContent>
            </Card>

             <Card>
                 <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon /> Branding</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <CustomFormItem>
                         <Label htmlFor="logo-upload">Upload Logo</Label>
                         <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleFileUpload(e, 'logoDataUrl')} />
                     </CustomFormItem>
                     {watchedValues.logoDataUrl && (
                        <CustomFormItem>
                             <Label>Logo Size</Label>
                             <Controller name="logoSizeRatio" control={form.control} render={({ field }) => (
                                <Slider min={0.1} max={0.3} step={0.05} value={[field.value ?? 0.2]} onValueChange={(v) => field.onChange(v[0])} />
                             )} />
                        </CustomFormItem>
                     )}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader><CardTitle>Background</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                      <CustomFormItem>
                           <Label htmlFor="bgColorHex">Background Color</Label>
                           <Input id="bgColorHex" type="color" {...form.register('bgColorHex')} />
                      </CustomFormItem>
                      <CustomFormItem>
                         <Label htmlFor="bg-image-upload">Background Image</Label>
                         <Input id="bg-image-upload" type="file" accept="image/png, image/jpeg" onChange={(e) => handleFileUpload(e, 'backgroundImageDataUrl')} />
                      </CustomFormItem>
                      {watchedValues.backgroundImageDataUrl && (
                          <div className="space-y-4 p-4 border rounded-md">
                             <CustomFormItem>
                                <Label>Opacity</Label>
                                 <Controller name="backgroundImageOpacity" control={form.control} render={({ field }) => (
                                    <Slider min={0} max={1} step={0.1} value={[field.value ?? 1]} onValueChange={(v) => field.onChange(v[0])} />
                                 )} />
                            </CustomFormItem>
                             <CustomFormItem>
                                 <Label>Image Mode</Label>
                                 <Controller name="backgroundImageMode" control={form.control} render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                        {(['cover', 'tile', 'contain'] as const).map(mode => (
                                            <CustomFormItem key={mode}>
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem value={mode} id={`bg-mode-${mode}`} />
                                                    <Label htmlFor={`bg-mode-${mode}`} className="capitalize font-normal">{mode}</Label>
                                                </div>
                                            </CustomFormItem>
                                        ))}
                                    </RadioGroup>
                                 )} />
                            </CustomFormItem>
                          </div>
                      )}
                 </CardContent>
            </Card>
            
            <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {templateId ? 'Update' : 'Save'} Template
                </Button>
            </div>
          </form>
        </div>
        <div className="md:col-span-1">
          <LivePreview settings={watchedValues} />
        </div>
      </div>
  );
}
