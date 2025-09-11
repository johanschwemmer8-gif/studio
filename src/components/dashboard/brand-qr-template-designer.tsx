
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  qrShape: z.enum(['square', 'rounded', 'dot', 'extra-rounded', 'classy']).default('square'),
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

  const shapeStyles: React.CSSProperties = {
    square: { borderRadius: '0.25rem' },
    rounded: { borderRadius: '1.5rem' },
    'extra-rounded': { borderRadius: '50%' },
    classy: { borderRadius: '0.5rem 0.5rem 1.5rem 0.5rem' },
    dot: {}
  }[qrShape || 'square'];
  
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
            borderColor: colorHex,
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
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Controller name="brandId" control={form.control} render={({ field }) => (
                            <FormItem field={field} label="Brand">
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select a brand..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="simulated-retailer-id">My Brand</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}/>
                        <FormItem field={form.register('name')} label="Template Name">
                            <Input placeholder="e.g., Summer Sale Style" />
                        </FormItem>
                    </div>
                     <FormItem field={form.register('description')} label="Description">
                        <Textarea placeholder="A brief description of this template." />
                    </FormItem>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Palette />Foreground Styling</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <FormItem field={form.register('gradient.active')} label="Enable Gradient">
                     <Controller name="gradient.active" control={form.control} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />} />
                   </FormItem>

                   {isGradientActive ? (
                     <div className="space-y-4 p-4 border rounded-md">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormItem field={form.register('gradient.from')} label="From" type="color" />
                          <FormItem field={form.register('gradient.to')} label="To" type="color" />
                        </div>
                        <FormItem field={form.register('gradient.angle')} label="Angle">
                          <Controller name="gradient.angle" control={form.control} render={({ field }) => (
                              <Slider min={0} max={360} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                          )} />
                        </FormItem>
                     </div>
                   ) : (
                      <FormItem field={form.register('colorHex')} label="Foreground Color" type="color" />
                   )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>QR Styling</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <FormItem field={form.register('qrShape')} label="QR Code Shape">
                         <Controller name="qrShape" control={form.control} render={({ field }) => (
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                                <FormItem field={field} label="Square" value="square" type="radio" />
                                <FormItem field={field} label="Rounded" value="rounded" type="radio" />
                                <FormItem field={field} label="Extra Rounded" value="extra-rounded" type="radio" />
                                <FormItem field={field} label="Classy" value="classy" type="radio" />
                                <FormItem field={field} label="Dots" value="dot" type="radio" />
                            </RadioGroup>
                         )} />
                    </FormItem>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader><CardTitle className="flex items-center gap-2"><Eye /> Eye Styling</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                     <FormItem field={form.register('eyeStyle')} label="Eye Shape">
                         <Controller name="eyeStyle" control={form.control} render={({ field }) => (
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                <FormItem field={field} label="Square" value="square" type="radio" />
                                <FormItem field={field} label="Rounded" value="rounded" type="radio" />
                                <FormItem field={field} label="Leaf" value="leaf" type="radio" />
                            </RadioGroup>
                         )} />
                    </FormItem>
                     <div className="grid md:grid-cols-2 gap-4">
                        <FormItem field={form.register('eyeColors.outer')} label="Outer Eye Color" type="color" />
                        <FormItem field={form.register('eyeColors.inner')} label="Inner Eye Color" type="color" />
                    </div>
                </CardContent>
            </Card>

             <Card>
                 <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon /> Branding</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <FormItem field={form.register('logoDataUrl')} label="Upload Logo">
                         <Input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleFileUpload(e, 'logoDataUrl')} />
                     </FormItem>
                     {watchedValues.logoDataUrl && (
                        <FormItem field={form.register('logoSizeRatio')} label="Logo Size">
                             <Controller name="logoSizeRatio" control={form.control} render={({ field }) => (
                                <Slider min={0.1} max={0.3} step={0.05} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                             )} />
                        </FormItem>
                     )}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader><CardTitle>Background</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                      <FormItem field={form.register('bgColorHex')} label="Background Color" type="color" />
                      <FormItem field={form.register('backgroundImageDataUrl')} label="Background Image">
                         <Input type="file" accept="image/png, image/jpeg" onChange={(e) => handleFileUpload(e, 'backgroundImageDataUrl')} />
                      </FormItem>
                      {watchedValues.backgroundImageDataUrl && (
                          <div className="space-y-4 p-4 border rounded-md">
                             <FormItem field={form.register('backgroundImageOpacity')} label="Opacity">
                                 <Controller name="backgroundImageOpacity" control={form.control} render={({ field }) => (
                                    <Slider min={0} max={1} step={0.1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                                 )} />
                            </FormItem>
                             <FormItem field={form.register('backgroundImageMode')} label="Image Mode">
                                 <Controller name="backgroundImageMode" control={form.control} render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                        <FormItem field={field} label="Cover" value="cover" type="radio" />
                                        <FormItem field={field} label="Tile" value="tile" type="radio" />
                                        <FormItem field={field} label="Contain" value="contain" type="radio" />
                                    </RadioGroup>
                                 )} />
                            </FormItem>
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

function FormItem({ field, label, children, value, type }: { field: any, label: string, children?: React.ReactNode, value?: string, type?: string }) {
    const itemContent = (() => {
        if (type === 'radio') {
            return (
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value={value!} id={`${field.name}-${value}`} />
                    <Label htmlFor={`${field.name}-${value}`} className="font-normal">{label}</Label>
                </div>
            );
        }
        if (type === 'color') {
            return (
                <div className="space-y-2">
                    <Label htmlFor={field.name}>{label}</Label>
                    <div className="flex items-center gap-2">
                        <Input id={field.name} type="color" className="w-12 h-10 p-1" {...field} />
                        <Input className="flex-1" {...field} />
                    </div>
                </div>
            );
        }
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <Label htmlFor={field.name}>{label}</Label>
                   {field.name === 'gradient.active' && <span className="text-xs text-muted-foreground">Enable to use gradients</span>}
                </div>
                {children}
            </div>
        );
    })();

    return <div className="w-full">{itemContent}</div>;
}
