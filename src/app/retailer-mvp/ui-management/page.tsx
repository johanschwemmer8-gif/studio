
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
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, Save, Palette, LayoutTemplate, Loader2 } from 'lucide-react';
import PhoneMockup from '@/components/dashboard/phone-mockup';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ShopperExperienceRenderer } from '@/components/dashboard/shopper-experience/shopper-experience-renderer';
import { SHOPPER_TEMPLATE_REGISTRY } from '@/components/dashboard/shopper-experience/template-registry';
import type { ShopperTemplateId } from '@/components/dashboard/shopper-experience/types';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { getApp } from 'firebase/app';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { HubNav } from '@/components/dashboard/hub-nav';

function MobileLandingPagePreview({ settings }: { settings: any }) {
    const {
        logoUrl,
        logoWidth,
        logoAlign,
        logoPadding,
        selectedTemplate,
    } = settings;

    const templateId: ShopperTemplateId =
        SHOPPER_TEMPLATE_REGISTRY.some(
            (template) => template.id === selectedTemplate
        )
            ? (selectedTemplate as ShopperTemplateId)
            : "template1";

    return (
        <div className="h-full w-full overflow-hidden bg-background text-foreground">
            <ShopperExperienceRenderer
                templateId={templateId}
                mode="preview"
                branding={{
                    logoUrl:
                        typeof logoUrl === "string" && logoUrl
                            ? logoUrl
                            : undefined,
                    logoWidth: Number(logoWidth) || 128,
                    logoAlign:
                        logoAlign === "flex-start" ||
                        logoAlign === "center" ||
                        logoAlign === "flex-end"
                            ? logoAlign
                            : "center",
                    logoPadding: Number(logoPadding) || 0,
                }}
            />
        </div>
    );
}

export default function UiManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const brandHubItems = [
    { label: "Brand & Landing Page", href: "/retailer-mvp/ui-management" },
    { label: "Supplier Media", href: "/retailer-mvp/brands" },
  ];

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
        }
        setIsFetching(false);
    });

    return () => unsubscribe();
  }, [user?.retailerId]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      console.log("[LOGO DEBUG] handleLogoUpload called");
      console.log("[LOGO DEBUG] file:", file?.name, file?.type, file?.size);
      console.log("[LOGO DEBUG] retailerId:", user?.retailerId);
      const firebaseStorage = getStorage(getApp());
      console.log("[LOGO DEBUG] storage initialized:", !!firebaseStorage);

      if (!file || !user?.retailerId) {
          console.error("[LOGO DEBUG] Upload aborted by guard", {
              hasFile: !!file,
              retailerId: user?.retailerId,
              hasStorage: !!firebaseStorage
          });
          return;
      }

      try {
          setIsSaving(true);

          const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
          const logoRef = ref(
              firebaseStorage,
              `retailer-assets/${user.retailerId}/brand-logo-${Date.now()}.${extension}`
          );

          await uploadBytes(logoRef, file, {
              contentType: file.type,
          });

          const downloadUrl = await getDownloadURL(logoRef);

          setSettings(prev => ({
              ...prev,
              logoUrl: downloadUrl,
          }));

          toast({
              title: "Logo Uploaded",
              description: "Brand logo uploaded successfully. Click Apply Branding to save the experience settings.",
          });
      } catch (e: any) {
          console.error("[Brand Experience] Logo upload failed:", e);

          toast({
              title: "Logo Upload Failed",
              description: e.message || "Unable to upload the brand logo.",
              variant: "destructive",
          });
      } finally {
          setIsSaving(false);
      }
  };

  const handleSaveSettings = async () => {
      if (!user?.retailerId || !db) return;

      setIsSaving(true);
      try {
          const docRef = doc(db, 'configurations', `${user.retailerId}_brand`);

          const brandSettings = {
              logoUrl: typeof settings.logoUrl === 'string' ? settings.logoUrl : '',
              logoWidth: Number(settings.logoWidth) || 128,
              logoAlign: settings.logoAlign || 'center',
              logoPadding: Number(settings.logoPadding) || 0,
              selectedTemplate: settings.selectedTemplate || 'template1',
              landingPageUrl: typeof settings.landingPageUrl === 'string' ? settings.landingPageUrl : '',
              scanDestination: settings.scanDestination === 'url' ? 'url' : 'ai',
          };

          await setDoc(docRef, {
              retailerId: user.retailerId,
              type: 'brand',
              data: brandSettings,
              updatedAt: serverTimestamp()
          });
          toast({ title: "Experience Settings Saved", description: "Authoritative branding synchronized." });
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
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Retrieving Brand Assets...</p>
          </div>
      );
  }

  const templates = SHOPPER_TEMPLATE_REGISTRY;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Brand & Experience</h2>
        <p className="text-muted-foreground mt-2">
            Customize the global look and feel of the customer-facing mobile experience.
        </p>
      </div>

       <HubNav items={brandHubItems} />
       <Separator />
       
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LayoutTemplate className="text-primary h-5 w-5"/>
                        Template Gallery
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <div key={template.id} onClick={() => setSettings(p => ({ ...p, selectedTemplate: template.id }))} className="cursor-pointer">
                            <div className={cn(
                                "w-full aspect-[9/19.5] rounded-md border-2 p-2 bg-muted/50 transition-all",
                                settings.selectedTemplate === template.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-muted-foreground"
                            )}>
                                <div className="pointer-events-none h-full w-full overflow-hidden">
                                    <ShopperExperienceRenderer
                                        templateId={template.id}
                                        mode="preview"
                                        branding={{
                                            logoUrl: settings.logoUrl || undefined,
                                            logoWidth: settings.logoWidth,
                                            logoAlign: settings.logoAlign === "flex-start" || settings.logoAlign === "flex-end" ? settings.logoAlign : "center",
                                            logoPadding: settings.logoPadding,
                                        }}
                                    />
                                </div>
                            </div>
                            <p className="text-center text-[10px] font-black uppercase mt-2">{template.name}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="text-primary h-5 w-5"/>
                        Branding Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="logo-upload-landing" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Brand Logo</Label>
                        <Input id="logo-upload-landing" type="file" accept="image/*" onChange={handleLogoUpload} className="mt-2" />
                    </div>
                    
                     <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Logo Scaling</Label>
                        <div className="p-4 border rounded-lg space-y-4">
                            <div>
                                <Label className="text-[10px] font-bold">Width: {settings.logoWidth}px</Label>
                                <Slider value={[settings.logoWidth]} onValueChange={(v) => setSettings(p => ({ ...p, logoWidth: v[0] }))} min={50} max={250} step={1} />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Logo Alignment</Label>
                        <RadioGroup value={settings.logoAlign} onValueChange={(v) => setSettings(p => ({ ...p, logoAlign: v }))} className="flex gap-4">
                             <RadioGroupItem value="flex-start" id="align-start" className="sr-only" />
                             <Label htmlFor="align-start" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyStart className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">Left</span>
                            </Label>
                             <RadioGroupItem value="center" id="align-center" className="sr-only" />
                             <Label htmlFor="align-center" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyCenter className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">Center</span>
                            </Label>
                             <RadioGroupItem value="flex-end" id="align-end" className="sr-only" />
                             <Label htmlFor="align-end" className="flex flex-col items-center gap-2 p-3 border rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer">
                                <AlignHorizontalJustifyEnd className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">Right</span>
                            </Label>
                        </RadioGroup>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveSettings} disabled={isSaving} className="font-bold uppercase text-[10px] tracking-widest h-10 px-8">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} 
                        Apply Branding
                    </Button>
                </CardFooter>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4" /> Shopper Preview
                    </CardTitle>
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
