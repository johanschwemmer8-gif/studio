'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileVideo2,
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
  activateSponsoredCreative,
  createSponsoredCreative,
  listSponsoredCreatives,
  retireSponsoredCreative,
  updateDraftSponsoredCreative,
} from '@/lib/sponsored-creative-server';
import type {
  SponsoredCreative,
  SponsoredCreativeFormat,
} from '@/lib/schemas/sponsored-creative';

type CreativeFormState = {
  format: SponsoredCreativeFormat;
  mediaUrl: string;
  headline: string;
  destinationUrl: string;
};

const emptyForm: CreativeFormState = {
  format: 'VIDEO',
  mediaUrl: '',
  headline: '',
  destinationUrl: '',
};

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function RetailMediaPartnerCreativesPage() {
  const params = useParams<{ partnerId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const partnerId =
    typeof params?.partnerId === 'string' ? params.partnerId : '';

  const [creatives, setCreatives] = useState<SponsoredCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreativeFormState>(emptyForm);
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(
    null
  );

  const loadCreatives = useCallback(async () => {
    if (!user || !partnerId) {
      setCreatives([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      const result = await listSponsoredCreatives({
        idToken,
        partnerId,
      });

      setCreatives(result);
    } catch (loadError) {
      console.error(
        '[Sponsored Creatives] Failed to load Creatives:',
        loadError
      );
      setError('Could not load Sponsored Creatives for this Partner.');
    } finally {
      setLoading(false);
    }
  }, [user, partnerId]);

  useEffect(() => {
    if (!authLoading) {
      void loadCreatives();
    }
  }, [authLoading, loadCreatives]);

  const resetForm = () => {
    setEditingCreativeId(null);
    setForm(emptyForm);
  };

  const beginEdit = (creative: SponsoredCreative) => {
    if (creative.status !== 'DRAFT') {
      return;
    }

    setEditingCreativeId(creative.creativeId);
    setForm({
      format: creative.format,
      mediaUrl: creative.mediaUrl,
      headline: creative.headline ?? '',
      destinationUrl: creative.destinationUrl ?? '',
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!user || !partnerId) {
      setError('A valid Retail Media Partner is required.');
      return;
    }

    const mediaUrl = form.mediaUrl.trim();

    if (!mediaUrl) {
      setError('Media URL is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      if (editingCreativeId) {
        await updateDraftSponsoredCreative({
          idToken,
          creativeId: editingCreativeId,
          partnerId,
          format: form.format,
          mediaUrl,
          headline: optionalText(form.headline),
          destinationUrl: optionalText(form.destinationUrl),
        });
      } else {
        await createSponsoredCreative({
          idToken,
          partnerId,
          format: form.format,
          mediaUrl,
          headline: optionalText(form.headline),
          destinationUrl: optionalText(form.destinationUrl),
        });
      }

      resetForm();
      await loadCreatives();
    } catch (saveError) {
      console.error(
        '[Sponsored Creatives] Failed to save Creative:',
        saveError
      );
      setError(
        'Could not save the Sponsored Creative. Check the entered details and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (creative: SponsoredCreative) => {
    if (!user || !partnerId || creative.status !== 'DRAFT') {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      await activateSponsoredCreative({
        idToken,
        creativeId: creative.creativeId,
        partnerId,
      });

      if (editingCreativeId === creative.creativeId) {
        resetForm();
      }

      await loadCreatives();
    } catch (activateError) {
      console.error(
        '[Sponsored Creatives] Failed to activate Creative:',
        activateError
      );
      setError('Could not activate the Sponsored Creative.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetire = async (creative: SponsoredCreative) => {
    if (!user || !partnerId || creative.status !== 'ACTIVE') {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      await retireSponsoredCreative({
        idToken,
        creativeId: creative.creativeId,
        partnerId,
      });

      await loadCreatives();
    } catch (retireError) {
      console.error(
        '[Sponsored Creatives] Failed to retire Creative:',
        retireError
      );
      setError('Could not retire the Sponsored Creative.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Sponsored Creatives…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/retailer-mvp/retail-media-partners')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retail Media Partners
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Sponsored Creatives
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Manage the sponsored media assets belonging to this Retail Media
              Partner. New Creatives begin as DRAFT and are not shopper-facing
              until activated.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Partner ID: {partnerId}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCreatives()}
            disabled={saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {editingCreativeId
              ? 'Edit Draft Creative'
              : 'Create Sponsored Creative'}
          </CardTitle>
          <CardDescription>
            DRAFT Creatives can be reviewed and edited before they become
            eligible for shopper presentation. Once ACTIVE, shopper-facing
            content is frozen to preserve measurement integrity.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="creative-format">Format</Label>
              <select
                id="creative-format"
                value={form.format}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    format: event.target.value as SponsoredCreativeFormat,
                  }))
                }
                disabled={saving}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="VIDEO">Video</option>
                <option value="BRAND_STRIP">Brand Strip</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creative-media-url">Media URL</Label>
              <Input
                id="creative-media-url"
                type="url"
                value={form.mediaUrl}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    mediaUrl: event.target.value,
                  }))
                }
                placeholder="https://…"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creative-headline">Headline</Label>
              <Input
                id="creative-headline"
                value={form.headline}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    headline: event.target.value,
                  }))
                }
                placeholder="Optional sponsored headline"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creative-destination-url">
                Destination URL
              </Label>
              <Input
                id="creative-destination-url"
                type="url"
                value={form.destinationUrl}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    destinationUrl: event.target.value,
                  }))
                }
                placeholder="Optional https://…"
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
              ) : editingCreativeId ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingCreativeId
                ? 'Save Draft Changes'
                : 'Create Draft Creative'}
            </Button>

            {editingCreativeId && (
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
          <CardTitle>Partner Creatives</CardTitle>
          <CardDescription>
            Each Creative has a stable identity for Retail Media measurement.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {creatives.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FileVideo2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No Sponsored Creatives yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create the first DRAFT Creative for this Partner.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {creatives.map(creative => (
                <div
                  key={creative.creativeId}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {creative.headline || 'Sponsored Creative'}
                        </p>

                        <Badge variant="outline">
                          {creative.format === 'VIDEO'
                            ? 'Video'
                            : 'Brand Strip'}
                        </Badge>

                        <Badge
                          variant={
                            creative.status === 'ACTIVE'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {creative.status}
                        </Badge>
                      </div>

                      <p className="mt-2 truncate text-sm text-muted-foreground">
                        {creative.mediaUrl}
                      </p>

                      {creative.destinationUrl && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          Destination: {creative.destinationUrl}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-muted-foreground">
                        Creative ID: {creative.creativeId}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {creative.status === 'DRAFT' && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => beginEdit(creative)}
                            disabled={saving}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleActivate(creative)}
                            disabled={saving}
                          >
                            Activate
                          </Button>
                        </>
                      )}

                      {creative.status === 'ACTIVE' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleRetire(creative)}
                          disabled={saving}
                        >
                          Retire
                        </Button>
                      )}

                      {creative.status === 'RETIRED' && (
                        <span className="text-xs text-muted-foreground">
                          Historical creative — no further changes permitted.
                        </span>
                      )}
                    </div>
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
