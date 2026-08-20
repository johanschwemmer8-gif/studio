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
import { AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, Save, Image as ImageIcon, Palette, LayoutTemplate, Sparkles, Link2, Loader2 } from 'lucide-react';
import PhoneMockup from '@/components/dashboard/phone-mockup';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Template1, Template2, Template3, Template4, Template5, Template6, Template7, Template8, Template9 } from '@/components/dashboard/ui-templates';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

function MobileLandingPagePreview({ settings }: { settings: any }) {
    const { logoUrl, logoWidth, logoAlign, logoPadding, selectedTemplate } = settings;

    const renderTemplate = () => {
        const props = { 
            logoPreview: logoUrl, 
            logoWidth: logoWidth || 128, 
            logoAlign: logoAlign || 'flex-start', 
            logoPadding: logoPadding || 0 
        };
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [settings, setSettings] = useState({
      logoUrl: '',
      logoWidth: 128,
      logoAlign: 'center',
      logoPadding: 0,
      selectedTemplate: 'template1',
      landingPageUrl: '',
      scanDestination: 'ai' as 'url' | 'ai',
  });

  useEffect(() => {
    if (!user?.retailerId || !db) return;

    const docRef = doc(db, 'configurations', `${user.retailerId}_brand`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            setSettings(docSnap.data().data);
        } else {
            // Migration fallback
            const savedLogo = localStorage.getItem('landing-page-logo');
            const savedTemplate = localStorage.getItem('selected-ui-template');
            if (savedLogo || savedTemplate) {
                setSettings(prev => ({
                    ...prev,
                    logoUrl: savedLogo || '',
                    selectedTemplate: savedTemplate || 'template1'
                }));
            }
        }
        setIsFetching(false);
    });

    return () => unsubscribe();
  }, [user?.retailerId]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveSettings = async () => {
      if (!user?.retailerId || !db) return;

      setIsSaving(true);
      try {
          const docRef = doc(db, 'configurations', `${user.retailerId}_brand`);
          await setDoc(docRef, {
              retailerId: user.retailerId,
              type: 'brand',
              data: settings,
              updatedAt: serverTimestamp()
          });

          // Clean up legacy
          localStorage.removeItem('landing-page-logo');
          localStorage.removeItem('selected-ui-template');

          toast({ title: "UI Settings Saved", description: "Authoritative branding synchronized." });
      } catch (e: any) {
          toast({ title: "Save Failed", description: e.message, variant: "destructive" });
      } finally {
          setIsSaving(false);
      }
  };

  if (isFetching) {
      return (
          <div className="flex flex-col items-center justify-center p-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Brand Assets...</p>
          </div>
      );
  }

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
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LayoutTemplate className="text-primary"/>
                        Layout Templates
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <div key={template.id} onClick={() => setSettings(p => ({ ...p, selectedTemplate: template.id }))} className="cursor-pointer">
                            <div className={cn(
                                "w-full aspect-[9/19.5] rounded-md border-2 p-2 bg-muted/50 transition-all",
                                settings.selectedTemplate === template.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-muted-foreground"
                            )}>
                                <template.component logoPreview={settings.logoUrl} logoWidth={settings.logoWidth} logoAlign={settings.logoAlign} logoPadding={settings.logoPadding} isThumbnail={true} />
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
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label>On-Scan Destination</Label>
                        <RadioGroup value={settings.scanDestination} onValueChange={(v) => setSettings(p => ({ ...p, scanDestination: v as 'url' | 'ai' }))} className="flex gap-4">
                            <Label htmlFor="dest-url" className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <RadioGroupItem value="url" id="dest-url" />
                                <span>Landing Page</span>
                            </Label>
                            <Label htmlFor="dest-ai" className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <RadioGroupItem value="ai" id="dest-ai" />
                                <span>AI Assistant</span>
                            </Label>
                        </RadioGroup>
                    </div>

                    {settings.scanDestination === 'url' && (
                        <div>
                            <Label htmlFor="landing-page-url">Landing Page URL</Label>
                            <Input
                                id="landing-page-url"
                                type="url"
                                value={settings.landingPageUrl}
                                onChange={(e) => setSettings(p => ({ ...p, landingPageUrl: e.target.value }))}
                                className="mt-2"
                            />
                        </div>
                    )}

                    <div>
                        <Label htmlFor="logo-upload-landing">Landing Page Logo</Label>
                        <Input id="logo-upload-landing" type="file" accept="image/*" onChange={handleLogoUpload} className="mt-2" />
                    </div>
                    
                     <div className="space-y-4">
                        <Label>Logo Sizing & Spacing</Label>
                        <div className="p-4 border rounded-lg space-y-4">
                            <div>
                                <Label>Width: {settings.logoWidth}px</Label>
                                <Slider value={[settings.logoWidth]} onValueChange={(v) => setSettings(p => ({ ...p, logoWidth: v[0] }))} min={50} max={250} step={1} />
                            </div>
                             <div>
                                <Label>Vertical Padding: {settings.logoPadding}px</Label>
                                <Slider value={[settings.logoPadding]} onValueChange={(v) => setSettings(p => ({ ...p, logoPadding: v[0] }))} min={0} max={100} step={1} />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Logo Alignment</Label>
                        <RadioGroup value={settings.logoAlign} onValueChange={(v) => setSettings(p => ({ ...p, logoAlign: v }))} className="flex gap-4">
                             <RadioGroupItem value="flex-start" id="align-start" className="sr-only" />
                             <Label htmlFor="align-start" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyStart />
                                <span>Left</span>
                            </Label>
                             <RadioGroupItem value="center" id="align-center" className="sr-only" />
                             <Label htmlFor="align-center" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyCenter />
                                <span>Center</span>
                            </Label>
                             <RadioGroupItem value="flex-end" id="align-end" className="sr-only" />
                             <Label htmlFor="align-end" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyEnd />
                                <span>Right</span>
                            </Label>
                        </RadioGroup>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveSettings} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} 
                        Save UI Settings
                    </Button>
                </CardFooter>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle>Mobile Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <PhoneMockup>
                       <MobileLandingPagePreview settings={settings} />
                    </PhoneMockup>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}