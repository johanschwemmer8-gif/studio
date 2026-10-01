'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { getAiConfig } from '@/ai/flows/get-ai-config';
import { saveAiConfig } from '@/ai/flows/save-ai-config';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ShopperPhoneFrame } from '@/components/dashboard/shopper-experience/shopper-phone-frame';
import { ShopperExperienceRenderer } from '@/components/dashboard/shopper-experience/shopper-experience-renderer';
import type {
  ShopperExperienceBranding,
  ShopperTemplateId,
} from '@/components/dashboard/shopper-experience/types';

const formSchema = z.object({
  assistantName: z.string().min(1).max(60).default('Ari'),
  personality: z.enum([
    'PROFESSIONAL_HELPFUL',
    'FRIENDLY_APPROACHABLE',
    'EXPERT_INFORMATIVE',
  ]),
  tone: z.enum([
    'FORMAL',
    'CONVERSATIONAL',
    'WARM',
    'CONCISE',
  ]),
  brandVoice: z.string().max(500).default(''),
  welcomeMessage: z.string().max(200),
  recommendationCount: z.number().int().min(1).max(6),
  includePrice: z.boolean(),
  showAvailability: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const shopperTemplateIds: ShopperTemplateId[] = [
  'template1',
  'template2',
  'template3',
  'template4',
  'template5',
  'template6',
  'template7',
  'template8',
  'template9',
];

const isShopperTemplateId = (
  value: unknown
): value is ShopperTemplateId =>
  typeof value === 'string' &&
  shopperTemplateIds.includes(value as ShopperTemplateId);

const defaultPreviewBranding: ShopperExperienceBranding = {
  logoUrl: '',
  logoWidth: 128,
  logoMaxHeight: 32,
  logoAlign: 'center',
  logoPadding: 0,
  headerBackgroundColor: '#07162f',
};

const defaultValues: FormValues = {
  assistantName: 'Ari',
  personality: 'FRIENDLY_APPROACHABLE',
  tone: 'CONVERSATIONAL',
  brandVoice: '',
  welcomeMessage:
    "Hi! I'm Ari. How can I help you with this product today?",
  recommendationCount: 3,
  includePrice: true,
  showAvailability: true,
};

export default function AIConfigurationPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] =
    useState<ShopperTemplateId>('template1');
  const [previewBranding, setPreviewBranding] =
    useState<ShopperExperienceBranding>(defaultPreviewBranding);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const recommendationCount =
    form.watch('recommendationCount');
  const assistantName = form.watch('assistantName');
  const welcomeMessage = form.watch('welcomeMessage');

  useEffect(() => {
    if (!user?.retailerId) {
      setIsLoading(false);
      return;
    }

    const retailerId = user.retailerId;
    let cancelled = false;

    const loadConfiguration = async () => {
      try {
        const idToken = await user.getIdToken();

        const result = await getAiConfig({
          idToken,
          retailerId,
        });

        if (cancelled) return;

        if (result.configuration) {
          form.reset({
            assistantName:
              result.configuration.assistantName,
            personality:
              result.configuration.personality,
            tone: result.configuration.tone,
            brandVoice:
              result.configuration.brandVoice,
            welcomeMessage:
              result.configuration.welcomeMessage,
            recommendationCount:
              result.configuration.recommendationCount,
            includePrice:
              result.configuration.includePrice,
            showAvailability:
              result.configuration.showAvailability,
          });
        }
      } catch (error) {
        console.error(
          'Failed to load authoritative Ari configuration:',
          error
        );

        if (!cancelled) {
          toast({
            title: 'Ari configuration unavailable',
            description:
              'The saved retailer configuration could not be loaded.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadConfiguration();

    return () => {
      cancelled = true;
    };
  }, [user, user?.retailerId, form, toast]);

  useEffect(() => {
    if (!user?.retailerId || !db) {
      return;
    }

    const retailerId = user.retailerId;
    const brandRef = doc(
      db,
      'configurations',
      `${retailerId}_brand`
    );

    const unsubscribe = onSnapshot(
      brandRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setPreviewTemplate('template1');
          setPreviewBranding(defaultPreviewBranding);
          return;
        }

        const raw = snapshot.data().data ?? {};

        setPreviewTemplate(
          isShopperTemplateId(raw.selectedTemplate)
            ? raw.selectedTemplate
            : 'template1'
        );

        setPreviewBranding({
          logoUrl:
            typeof raw.logoUrl === 'string'
              ? raw.logoUrl
              : '',
          logoWidth:
            typeof raw.logoWidth === 'number'
              ? raw.logoWidth
              : 128,
          logoMaxHeight:
            typeof raw.logoMaxHeight === 'number'
              ? raw.logoMaxHeight
              : 32,
          logoAlign:
            raw.logoAlign === 'flex-start' ||
            raw.logoAlign === 'center' ||
            raw.logoAlign === 'flex-end'
              ? raw.logoAlign
              : 'center',
          logoPadding:
            typeof raw.logoPadding === 'number'
              ? raw.logoPadding
              : 0,
          headerBackgroundColor:
            typeof raw.headerBackgroundColor === 'string'
              ? raw.headerBackgroundColor
              : '#07162f',
        });
      },
      (error) => {
        console.error(
          'Failed to load shopper experience branding:',
          error
        );
      }
    );

    return unsubscribe;
  }, [user?.retailerId]);

  const handleSave = form.handleSubmit(
    async (values) => {
      if (!user?.retailerId) return;

      setIsSaving(true);

      try {
        const idToken = await user.getIdToken();

        const result = await saveAiConfig({
          idToken,
          retailerId: user.retailerId,
          config: values,
        });

        if (!result.success) {
          throw new Error(result.message);
        }

        toast({
          title: 'Ari configuration saved',
          description: result.message,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to save Ari configuration.';

        toast({
          title: 'Update failed',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 pb-24"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Ari Experience
          </CardTitle>
          <CardDescription>
            Configure retailer-wide defaults for how Ari
            communicates with shoppers.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Governed by iNteract
                </p>
                <p className="text-sm text-muted-foreground">
                  These preferences cannot override mandatory
                  iNteract AI Governance, product evidence,
                  privacy, neutrality, safety, or shopper
                  autonomy.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identity & Communication</CardTitle>
          <CardDescription>
            Define Ari&apos;s retailer-wide shopper-facing
            communication defaults.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assistantName">
                Display Name
              </Label>
              <Input
                id="assistantName"
                maxLength={60}
                {...form.register('assistantName')}
              />
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Input
                value="English"
                disabled
                aria-label="Ari language"
              />
              <p className="text-xs text-muted-foreground">
                English is the supported Ari language for v1.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Personality</Label>
              <Controller
                name="personality"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROFESSIONAL_HELPFUL">
                        Professional &amp; Helpful
                      </SelectItem>
                      <SelectItem value="FRIENDLY_APPROACHABLE">
                        Friendly &amp; Approachable
                      </SelectItem>
                      <SelectItem value="EXPERT_INFORMATIVE">
                        Expert &amp; Informative
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Controller
                name="tone"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FORMAL">
                        Formal
                      </SelectItem>
                      <SelectItem value="CONVERSATIONAL">
                        Conversational
                      </SelectItem>
                      <SelectItem value="WARM">
                        Warm
                      </SelectItem>
                      <SelectItem value="CONCISE">
                        Concise
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandVoice">
              Brand Voice
            </Label>
            <Textarea
              id="brandVoice"
              rows={4}
              maxLength={500}
              placeholder="Describe the communication style Ari should reflect for your retail brand."
              {...form.register('brandVoice')}
            />
            <p className="text-xs text-muted-foreground">
              Communication preference only. It cannot change
              Ari&apos;s evidence or governance requirements.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">
              Welcome Message
            </Label>
            <Textarea
              id="welcomeMessage"
              rows={3}
              maxLength={200}
              {...form.register('welcomeMessage')}
            />
            <p className="text-xs text-muted-foreground">
              Shopper-facing greeting. Maximum 200 characters.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommendation Presentation
          </CardTitle>
          <CardDescription>
            Control how verified recommendation information is
            presented. These settings do not create product
            evidence.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Maximum Recommendations
              </Label>
              <span className="text-sm font-semibold">
                {recommendationCount}
              </span>
            </div>

            <Controller
              name="recommendationCount"
              control={form.control}
              render={({ field }) => (
                <Slider
                  value={[field.value]}
                  onValueChange={(value) =>
                    field.onChange(value[0])
                  }
                  min={1}
                  max={6}
                  step={1}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="includePrice">
                Include Verified Price
              </Label>
              <p className="text-xs text-muted-foreground">
                Show price only when verified price evidence is
                available.
              </p>
            </div>

            <Controller
              name="includePrice"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id="includePrice"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="showAvailability">
                Show Verified Availability
              </Label>
              <p className="text-xs text-muted-foreground">
                Show availability only when authoritative
                availability evidence exists.
              </p>
            </div>

            <Controller
              name="showAvailability"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id="showAvailability"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shopper Experience Preview</CardTitle>
          <CardDescription>
            Preview Ari using the shopper experience template and
            branding selected in Brand &amp; Experience.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex justify-center overflow-hidden">
            <div className="pointer-events-none">
              <ShopperPhoneFrame>
                <ShopperExperienceRenderer
                  templateId={previewTemplate}
                  mode="preview"
                  branding={previewBranding}
                  ariImageUrl="/brand/ari/ari-master.png"
                  ariPresentation={{
                    assistantName:
                      assistantName?.trim() || 'Ari',
                    welcomeMessage:
                      welcomeMessage?.trim() ||
                      defaultValues.welcomeMessage,
                  }}
                />
              </ShopperPhoneFrame>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Presentation preview only. No shopper session,
            Activation identity, product evidence, or live AI
            response is fabricated here.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activation Context</CardTitle>
          <CardDescription>
            Retailer-wide Ari defaults and Activation-specific
            shopper context remain separate.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Activation-specific Ari context is managed separately
            in QR Management. Configuration precedence applies
            only where explicitly supported by the Ari runtime.
          </p>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end border-t bg-background/90 p-4 backdrop-blur-md">
        <Button
          type="submit"
          disabled={isSaving || !user?.retailerId}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Ari Configuration
        </Button>
      </div>
    </form>
  );
}
