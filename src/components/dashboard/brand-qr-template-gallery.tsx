'use client';

import * as React from 'react';
import { Loader2, Palette, Plus } from 'lucide-react';

import { getQrTemplates } from '@/ai/flows/get-qr-templates';
import type { QrTemplate } from '@/lib/schemas/qr-templates';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

import BrandQrTemplateDesigner from './brand-qr-template-designer';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function TemplatePreview({
  template,
}: {
  template: QrTemplate;
}) {
  const foreground = template.defaults.colorHex ?? '#000000';
  const background = template.defaults.bgColorHex ?? '#FFFFFF';

  return (
    <div
      className="flex h-32 items-center justify-center rounded-lg border"
      style={{ backgroundColor: background }}
    >
      <div
        className="grid h-20 w-20 grid-cols-5 gap-1 rounded p-2"
        style={{ backgroundColor: foreground }}
        aria-label="Presentation preview"
      >
        {Array.from({ length: 25 }).map((_, index) => (
          <span
            key={index}
            className="rounded-[1px]"
            style={{
              backgroundColor:
                index % 3 === 0 || index % 7 === 0
                  ? background
                  : foreground,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
}: {
  template: QrTemplate;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">
              {template.name}
            </CardTitle>
            <CardDescription>
              {template.description ||
                'Reusable QR presentation defaults.'}
            </CardDescription>
          </div>

          <Badge variant="outline">Presentation</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <TemplatePreview template={template} />

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              Foreground
            </span>
            <span>
              {template.defaults.colorHex ?? 'Default'}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              Background
            </span>
            <span>
              {template.defaults.bgColorHex ?? 'Default'}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              Error correction
            </span>
            <span>
              {template.defaults.errorCorrection ?? 'Default'}
            </span>
          </div>

          {template.defaults.aiTone ? (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                AI tone default
              </span>
              <span className="text-right">
                {template.defaults.aiTone}
              </span>
            </div>
          ) : null}

          {template.defaults.aiGoal ? (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                AI goal default
              </span>
              <span className="text-right">
                {template.defaults.aiGoal}
              </span>
            </div>
          ) : null}
        </div>

        <p className="break-all text-xs text-muted-foreground">
          Template ID: {template.templateId}
        </p>
      </CardContent>
    </Card>
  );
}

export default function BrandQrTemplateGallery() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [templates, setTemplates] = React.useState<QrTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [designerOpen, setDesignerOpen] = React.useState(false);

  const loadTemplates = React.useCallback(async () => {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadFailed(false);

    try {
      const idToken = await authenticatedUser.getIdToken();

      const result = await getQrTemplates({
        idToken,
        retailerId,
      });

      setTemplates(result);
    } catch (error) {
      console.error('[QR Templates] Read failed:', error);

      setLoadFailed(true);

      toast({
        title: 'Could not load QR Templates',
        description:
          'Canonical retailer templates could not be loaded.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  function handleSaved() {
    setDesignerOpen(false);
    void loadTemplates();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            QR Templates
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Create reusable presentation defaults for QR artifacts.
            Templates are presentation configuration only and do not create
            or replace QR identity.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setDesignerOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create QR Template
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-14 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading QR Templates...
          </CardContent>
        </Card>
      ) : loadFailed ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="font-medium">
              QR Templates could not be loaded.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No template data is shown because the canonical read failed.
            </p>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Palette className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              No QR Templates yet.
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Create a reusable presentation template without changing any
              Campaign, Activation, Deployment, or QR identity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.templateId}
              template={template}
            />
          ))}
        </div>
      )}

      <Dialog
        open={designerOpen}
        onOpenChange={setDesignerOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create QR Template</DialogTitle>
            <DialogDescription>
              Save reusable presentation defaults. This operation does not
              create a QR identity or modify an existing Deployment.
            </DialogDescription>
          </DialogHeader>

          <BrandQrTemplateDesigner
            onSave={handleSaved}
            onCancel={() => setDesignerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
