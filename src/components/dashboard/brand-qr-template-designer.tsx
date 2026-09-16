'use client';

import * as React from 'react';
import { CheckCircle2, ImageIcon, Loader2, Save, ShieldCheck, Upload, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';

import { saveQrTemplate } from '@/ai/flows/save-qr-template';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { buildQrPresentationOptions } from '@/lib/qr-presentation-renderer';
import type { QrTemplate } from '@/lib/schemas/qr-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type ModuleStyle = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
type EyeStyle = 'square' | 'rounded' | 'leaf';
type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

type Props = { template?: QrTemplate; onSave: () => void; onCancel?: () => void };
const PREVIEW_URL = 'https://interactaoe.co.za/qr-template-preview';

function luminance(hex: string) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  const values = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = values.map((v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string) {
  const x = luminance(a);
  const y = luminance(b);
  if (x === null || y === null) return null;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export default function BrandQrTemplateDesigner({ template, onSave, onCancel }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const defaults = template?.defaults;
  const initialLogoPath = defaults?.logoPath ?? defaults?.backgroundLogo.logoPath ?? '';

  const [name, setName] = React.useState(template?.name ?? '');
  const [description, setDescription] = React.useState(template?.description ?? '');
  const [colorHex, setColorHex] = React.useState(defaults?.colorHex ?? '#000000');
  const [bgColorHex, setBgColorHex] = React.useState(defaults?.bgColorHex ?? '#FFFFFF');
  const [gradientEnabled, setGradientEnabled] = React.useState(defaults?.gradient.enabled ?? false);
  const [gradientFrom, setGradientFrom] = React.useState(defaults?.gradient.from ?? '#000000');
  const [gradientTo, setGradientTo] = React.useState(defaults?.gradient.to ?? '#000000');
  const [gradientAngle, setGradientAngle] = React.useState(defaults?.gradient.angle ?? 0);
  const [moduleStyle, setModuleStyle] = React.useState<ModuleStyle>(defaults?.moduleStyle ?? 'square');
  const [eyeStyle, setEyeStyle] = React.useState<EyeStyle>(defaults?.eyeStyle ?? 'square');
  const [eyeOuterColor, setEyeOuterColor] = React.useState(defaults?.eyeColors.outer ?? '#000000');
  const [eyeInnerColor, setEyeInnerColor] = React.useState(defaults?.eyeColors.inner ?? '#000000');
  const [logoPath, setLogoPath] = React.useState(initialLogoPath);
  const [logoSizeRatio, setLogoSizeRatio] = React.useState(defaults?.logoSizeRatio ?? 0.2);
  const [backgroundLogoEnabled, setBackgroundLogoEnabled] = React.useState(
    !!initialLogoPath && (defaults?.backgroundLogo.enabled ?? false),
  );
  const [backgroundLogoOpacity, setBackgroundLogoOpacity] = React.useState(defaults?.backgroundLogo.opacity ?? 0.2);
  const [quietZone, setQuietZone] = React.useState(defaults?.quietZone ?? 4);
  const [errorCorrection, setErrorCorrection] = React.useState<ErrorCorrection>(defaults?.errorCorrection ?? 'M');
  const previewContainerRef = React.useRef<HTMLDivElement | null>(null);
  const previewQrRef = React.useRef<{
    append: (container?: HTMLElement) => void;
    update: (options: ReturnType<typeof buildQrPresentationOptions>) => void;
  } | null>(null);
  const [rendererVersion, setRendererVersion] = React.useState(0);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const contrast = React.useMemo(() => contrastRatio(colorHex, bgColorHex), [colorHex, bgColorHex]);
  const contrastSafe = contrast !== null && contrast >= 4.5;
  const backgroundLogoSafe = !backgroundLogoEnabled || (!!logoPath && backgroundLogoOpacity >= 0.05 && backgroundLogoOpacity <= 0.35);
  const designSafe = contrastSafe && quietZone >= 4 && backgroundLogoSafe && !previewError;

  React.useEffect(() => {
    let active = true;
    const container = previewContainerRef.current;
    if (!container) return () => { active = false; };

    container.replaceChildren();

    void import('qr-code-styling')
      .then(({ default: QRCodeStyling }) => {
        if (!active) return;

        const qr = new QRCodeStyling(
          buildQrPresentationOptions(PREVIEW_URL, {
            colorHex: '#000000',
            bgColorHex: '#FFFFFF',
            errorCorrection: 'M',
            moduleStyle: 'square',
            gradient: { enabled: false, from: '#000000', to: '#000000', angle: 0 },
            eyeStyle: 'square',
            eyeColors: { outer: '#000000', inner: '#000000' },
            logoSizeRatio: 0.2,
            backgroundLogo: { enabled: false, opacity: 0.2 },
            quietZone: 4,
          }),
        );

        previewQrRef.current = qr;
        qr.append(container);
        setRendererVersion((version) => version + 1);
        setPreviewError(null);
      })
      .catch((error) => {
        if (active) {
          setPreviewError(error instanceof Error ? error.message : 'Preview failed.');
        }
      });

    return () => {
      active = false;
      previewQrRef.current = null;
      container.replaceChildren();
    };
  }, []);

  React.useEffect(() => {
    const qr = previewQrRef.current;
    if (!qr) return;

    try {
      qr.update(
        buildQrPresentationOptions(PREVIEW_URL, {
          colorHex,
          bgColorHex,
          errorCorrection,
          moduleStyle,
          gradient: {
            enabled: gradientEnabled,
            from: gradientFrom,
            to: gradientTo,
            angle: gradientAngle,
          },
          eyeStyle,
          eyeColors: { outer: eyeOuterColor, inner: eyeInnerColor },
          logoPath: logoPath || undefined,
          logoSizeRatio,
          // Background-logo composition belongs to iNteract's preview/artifact
          // layer. Toggling it must never destroy or recreate the QR renderer.
          backgroundLogo: {
            enabled: false,
            opacity: backgroundLogoOpacity,
          },
          quietZone,
        }),
      );
      setPreviewError(null);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Preview failed.');
    }
  }, [
    rendererVersion,
    colorHex,
    bgColorHex,
    errorCorrection,
    moduleStyle,
    gradientEnabled,
    gradientFrom,
    gradientTo,
    gradientAngle,
    eyeStyle,
    eyeOuterColor,
    eyeInnerColor,
    logoPath,
    logoSizeRatio,
    backgroundLogoOpacity,
    quietZone,
  ]);

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const retailerId = user?.retailerId;
    event.target.value = '';
    if (!file || !retailerId) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toast({ title: 'Logo not accepted', description: 'Choose an image smaller than 5 MB.', variant: 'destructive' });
      return;
    }
    try {
      setBusy(true);
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const firebaseStorage = getStorage(getApp());
      const logoRef = ref(firebaseStorage, `retailer-assets/${retailerId}/qr-templates/brand-logo-${Date.now()}.${extension}`);
      await uploadBytes(logoRef, file, { contentType: file.type });
      setLogoPath(await getDownloadURL(logoRef));
      toast({ title: 'Logo uploaded', description: 'The retailer logo is ready for this QR Template.' });
    } catch (error) {
      toast({ title: 'Logo upload failed', description: error instanceof Error ? error.message : 'Upload failed.', variant: 'destructive' });
    } finally { setBusy(false); }
  }

  async function handleSave() {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;
    if (!authenticatedUser || !retailerId) {
      toast({ title: 'Retailer context unavailable', description: 'Authenticate as a retailer before saving.', variant: 'destructive' });
      return;
    }
    if (!name.trim() || !designSafe) {
      toast({ title: 'Template is not ready', description: !name.trim() ? 'Enter a template name.' : 'Resolve the scan-safety checks before saving.', variant: 'destructive' });
      return;
    }
    try {
      setBusy(true);
      await saveQrTemplate({
        idToken: await authenticatedUser.getIdToken(),
        retailerId,
        ...(template?.templateId ? { templateId: template.templateId } : {}),
        name: name.trim(),
        description: description.trim() || undefined,
        defaults: {
          colorHex, bgColorHex, errorCorrection, moduleStyle,
          gradient: { enabled: gradientEnabled, from: gradientFrom, to: gradientTo, angle: gradientAngle },
          eyeStyle,
          eyeColors: { outer: eyeOuterColor, inner: eyeInnerColor },
          logoPath: logoPath || undefined,
          logoSizeRatio,
          backgroundLogo: { enabled: backgroundLogoEnabled, logoPath: logoPath || undefined, opacity: backgroundLogoOpacity },
          quietZone,
        },
      });
      toast({
        title: template ? 'QR Template updated' : 'QR Template saved',
        description: template
          ? 'The retailer-scoped presentation template was updated without changing its template identity.'
          : 'The retailer-scoped presentation template is available for reuse.',
      });
      onSave();
    } catch (error) {
      toast({ title: 'QR Template could not be saved', description: error instanceof Error ? error.message : 'Save failed.', variant: 'destructive' });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{template ? 'Edit QR Template' : 'Create QR Template'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {template
            ? 'Update this reusable retailer-branded physical QR presentation. Editing presentation never changes QR identity.'
            : 'Design a reusable retailer-branded physical QR presentation. Presentation never changes QR identity.'}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Template Details</CardTitle><CardDescription>Name this reusable presentation.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label htmlFor="template-name">Template Name</Label><Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Shelf Presentation" /></div>
              <div className="grid gap-2"><Label htmlFor="template-description">Description</Label><Textarea id="template-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Where should this presentation be used?" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Logo &amp; Background</CardTitle><CardDescription>Apply retailer-owned brand assets without changing QR identity.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-md border bg-white">
                  {logoPath ? <img src={logoPath} alt="Retailer logo preview" className="max-h-16 max-w-24 object-contain" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Label htmlFor="logo-upload" className="inline-flex h-10 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"><Upload className="mr-2 h-4 w-4" />Upload Logo</Label>
                  <Input id="logo-upload" type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => void handleLogoUpload(e)} />
                  {logoPath ? <Button type="button" variant="outline" onClick={() => { setLogoPath(''); setBackgroundLogoEnabled(false); }}><X className="mr-2 h-4 w-4" />Remove</Button> : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Transparent PNG or SVG is recommended. Assets remain retailer-scoped.</p>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div><Label>Use as background logo</Label><p className="mt-1 text-xs text-muted-foreground">Use the retailer mark as a controlled background watermark.</p></div>
                <Switch checked={backgroundLogoEnabled} disabled={!logoPath} onCheckedChange={setBackgroundLogoEnabled} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><Label>Logo Opacity</Label><span className="text-sm text-muted-foreground">{Math.round(backgroundLogoOpacity * 100)}%</span></div>
                <Slider min={5} max={35} step={1} value={[Math.round(backgroundLogoOpacity * 100)]} disabled={!backgroundLogoEnabled} onValueChange={(v) => setBackgroundLogoOpacity(v[0] / 100)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Colours &amp; Gradient</CardTitle><CardDescription>Configure the retailer presentation palette.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Foreground</Label><div className="flex gap-2"><Input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-10 w-16 p-1" /><Input value={colorHex} onChange={(e) => setColorHex(e.target.value)} /></div></div>
                <div className="space-y-2"><Label>Background</Label><div className="flex gap-2"><Input type="color" value={bgColorHex} onChange={(e) => setBgColorHex(e.target.value)} className="h-10 w-16 p-1" /><Input value={bgColorHex} onChange={(e) => setBgColorHex(e.target.value)} /></div></div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4"><div><Label>Enable Gradient</Label><p className="mt-1 text-xs text-muted-foreground">Saved for the dedicated rich renderer.</p></div><Switch checked={gradientEnabled} onCheckedChange={setGradientEnabled} /></div>
              {gradientEnabled ? <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>From</Label><Input type="color" value={gradientFrom} onChange={(e) => setGradientFrom(e.target.value)} /></div>
                <div className="space-y-2"><Label>To</Label><Input type="color" value={gradientTo} onChange={(e) => setGradientTo(e.target.value)} /></div>
                <div className="space-y-3 sm:col-span-2"><div className="flex justify-between"><Label>Angle</Label><span>{gradientAngle}°</span></div><Slider min={0} max={360} step={1} value={[gradientAngle]} onValueChange={(v) => setGradientAngle(v[0])} /></div>
              </div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>QR Style</CardTitle><CardDescription>Choose module and finder-eye presentation.</CardDescription></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label>Module Style</Label><Select value={moduleStyle} onValueChange={(v) => setModuleStyle(v as ModuleStyle)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['square','rounded','dots','classy','classy-rounded','extra-rounded'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Eye Style</Label><Select value={eyeStyle} onValueChange={(v) => setEyeStyle(v as EyeStyle)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="square">square</SelectItem><SelectItem value="rounded">rounded</SelectItem><SelectItem value="leaf">leaf</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Outer Eye Colour</Label><Input type="color" value={eyeOuterColor} onChange={(e) => setEyeOuterColor(e.target.value)} /></div>
              <div className="space-y-2"><Label>Inner Eye Colour</Label><Input type="color" value={eyeInnerColor} onChange={(e) => setEyeInnerColor(e.target.value)} /></div>
              <div className="space-y-3 sm:col-span-2"><div className="flex justify-between"><Label>Quiet Zone</Label><span>{quietZone}</span></div><Slider min={4} max={20} step={1} value={[quietZone]} onValueChange={(v) => setQuietZone(v[0])} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Logo Size</CardTitle><CardDescription>Reserve a safe logo ratio for rich rendering.</CardDescription></CardHeader>
            <CardContent className="space-y-3"><div className="flex justify-between"><Label>Logo Ratio</Label><span>{Math.round(logoSizeRatio * 100)}%</span></div><Slider min={10} max={30} step={1} value={[Math.round(logoSizeRatio * 100)]} onValueChange={(v) => setLogoSizeRatio(v[0] / 100)} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Error Correction</CardTitle><CardDescription>Medium is the default; higher levels provide more resilience.</CardDescription></CardHeader>
            <CardContent><Select value={errorCorrection} onValueChange={(v) => setErrorCorrection(v as ErrorCorrection)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L">L — Low</SelectItem><SelectItem value="M">M — Medium · Recommended</SelectItem><SelectItem value="Q">Q — Quartile</SelectItem><SelectItem value="H">H — High</SelectItem></SelectContent></Select></CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Live Preview</CardTitle><CardDescription>Real encoded QR using safe example content.</CardDescription></div><Badge variant="secondary">Preview Only</Badge></div></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative flex min-h-[390px] items-center justify-center overflow-hidden rounded-xl border p-6" style={{ backgroundColor: bgColorHex }}>
                {backgroundLogoEnabled && logoPath ? <img src={logoPath} alt="" aria-hidden="true" className="pointer-events-none absolute z-20 max-h-[55%] max-w-[55%] object-contain" style={{ opacity: backgroundLogoOpacity }} /> : null}
                <div ref={previewContainerRef} aria-label="QR presentation preview" className="relative z-10 flex w-full max-w-[360px] items-center justify-center [&>svg]:h-auto [&>svg]:w-full" />
                {previewError ? null : <span className="sr-only">Rich QR preview rendered.</span>}
              </div>
              <p className="text-xs text-muted-foreground">Preview only: no Campaign, Activation, Deployment or QR identity is created.</p>
              <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">This preview uses the dedicated presentation renderer, including module style, gradient, finder-eye styling, centre logo and controlled background-logo composition.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Scan Safety</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Good colour contrast</span><Badge variant={contrastSafe ? 'secondary' : 'destructive'}>{contrastSafe ? 'Pass' : 'Review'}</Badge></div>
              <div className="flex justify-between"><span>Logo opacity is safe</span><Badge variant={backgroundLogoSafe ? 'secondary' : 'destructive'}>{backgroundLogoSafe ? 'Pass' : 'Review'}</Badge></div>
              <div className="flex justify-between"><span>Quiet zone maintained</span><Badge variant="secondary">Pass</Badge></div>
              <div className="flex justify-between"><span>Error correction</span><Badge variant="outline">{errorCorrection}</Badge></div>
              <div className="flex justify-between border-t pt-3 font-medium"><span>Design is scannable</span><span className="flex items-center gap-1"><CheckCircle2 className={designSafe ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4 text-destructive'} />{designSafe ? 'Ready' : 'Review'}</span></div>
              {previewError ? <p className="text-xs text-destructive">{previewError}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview Destination</CardTitle>
              <CardDescription>The live preview updates automatically. This safe example URL is not a deployed QR identity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">{PREVIEW_URL}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        {onCancel ? <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button> : null}
        <Button type="button" disabled={busy || !designSafe} onClick={() => void handleSave()}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Template</Button>
      </div>
    </div>
  );
}
