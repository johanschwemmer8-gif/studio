
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
import { ShopperPhoneFrame } from '@/components/dashboard/shopper-experience/shopper-phone-frame';
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
                ariImageUrl="/brand/ari/ari-master.png"
                branding={{
                    logoUrl:
                        typeof logoUrl === "string" && logoUrl
                            ? logoUrl
                            : undefined,
                    logoWidth: Number(logoWidth) || 128,
                    logoMaxHeight: Number(settings.logoMaxHeight) || 32,
                    logoAlign:
                        logoAlign === "flex-start" ||
                        logoAlign === "center" ||
                        logoAlign === "flex-end"
                            ? logoAlign
                            : "center",
                    logoPadding: Number(logoPadding) || 0,
                    headerBackgroundColor:
                        typeof settings.headerBackgroundColor === "string"
                            ? settings.headerBackgroundColor
                            : "#07162f",
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
      logoMaxHeight: 32,
      logoAlign: 'center',
      logoPadding: 0,
      headerBackgroundColor: '#07162f',
      selectedTemplate: 'template1',
      landingPageUrl: '',
      scanDestination: 'ai' as 'url' | 'ai',
  });

  useEffect(() => {
    if (!user?.retailerId || !db) return;

    const docRef = doc(db, 'configurations', `${user.retailerId}_brand`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const saved = docSnap.data().data ?? {};
            setSettings(prev => ({
                ...prev,
                ...saved,
                logoWidth: Number(saved.logoWidth) || 128,
                logoMaxHeight: Number(saved.logoMaxHeight) || 32,
                logoAlign: saved.logoAlign || 'center',
                logoPadding: Number(saved.logoPadding) || 0,
                headerBackgroundColor:
                    typeof saved.headerBackgroundColor === 'string'
                        ? saved.headerBackgroundColor
                        : '#07162f',
            }));
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
              logoMaxHeight: Number(settings.logoMaxHeight) || 32,
              logoAlign: settings.logoAlign || 'center',
              logoPadding: Number(settings.logoPadding) || 0,
              headerBackgroundColor:
                  typeof settings.headerBackgroundColor === 'string'
                      ? settings.headerBackgroundColor
                      : '#07162f',
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
                    <p className="text-sm text-muted-foreground">
                        Explore each shopper experience as it will appear on a mobile device.
                    </p>
                </CardHeader>

                <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {templates.map(template => {
                        const isSelected = settings.selectedTemplate === template.id;

                        return (
                            <div
                                key={template.id}
                                className={cn(
                                    "rounded-xl border-2 p-6 transition-all",
                                    isSelected
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-border"
                                )}
                            >
                                <div className="flex justify-center">
                                    <ShopperPhoneFrame>
                                        <div className="pointer-events-none h-full w-full overflow-hidden">
                                            <ShopperExperienceRenderer
                                                templateId={template.id}
                                                mode="preview"
                                                ariImageUrl="/brand/ari/ari-master.png"
                                                branding={{
                                                    logoUrl: settings.logoUrl || undefined,
                                                    logoWidth: settings.logoWidth,
                                                    logoMaxHeight: settings.logoMaxHeight,
                                                    logoAlign:
                                                        settings.logoAlign === "flex-start" ||
                                                        settings.logoAlign === "flex-end"
                                                            ? settings.logoAlign
                                                            : "center",
                                                    logoPadding: settings.logoPadding,
                                                    headerBackgroundColor:
                                                        settings.headerBackgroundColor,
                                                }}
                                            />
                                        </div>
                                    </ShopperPhoneFrame>
                                </div>

                                <div className="mt-5 text-center">
                                    <p className="text-xs font-black uppercase tracking-wider">
                                        {template.name}
                                    </p>

                                    <Button
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        className="mt-3"
                                        onClick={() =>
                                            setSettings(p => ({
                                                ...p,
                                                selectedTemplate: template.id,
                                            }))
                                        }
                                    >
                                        {isSelected ? "Selected" : "Select Template"}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="text-primary h-5 w-5"/>
                        Branding Controls
                    </CardTitle>
                    <CardDescription>
                        Configure how your retailer identity appears in the shopper experience.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div>
                        <Label
                            htmlFor="logo-upload-landing"
                            className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                            Brand Logo
                        </Label>
                        <Input
                            id="logo-upload-landing"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="mt-2"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Upload or replace the logo used in the shopper header.
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Logo Size
                        </Label>

                        <div className="space-y-5 rounded-lg border p-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold">
                                        Width
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {settings.logoWidth}px
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.logoWidth]}
                                    onValueChange={(v) =>
                                        setSettings(p => ({
                                            ...p,
                                            logoWidth: v[0],
                                        }))
                                    }
                                    min={40}
                                    max={220}
                                    step={1}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold">
                                        Maximum Height
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {settings.logoMaxHeight}px
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.logoMaxHeight]}
                                    onValueChange={(v) =>
                                        setSettings(p => ({
                                            ...p,
                                            logoMaxHeight: v[0],
                                        }))
                                    }
                                    min={16}
                                    max={48}
                                    step={1}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold">
                                        Surrounding Padding
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {settings.logoPadding}px
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.logoPadding]}
                                    onValueChange={(v) =>
                                        setSettings(p => ({
                                            ...p,
                                            logoPadding: v[0],
                                        }))
                                    }
                                    min={0}
                                    max={12}
                                    step={1}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Logo Alignment
                        </Label>

                        <RadioGroup
                            value={settings.logoAlign}
                            onValueChange={(v) =>
                                setSettings(p => ({ ...p, logoAlign: v }))
                            }
                            className="flex gap-4"
                        >
                            <RadioGroupItem
                                value="flex-start"
                                id="align-start"
                                className="sr-only"
                            />
                            <Label
                                htmlFor="align-start"
                                className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-md border p-3 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                            >
                                <AlignHorizontalJustifyStart className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">
                                    Left
                                </span>
                            </Label>

                            <RadioGroupItem
                                value="center"
                                id="align-center"
                                className="sr-only"
                            />
                            <Label
                                htmlFor="align-center"
                                className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-md border p-3 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                            >
                                <AlignHorizontalJustifyCenter className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">
                                    Centre
                                </span>
                            </Label>

                            <RadioGroupItem
                                value="flex-end"
                                id="align-end"
                                className="sr-only"
                            />
                            <Label
                                htmlFor="align-end"
                                className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-md border p-3 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                            >
                                <AlignHorizontalJustifyEnd className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">
                                    Right
                                </span>
                            </Label>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="header-background"
                            className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                            Header Background
                        </Label>

                        <div className="flex items-center gap-3">
                            <Input
                                id="header-background"
                                type="color"
                                value={settings.headerBackgroundColor}
                                onChange={(e) =>
                                    setSettings(p => ({
                                        ...p,
                                        headerBackgroundColor: e.target.value,
                                    }))
                                }
                                className="h-10 w-16 cursor-pointer p-1"
                            />

                            <Input
                                value={settings.headerBackgroundColor}
                                onChange={(e) =>
                                    setSettings(p => ({
                                        ...p,
                                        headerBackgroundColor: e.target.value,
                                    }))
                                }
                                maxLength={7}
                                className="font-mono"
                                aria-label="Header background hex colour"
                            />
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Choose a header colour that provides clear contrast with your logo.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-wrap gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            setSettings(p => ({
                                ...p,
                                logoWidth: 128,
                                logoMaxHeight: 32,
                                logoAlign: 'center',
                                logoPadding: 0,
                                headerBackgroundColor: '#07162f',
                            }))
                        }
                    >
                        Reset Branding
                    </Button>

                    <Button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="h-10 px-8 text-[10px] font-bold uppercase tracking-widest"
                    >
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        ) : (
                            <Save className="mr-2 h-4 w-4"/>
                        )}
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
