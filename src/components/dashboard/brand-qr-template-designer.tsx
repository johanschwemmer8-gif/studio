'use client';

import * as React from 'react';
import { Loader2, Save } from 'lucide-react';

import { saveQrTemplate } from '@/ai/flows/save-qr-template';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type BrandQrTemplateDesignerProps = {
  onSave: () => void;
  onCancel?: () => void;
};

export default function BrandQrTemplateDesigner({
  onSave,
  onCancel,
}: BrandQrTemplateDesignerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [colorHex, setColorHex] = React.useState('#000000');
  const [bgColorHex, setBgColorHex] = React.useState('#FFFFFF');
  const [logoPath, setLogoPath] = React.useState('');
  const [errorCorrection, setErrorCorrection] =
    React.useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [aiTone, setAiTone] = React.useState('');
  const [aiGoal, setAiGoal] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId) {
      toast({
        title: 'Retailer context unavailable',
        description:
          'You must be authenticated as a retailer to save a QR Template.',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Template name required',
        description: 'Give this presentation template a name.',
        variant: 'destructive',
      });
      return;
    }

    let normalizedLogoPath: string | undefined;

    if (logoPath.trim()) {
      try {
        normalizedLogoPath = new URL(logoPath.trim()).toString();
      } catch {
        toast({
          title: 'Invalid logo URL',
          description:
            'Logo path must be a complete valid URL or left blank.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);

    try {
      const idToken = await authenticatedUser.getIdToken();

      await saveQrTemplate({
        idToken,
        retailerId,
        name: name.trim(),
        description: description.trim() || undefined,
        defaults: {
          colorHex,
          bgColorHex,
          logoPath: normalizedLogoPath,
          errorCorrection,
          aiTone: aiTone.trim() || undefined,
          aiGoal: aiGoal.trim() || undefined,
        },
      });

      toast({
        title: 'QR Template saved',
        description:
          'The reusable presentation defaults are now available in QR Templates.',
      });

      onSave();
    } catch (error) {
      console.error('[QR Templates] Save failed:', error);

      toast({
        title: 'QR Template could not be saved',
        description:
          error instanceof Error
            ? error.message
            : 'The template save command failed.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="qr-template-name">Template name</Label>
        <Input
          id="qr-template-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Standard Shelf Presentation"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="qr-template-description">
          Description
        </Label>
        <Textarea
          id="qr-template-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe where or how this presentation style is intended to be used."
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="qr-template-foreground">
            QR foreground
          </Label>

          <div className="flex gap-2">
            <Input
              id="qr-template-foreground"
              type="color"
              value={colorHex}
              onChange={(event) => setColorHex(event.target.value)}
              className="h-10 w-16 p-1"
            />

            <Input
              value={colorHex}
              onChange={(event) => setColorHex(event.target.value)}
              aria-label="QR foreground hex value"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="qr-template-background">
            QR background
          </Label>

          <div className="flex gap-2">
            <Input
              id="qr-template-background"
              type="color"
              value={bgColorHex}
              onChange={(event) => setBgColorHex(event.target.value)}
              className="h-10 w-16 p-1"
            />

            <Input
              value={bgColorHex}
              onChange={(event) => setBgColorHex(event.target.value)}
              aria-label="QR background hex value"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="qr-template-logo">Logo URL</Label>
        <Input
          id="qr-template-logo"
          type="url"
          value={logoPath}
          onChange={(event) => setLogoPath(event.target.value)}
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Optional presentation asset. This does not affect QR identity.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="qr-template-error-correction">
          Error correction
        </Label>

        <select
          id="qr-template-error-correction"
          value={errorCorrection}
          onChange={(event) =>
            setErrorCorrection(
              event.target.value as 'L' | 'M' | 'Q' | 'H'
            )
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="L">L</option>
          <option value="M">M</option>
          <option value="Q">Q</option>
          <option value="H">H</option>
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="qr-template-ai-tone">
            AI tone default
          </Label>
          <Input
            id="qr-template-ai-tone"
            value={aiTone}
            onChange={(event) => setAiTone(event.target.value)}
            placeholder="e.g. Professional"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="qr-template-ai-goal">
            AI goal default
          </Label>
          <Input
            id="qr-template-ai-goal"
            value={aiGoal}
            onChange={(event) => setAiGoal(event.target.value)}
            placeholder="e.g. Product education"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        This template stores reusable presentation defaults only. Saving it
        does not create a QR identity, change an Activation, or alter a
        Deployment.
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}

        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Template
        </Button>
      </div>
    </div>
  );
}
