'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Archive,
  BarChart2,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Store,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  listCampaignManagement,
  type CampaignManagementItem,
} from '@/ai/flows/list-campaign-management';
import { createCampaign } from '@/ai/flows/create-campaign';
import { updateCampaign } from '@/ai/flows/update-campaign';
import { archiveCampaign } from '@/ai/flows/archive-campaign';

type CampaignFormState = {
  name: string;
  description: string;
  purpose: string;
  objective: string;
  startAt: string;
  endAt: string;
  timezone: string;
};

const emptyCampaignForm: CampaignFormState = {
  name: '',
  description: '',
  purpose: '',
  objective: '',
  startAt: '',
  endAt: '',
  timezone: '',
};

function formatDateTime(
  value?: string,
  timezone?: string
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function toDateTimeLocal(value?: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (number: number) => String(number).padStart(2, '0');

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('');
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function CampaignFormFields({
  form,
  setForm,
  isEdit,
}: {
  form: CampaignFormState;
  setForm: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  isEdit: boolean;
}) {
  const updateField = (
    field: keyof CampaignFormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="campaign-name">Name *</Label>
        <Input
          id="campaign-name"
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="e.g. Spring Beauty Discovery"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="campaign-description">Description</Label>
        <Textarea
          id="campaign-description"
          value={form.description}
          onChange={(event) =>
            updateField('description', event.target.value)
          }
          placeholder="Describe this Campaign."
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="campaign-purpose">Purpose</Label>
          <Input
            id="campaign-purpose"
            value={form.purpose}
            onChange={(event) =>
              updateField('purpose', event.target.value)
            }
            placeholder="Commercial purpose"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="campaign-objective">Objective</Label>
          <Input
            id="campaign-objective"
            value={form.objective}
            onChange={(event) =>
              updateField('objective', event.target.value)
            }
            placeholder="Operational objective"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="campaign-start">Start date/time</Label>
          <Input
            id="campaign-start"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) =>
              updateField('startAt', event.target.value)
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="campaign-end">End date/time</Label>
          <Input
            id="campaign-end"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) =>
              updateField('endAt', event.target.value)
            }
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="campaign-timezone">Timezone</Label>
        <Input
          id="campaign-timezone"
          value={form.timezone}
          onChange={(event) =>
            updateField('timezone', event.target.value)
          }
          placeholder="e.g. Africa/Johannesburg"
        />
        <p className="text-xs text-muted-foreground">
          Dates are interpreted using your browser local time before being
          sent to the server.
          {isEdit
            ? ' Existing schedule values can be changed but are not cleared by omission.'
            : ''}
        </p>
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  onEdit,
  onArchive,
}: {
  campaign: CampaignManagementItem;
  onEdit: (campaign: CampaignManagementItem) => void;
  onArchive: (campaign: CampaignManagementItem) => void;
}) {
  const isArchived = campaign.status === 'ARCHIVED';
  const startAt = formatDateTime(campaign.startAt, campaign.timezone);
  const endAt = formatDateTime(campaign.endAt, campaign.timezone);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{campaign.name}</CardTitle>
            {campaign.description ? (
              <CardDescription>{campaign.description}</CardDescription>
            ) : null}
          </div>

          <Badge variant={isArchived ? 'secondary' : 'outline'}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {campaign.purpose || campaign.objective ? (
          <div className="grid gap-4 md:grid-cols-2">
            {campaign.purpose ? (
              <div>
                <p className="text-sm font-medium">Purpose</p>
                <p className="text-sm text-muted-foreground">
                  {campaign.purpose}
                </p>
              </div>
            ) : null}

            {campaign.objective ? (
              <div>
                <p className="text-sm font-medium">Objective</p>
                <p className="text-sm text-muted-foreground">
                  {campaign.objective}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {startAt || endAt || campaign.timezone ? (
          <div className="grid gap-3 text-sm md:grid-cols-3">
            {startAt ? (
              <div>
                <p className="font-medium">Starts</p>
                <p className="text-muted-foreground">{startAt}</p>
              </div>
            ) : null}

            {endAt ? (
              <div>
                <p className="font-medium">Ends</p>
                <p className="text-muted-foreground">{endAt}</p>
              </div>
            ) : null}

            {campaign.timezone ? (
              <div>
                <p className="font-medium">Timezone</p>
                <p className="text-muted-foreground">
                  {campaign.timezone}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {!isArchived ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm">
              <Link href="/retailer-mvp/qr-management">
                <Store className="mr-2 h-4 w-4" />
                Activate Shelves
              </Link>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onEdit(campaign)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onArchive(campaign)}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CampaignManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = React.useState<
    CampaignManagementItem[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadFailed, setLoadFailed] = React.useState(false);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editCampaign, setEditCampaign] =
    React.useState<CampaignManagementItem | null>(null);
  const [archiveTarget, setArchiveTarget] =
    React.useState<CampaignManagementItem | null>(null);

  const [createForm, setCreateForm] =
    React.useState<CampaignFormState>({
      ...emptyCampaignForm,
      timezone: getBrowserTimezone(),
    });
  const [editForm, setEditForm] =
    React.useState<CampaignFormState>(emptyCampaignForm);

  const [isCreating, setIsCreating] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);

  const loadCampaigns = React.useCallback(async () => {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadFailed(false);

    try {
      const idToken = await authenticatedUser.getIdToken();

      const result = await listCampaignManagement({
        idToken,
        retailerId,
      });

      setCampaigns(result);
    } catch (error) {
      console.error(
        '[Campaign Management] Failed to load Campaigns:',
        error
      );

      setLoadFailed(true);

      toast({
        title: 'Could not load Campaigns',
        description:
          'Canonical Campaign records could not be loaded.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  function validateForm(form: CampaignFormState): string | null {
    if (!form.name.trim()) {
      return 'Campaign name is required.';
    }

    if (form.startAt && !toIsoDateTime(form.startAt)) {
      return 'Start date/time is invalid.';
    }

    if (form.endAt && !toIsoDateTime(form.endAt)) {
      return 'End date/time is invalid.';
    }

    if (form.startAt && form.endAt) {
      const start = new Date(form.startAt);
      const end = new Date(form.endAt);

      if (end.getTime() < start.getTime()) {
        return 'End date/time cannot be before the start date/time.';
      }
    }

    return null;
  }

  async function handleCreate() {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId) {
      toast({
        title: 'Campaign could not be created',
        description: 'An authenticated retailer context is required.',
        variant: 'destructive',
      });
      return;
    }

    const validationError = validateForm(createForm);

    if (validationError) {
      toast({
        title: 'Check Campaign details',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const idToken = await authenticatedUser.getIdToken();

      await createCampaign({
        idToken,
        retailerId,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        purpose: createForm.purpose.trim() || undefined,
        objective: createForm.objective.trim() || undefined,
        startAt: toIsoDateTime(createForm.startAt),
        endAt: toIsoDateTime(createForm.endAt),
        timezone: createForm.timezone.trim() || undefined,
      });

      toast({
        title: 'Campaign created',
        description:
          'The Campaign is ready to organize shelf activations.',
      });

      setCreateOpen(false);
      setCreateForm({
        ...emptyCampaignForm,
        timezone: getBrowserTimezone(),
      });

      await loadCampaigns();
    } catch (error) {
      console.error(
        '[Campaign Management] Failed to create Campaign:',
        error
      );

      toast({
        title: 'Campaign could not be created',
        description:
          error instanceof Error
            ? error.message
            : 'The Campaign command failed.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }

  function beginEdit(campaign: CampaignManagementItem) {
    if (campaign.status === 'ARCHIVED') {
      return;
    }

    setEditForm({
      name: campaign.name,
      description: campaign.description ?? '',
      purpose: campaign.purpose ?? '',
      objective: campaign.objective ?? '',
      startAt: toDateTimeLocal(campaign.startAt),
      endAt: toDateTimeLocal(campaign.endAt),
      timezone: campaign.timezone ?? getBrowserTimezone(),
    });

    setEditCampaign(campaign);
  }

  async function handleUpdate() {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId || !editCampaign) {
      return;
    }

    const validationError = validateForm(editForm);

    if (validationError) {
      toast({
        title: 'Check Campaign details',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const idToken = await authenticatedUser.getIdToken();

      const updateInput: Parameters<typeof updateCampaign>[0] = {
        idToken,
        retailerId,
        campaignId: editCampaign.campaignId,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        purpose: editForm.purpose.trim(),
        objective: editForm.objective.trim(),
      };

      if (editForm.startAt) {
        updateInput.startAt = toIsoDateTime(editForm.startAt);
      }

      if (editForm.endAt) {
        updateInput.endAt = toIsoDateTime(editForm.endAt);
      }

      if (editForm.timezone.trim()) {
        updateInput.timezone = editForm.timezone.trim();
      }

      await updateCampaign(updateInput);

      toast({
        title: 'Campaign updated',
        description: 'Campaign business details were saved.',
      });

      setEditCampaign(null);
      await loadCampaigns();
    } catch (error) {
      console.error(
        '[Campaign Management] Failed to update Campaign:',
        error
      );

      toast({
        title: 'Campaign could not be updated',
        description:
          error instanceof Error
            ? error.message
            : 'The Campaign update command failed.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleArchive() {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId || !archiveTarget) {
      return;
    }

    setIsArchiving(true);

    try {
      const idToken = await authenticatedUser.getIdToken();

      await archiveCampaign({
        idToken,
        retailerId,
        campaignId: archiveTarget.campaignId,
      });

      toast({
        title: 'Campaign archived',
        description:
          'The Campaign remains preserved for historical reference.',
      });

      setArchiveTarget(null);
      await loadCampaigns();
    } catch (error) {
      console.error(
        '[Campaign Management] Failed to archive Campaign:',
        error
      );

      toast({
        title: 'Campaign could not be archived',
        description:
          error instanceof Error
            ? error.message
            : 'The Campaign archive command failed.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  }

  const currentCampaigns = campaigns.filter(
    (campaign) => campaign.status !== 'ARCHIVED'
  );

  const archivedCampaigns = campaigns.filter(
    (campaign) => campaign.status === 'ARCHIVED'
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground">
            Create and manage the Campaigns that organize your shelf activations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/retailer-mvp/qr-analytics">
              <BarChart2 className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </Button>

          <Button
            type="button"
            onClick={() => {
              setCreateForm({
                ...emptyCampaignForm,
                timezone: getBrowserTimezone(),
              });
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </header>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Campaigns...
          </CardContent>
        </Card>
      ) : loadFailed ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">Campaigns could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No Campaign data is being shown because the canonical read failed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Current Campaigns
              </h2>
              <p className="text-sm text-muted-foreground">
                Campaigns available for ongoing retail operations.
              </p>
            </div>

            {currentCampaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Megaphone className="mb-4 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">No Campaigns yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first Campaign before activating shelves.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {currentCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.campaignId}
                    campaign={campaign}
                    onEdit={beginEdit}
                    onArchive={setArchiveTarget}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Archived Campaigns
              </h2>
              <p className="text-sm text-muted-foreground">
                Historical Campaign records preserved for reference.
              </p>
            </div>

            {archivedCampaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No Campaigns have been archived.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {archivedCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.campaignId}
                    campaign={campaign}
                    onEdit={beginEdit}
                    onArchive={setArchiveTarget}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Create the commercial and operational container for new shelf
              activations. Status and identity are controlled by the server.
            </DialogDescription>
          </DialogHeader>

          <CampaignFormFields
            form={createForm}
            setForm={setCreateForm}
            isEdit={false}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editCampaign)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            setEditCampaign(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update Campaign business details. Lifecycle status remains
              server-controlled.
            </DialogDescription>
          </DialogHeader>

          <CampaignFormFields
            form={editForm}
            setForm={setEditForm}
            isEdit
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditCampaign(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open && !isArchiving) {
            setArchiveTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving removes this Campaign from new Activation selection
              while preserving its historical record. There is currently no
              retailer unarchive action.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleArchive();
              }}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              Archive Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
