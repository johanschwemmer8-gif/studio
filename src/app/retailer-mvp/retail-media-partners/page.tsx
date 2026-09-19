'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  createRetailMediaPartner,
  listRetailMediaPartners,
  setRetailMediaPartnerStatus,
  updateRetailMediaPartner,
} from '@/lib/retail-media-partner-server';
import type { RetailMediaPartner } from '@/lib/schemas/retail-media-partner';

type PartnerFormState = {
  name: string;
  logoUrl: string;
  websiteUrl: string;
};

const emptyForm: PartnerFormState = {
  name: '',
  logoUrl: '',
  websiteUrl: '',
};

function optionalUrl(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function RetailMediaPartnersPage() {
  const { user, loading: authLoading } = useAuth();

  const [partners, setPartners] = useState<RetailMediaPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerFormState>(emptyForm);

  const loadPartners = useCallback(async () => {
    if (!user) {
      setPartners([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const result = await listRetailMediaPartners({ idToken });
      setPartners(result);
    } catch (loadError) {
      console.error(
        '[Retail Media Partners] Failed to load Partners:',
        loadError
      );
      setError('Could not load Retail Media Partners.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      void loadPartners();
    }
  }, [authLoading, loadPartners]);

  const resetForm = () => {
    setEditingPartnerId(null);
    setForm(emptyForm);
  };

  const beginEdit = (partner: RetailMediaPartner) => {
    setEditingPartnerId(partner.partnerId);
    setForm({
      name: partner.name,
      logoUrl: partner.logoUrl ?? '',
      websiteUrl: partner.websiteUrl ?? '',
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!user) {
      setError('You must be signed in to manage Retail Media Partners.');
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError('Partner name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      if (editingPartnerId) {
        await updateRetailMediaPartner({
          idToken,
          partnerId: editingPartnerId,
          name,
          logoUrl: optionalUrl(form.logoUrl),
          websiteUrl: optionalUrl(form.websiteUrl),
        });
      } else {
        await createRetailMediaPartner({
          idToken,
          name,
          logoUrl: optionalUrl(form.logoUrl),
          websiteUrl: optionalUrl(form.websiteUrl),
        });
      }

      resetForm();
      await loadPartners();
    } catch (saveError) {
      console.error(
        '[Retail Media Partners] Failed to save Partner:',
        saveError
      );
      setError(
        'Could not save the Retail Media Partner. Check the entered details and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (partner: RetailMediaPartner) => {
    if (!user) {
      setError('You must be signed in to manage Retail Media Partners.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      await setRetailMediaPartnerStatus({
        idToken,
        partnerId: partner.partnerId,
        status: partner.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });

      await loadPartners();
    } catch (statusError) {
      console.error(
        '[Retail Media Partners] Failed to change Partner status:',
        statusError
      );
      setError('Could not change the Retail Media Partner status.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Retail Media Partners…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Retail Media Partners
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage the Brands and Suppliers authorized to participate in your
            Retail Media Network. Partners do not own Campaigns, Activations,
            Deployments, or QR identities.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void loadPartners()}
          disabled={saving}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {editingPartnerId ? 'Edit Partner' : 'Add Retail Media Partner'}
          </CardTitle>
          <CardDescription>
            Partner identity is retailer-specific and is used to scope
            sponsored creatives and Retail Media reporting.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Partner Name</Label>
              <Input
                id="partner-name"
                value={form.name}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Nike"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-logo">Logo URL</Label>
              <Input
                id="partner-logo"
                type="url"
                value={form.logoUrl}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    logoUrl: event.target.value,
                  }))
                }
                placeholder="https://…"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-website">Website URL</Label>
              <Input
                id="partner-website"
                type="url"
                value={form.websiteUrl}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    websiteUrl: event.target.value,
                  }))
                }
                placeholder="https://…"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editingPartnerId ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingPartnerId ? 'Save Changes' : 'Add Partner'}
            </Button>

            {editingPartnerId && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Retail Media Partners</CardTitle>
          <CardDescription>
            These Partners are available to the retailer&apos;s Retail Media
            workflow. Sponsored Creatives will be managed separately beneath
            each Partner.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {partners.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No Retail Media Partners yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add the first Brand or Supplier participating in your Retail
                Media Network.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {partners.map(partner => (
                <div
                  key={partner.partnerId}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{partner.name}</p>
                      <Badge
                        variant={
                          partner.status === 'ACTIVE'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {partner.status}
                      </Badge>
                    </div>

                    {partner.websiteUrl && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {partner.websiteUrl}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-muted-foreground">
                      Partner ID: {partner.partnerId}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => beginEdit(partner)}
                      disabled={saving}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant={
                        partner.status === 'ACTIVE'
                          ? 'outline'
                          : 'default'
                      }
                      size="sm"
                      onClick={() => void handleStatusChange(partner)}
                      disabled={saving}
                    >
                      {partner.status === 'ACTIVE'
                        ? 'Deactivate'
                        : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
