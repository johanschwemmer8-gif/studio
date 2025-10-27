
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, Save, Image as ImageIcon, Palette, LayoutTemplate } from 'lucide-react';
import PhoneMockup from '@/components/dashboard/phone-mockup';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Template1, Template2, Template3, Template4, Template5, Template6, Template7, Template8, Template9 } from '@/components/dashboard/ui-templates';

function MobileLandingPagePreview({ selectedTemplate }: { selectedTemplate: string }) {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoWidth, setLogoWidth] = useState(128);
    const [logoAlign, setLogoAlign] = useState('flex-start');
    const [logoPadding, setLogoPadding] = useState(0);

    useEffect(() => {
        const updatePreview = () => {
            const savedLandingLogo = localStorage.getItem('landing-page-logo');
            setLogoPreview(savedLandingLogo);
            const savedLandingWidth = localStorage.getItem('landing-page-logo-width');
            setLogoWidth(Number(savedLandingWidth || 128));
            const savedLandingAlign = localStorage.getItem('landing-page-logo-align');
            setLogoAlign(savedLandingAlign || 'flex-start');
            const savedLandingPadding = localStorage.getItem('landing-page-logo-padding');
            setLogoPadding(Number(savedLandingPadding || 0));
        };
        
        updatePreview(); // Initial load
        
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key?.startsWith('landing-page-logo')) {
                updatePreview();
            }
        };

        const handleCustomEvent = (e: Event) => {
            const detail = (e as CustomEvent).detail;
             if (detail.key.startsWith('landing-page-logo')) {
                updatePreview();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('logoUpdated', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('logoUpdated', handleCustomEvent);
        };
    }, []);

    const logoContainerClass = cn('w-full px-4 text-center', {
      'text-left': logoAlign === 'flex-start',
      'text-center': logoAlign === 'center',
      'text-right': logoAlign === 'flex-end',
    });
    
    const headerStyle: React.CSSProperties = {
      paddingTop: `${logoPadding}px`,
      paddingBottom: `${logoPadding}px`,
    };

    const renderTemplate = () => {
        const props = { logoPreview, logoWidth, logoAlign, logoPadding };
        switch(selectedTemplate) {
            case 'template1': return <Template1 {...props} />;
            case 'template2': return <Template2 {...props} />;
            case 'template3': return <Template3 {...props} />;
            case 'template4': return <Template4 {...props} />;
            case 'template5': return <Template5 {...props} />;
            case 'template6': return <Template6 {...props} />;
            case 'template7': return <Template7 {...props} />;
            case 'template8': return <Template8 {...props} />;
            case 'template9': return <Template9 {...props} />;
            default: return <Template1 {...props} />;
        }
    }

    return (
        <div className="bg-background text-foreground h-full w-full overflow-y-auto">
           {renderTemplate()}
        </div>
    );
}


export default function UiManagementPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoWidth, setLogoWidth] = useState(128);
  const [logoAlign, setLogoAlign] = useState('flex-start');
  const [logoPadding, setLogoPadding] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [landingPageUrl, setLandingPageUrl] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage on component mount
    const savedLandingLogo = localStorage.getItem('landing-page-logo');
    if (savedLandingLogo) setLogoPreview(savedLandingLogo);
    const savedLandingWidth = localStorage.getItem('landing-page-logo-width');
    if (savedLandingWidth) setLogoWidth(Number(savedLandingWidth));
    const savedLandingAlign = localStorage.getItem('landing-page-logo-align');
    if (savedLandingAlign) setLogoAlign(savedLandingAlign);
    const savedLandingPadding = localStorage.getItem('landing-page-logo-padding');
    if (savedLandingPadding) setLogoPadding(Number(savedLandingPadding));
    const savedTemplate = localStorage.getItem('selected-ui-template');
    if (savedTemplate) setSelectedTemplate(savedTemplate);
    const savedUrl = localStorage.getItem('landing-page-url');
    if (savedUrl) setLandingPageUrl(savedUrl);
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setLogoPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveSettings = () => {
      if (logoPreview) {
          localStorage.setItem('landing-page-logo', logoPreview);
          localStorage.setItem('landing-page-logo-width', String(logoWidth));
          localStorage.setItem('landing-page-logo-align', logoAlign);
          localStorage.setItem('landing-page-logo-padding', String(logoPadding));
      } else {
          localStorage.removeItem('landing-page-logo');
          localStorage.removeItem('landing-page-logo-width');
          localStorage.removeItem('landing-page-logo-align');
          localStorage.removeItem('landing-page-logo-padding');
      }
      localStorage.setItem('selected-ui-template', selectedTemplate);
      localStorage.setItem('landing-page-url', landingPageUrl);

      // Dispatch a custom event to notify other components (like the preview) of the change
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { key: 'landing-page-logo' }}));
      toast({ title: "UI Settings Saved" });
  };
  
  const templates = [
      { id: 'template1', name: 'Minimalist', component: Template1 },
      { id: 'template2', name: 'Image Focus', component: Template2 },
      { id: 'template3', name: 'Dark Mode', component: Template3 },
      { id: 'template4', name: 'Card-Based', component: Template4 },
      { id: 'template5', name: 'Vibrant', component: Template5 },
      { id: 'template6', name: 'Corporate', component: Template6 },
      { id: 'template7', name: 'Big Image', component: Template7 },
      { id: 'template8', name: 'Text Focus', component: Template8 },
      { id: 'template9', name: 'Action', component: Template9 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">UI Management</h2>
        <p className="text-muted-foreground max-w-3xl">
            Customize the look and feel of the customer-facing mobile experience.
        </p>
      </div>

       <Separator />
       
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Controls */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LayoutTemplate className="text-primary"/>
                        Layout Templates
                    </CardTitle>
                    <CardDescription>
                        Choose a base layout for your mobile landing page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <div key={template.id} onClick={() => setSelectedTemplate(template.id)} className="cursor-pointer">
                            <div className={cn(
                                "w-full aspect-[9/19.5] rounded-md border-2 p-2 bg-muted/50 transition-all",
                                selectedTemplate === template.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-muted-foreground"
                            )}>
                                <template.component logoPreview={null} logoWidth={0} logoAlign="" logoPadding={0} isThumbnail={true} />
                            </div>
                            <p className="text-center text-sm font-medium mt-2">{template.name}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="text-primary"/>
                        Landing Page Customization
                    </CardTitle>
                    <CardDescription>
                        Control the branding of the page customers see when they scan a QR code. This will apply to your selected template.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="landing-page-url">Landing Page URL</Label>
                        <Input
                            id="landing-page-url"
                            type="url"
                            placeholder="https://yourstore.com/product/..."
                            value={landingPageUrl}
                            onChange={(e) => setLandingPageUrl(e.target.value)}
                            className="mt-2"
                        />
                         <p className="text-xs text-muted-foreground mt-1">This is the destination URL for the QR code.</p>
                    </div>

                    <div>
                        <Label htmlFor="logo-upload-landing">Landing Page Logo</Label>
                        <Input id="logo-upload-landing" type="file" accept="image/*" onChange={handleLogoUpload} className="mt-2" />
                    </div>
                     <div className="space-y-4">
                        <Label>Logo Sizing & Spacing</Label>
                        <div className="p-4 border rounded-lg space-y-4">
                            <div>
                                <Label htmlFor="logo-width">Width: {logoWidth}px</Label>
                                <Slider id="logo-width" value={[logoWidth]} onValueChange={(v) => setLogoWidth(v[0])} min={50} max={250} step={1} />
                            </div>
                             <div>
                                <Label htmlFor="logo-padding">Vertical Padding: {logoPadding}px</Label>
                                <Slider id="logo-padding" value={[logoPadding]} onValueChange={(v) => setLogoPadding(v[0])} min={0} max={100} step={1} />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Logo Alignment</Label>
                        <RadioGroup value={logoAlign} onValueChange={setLogoAlign} className="flex gap-4">
                            <Label htmlFor="align-start" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyStart />
                                <RadioGroupItem value="flex-start" id="align-start" className="sr-only" />
                                <span>Left</span>
                            </Label>
                             <Label htmlFor="align-center" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyCenter />
                                <RadioGroupItem value="center" id="align-center" className="sr-only" />
                                <span>Center</span>
                            </Label>
                             <Label htmlFor="align-end" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyEnd />
                                <RadioGroupItem value="flex-end" id="align-end" className="sr-only" />
                                <span>Right</span>
                            </Label>
                        </RadioGroup>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveSettings}>
                        <Save className="mr-2 h-4 w-4" /> Save UI Settings
                    </Button>
                </CardFooter>
            </Card>
        </div>

        {/* Right Side: Preview */}
        <div className="lg:col-span-1">
            <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle>Mobile Preview</CardTitle>
                    <CardDescription>
                        A live preview of the customer's landing page experience with your selected template and customizations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <PhoneMockup>
                       <MobileLandingPagePreview selectedTemplate={selectedTemplate} />
                    </PhoneMockup>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
