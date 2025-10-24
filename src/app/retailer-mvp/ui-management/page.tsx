
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, Save, Image as ImageIcon, Palette } from 'lucide-react';
import PhoneMockup from '@/components/dashboard/phone-mockup';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function MobileLandingPagePreview() {
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

    return (
        <div className="bg-background text-foreground h-full w-full overflow-y-auto">
            <header className={logoContainerClass} style={headerStyle}>
                 {logoPreview && (
                    <Image 
                        src={logoPreview}
                        alt="Landing Page Logo"
                        width={logoWidth}
                        height={logoWidth / (128/50)}
                        style={{ width: `${logoWidth}px`, display: 'inline-block' }}
                    />
                )}
            </header>
             <div className="p-4 text-center">
                <h2 className="text-2xl font-bold tracking-tighter mb-2">
                    Shop Smarter, In-Store.
                </h2>
                <p className="max-w-xl mx-auto text-muted-foreground text-sm mb-4">
                    Scan any product's QR code to get instant details, reviews, and
                    AI-powered recommendations right on your phone.
                </p>
                <div className="max-w-xs mx-auto">
                    <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center border">
                        <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function UiManagementPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoWidth, setLogoWidth] = useState(128);
  const [logoAlign, setLogoAlign] = useState('flex-start');
  const [logoPadding, setLogoPadding] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    // Load landing page logo settings from localStorage on component mount
    const savedLandingLogo = localStorage.getItem('landing-page-logo');
    if (savedLandingLogo) setLogoPreview(savedLandingLogo);
    const savedLandingWidth = localStorage.getItem('landing-page-logo-width');
    if (savedLandingWidth) setLogoWidth(Number(savedLandingWidth));
    const savedLandingAlign = localStorage.getItem('landing-page-logo-align');
    if (savedLandingAlign) setLogoAlign(savedLandingAlign);
    const savedLandingPadding = localStorage.getItem('landing-page-logo-padding');
    if (savedLandingPadding) setLogoPadding(Number(savedLandingPadding));
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

  const handleSaveLogo = () => {
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
      // Dispatch a custom event to notify other components (like the preview) of the change
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { key: 'landing-page-logo' }}));
      toast({ title: "Landing Page UI Saved" });
  };

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
                        <Palette className="text-primary"/>
                        Landing Page Customization
                    </CardTitle>
                    <CardDescription>
                        Control the branding of the page customers see when they scan a QR code.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    <Button onClick={handleSaveLogo}>
                        <Save className="mr-2 h-4 w-4" /> Save Landing Page Settings
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
                        A live preview of the customer's landing page experience.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <PhoneMockup>
                       <MobileLandingPagePreview />
                    </PhoneMockup>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
