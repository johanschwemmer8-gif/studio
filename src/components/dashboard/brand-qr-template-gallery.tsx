'use client';

import * as React from 'react';
import { Loader2, Palette, Pencil, Plus } from 'lucide-react';

import { getQrTemplates } from '@/ai/flows/get-qr-templates';
import type { QrTemplate } from '@/lib/schemas/qr-templates';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import BrandQrTemplateDesigner from './brand-qr-template-designer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function TemplatePresentationSummary({ template }: { template: QrTemplate }) {
  const defaults = template.defaults;
  const logoPath = defaults.logoPath ?? defaults.backgroundLogo.logoPath;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <span
          className="h-9 w-9 rounded-md border"
          style={{ backgroundColor: defaults.colorHex }}
          aria-label={`Foreground ${defaults.colorHex}`}
        />
        <span
          className="h-9 w-9 rounded-md border"
          style={{ backgroundColor: defaults.bgColorHex }}
          aria-label={`Background ${defaults.bgColorHex}`}
        />
        {logoPath ? (
          <div className="flex h-10 min-w-16 flex-1 items-center justify-end overflow-hidden">
            <img src={logoPath} alt="Saved retailer logo" className="max-h-10 max-w-28 object-contain" />
          </div>
        ) : (
          <span className="ml-auto text-xs text-muted-foreground">No logo</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{defaults.moduleStyle}</Badge>
        <Badge variant="secondary">{defaults.eyeStyle} eyes</Badge>
        {defaults.gradient.enabled ? <Badge variant="secondary">Gradient</Badge> : null}
        {defaults.backgroundLogo.enabled ? <Badge variant="secondary">Background logo</Badge> : null}
      </div>
    </div>
  );
}

function TemplateCard({ template, onEdit }: { template: QrTemplate; onEdit: (template: QrTemplate) => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle className="text-lg">{template.name}</CardTitle><CardDescription>{template.description || 'Reusable physical QR presentation.'}</CardDescription></div>
          <Badge variant="outline">Presentation</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TemplatePresentationSummary template={template} />
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Foreground</span><span>{template.defaults.colorHex}</span></div>
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Background</span><span>{template.defaults.bgColorHex}</span></div>
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Module style</span><span>{template.defaults.moduleStyle}</span></div>
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Eye style</span><span>{template.defaults.eyeStyle}</span></div>
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Error correction</span><span>{template.defaults.errorCorrection}</span></div>
          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Quiet zone</span><span>{template.defaults.quietZone}</span></div>
        </div>
        <p className="break-all text-xs text-muted-foreground">Template ID: {template.templateId}</p>
        <Button type="button" variant="outline" className="w-full" onClick={() => onEdit(template)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Template
        </Button>
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
  const [selectedTemplate, setSelectedTemplate] = React.useState<QrTemplate | null>(null);

  const loadTemplates = React.useCallback(async () => {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;
    if (!authenticatedUser || !retailerId) { setTemplates([]); setLoading(false); return; }
    setLoading(true);
    setLoadFailed(false);
    try {
      const result = await getQrTemplates({ idToken: await authenticatedUser.getIdToken(), retailerId });
      setTemplates(result);
    } catch (error) {
      console.error('[QR Templates] Read failed:', error);
      setLoadFailed(true);
      toast({ title: 'Could not load QR Templates', description: 'Canonical retailer templates could not be loaded.', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [user, toast]);

  React.useEffect(() => { void loadTemplates(); }, [loadTemplates]);

  function openCreate() {
    setSelectedTemplate(null);
    setDesignerOpen(true);
  }

  function openEdit(template: QrTemplate) {
    setSelectedTemplate(template);
    setDesignerOpen(true);
  }

  function closeDesigner() {
    setDesignerOpen(false);
    setSelectedTemplate(null);
  }

  function handleSaved() {
    closeDesigner();
    void loadTemplates();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QR Templates</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Create reusable physical QR presentation templates. Templates never create or replace QR identity.</p>
        </div>
        <Button type="button" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create QR Template</Button>
      </div>

      {loading ? (
        <Card><CardContent className="flex items-center justify-center gap-2 py-14 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading QR Templates...</CardContent></Card>
      ) : loadFailed ? (
        <Card><CardContent className="py-14 text-center"><p className="font-medium">QR Templates could not be loaded.</p><p className="mt-1 text-sm text-muted-foreground">No template data is shown because the canonical read failed.</p></CardContent></Card>
      ) : templates.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center"><Palette className="mb-4 h-10 w-10 text-muted-foreground" /><p className="font-medium">No QR Templates yet.</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Create a reusable presentation template without changing Campaign, Activation, Deployment or QR identity.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.templateId} template={template} onEdit={openEdit} />
          ))}
        </div>
      )}

      <Dialog
        open={designerOpen}
        onOpenChange={(open) => {
          if (!open) closeDesigner();
        }}
      >
        <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit QR Template' : 'Create QR Template'}</DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? 'Update this reusable physical QR presentation. Template identity remains unchanged.'
                : 'Design and save a reusable physical QR presentation. This does not create QR identity or modify Deployment.'}
            </DialogDescription>
          </DialogHeader>
          <BrandQrTemplateDesigner
            key={selectedTemplate?.templateId ?? 'create'}
            template={selectedTemplate ?? undefined}
            onSave={handleSaved}
            onCancel={closeDesigner}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
