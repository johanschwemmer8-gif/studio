'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  Loader2,
  MapPin,
  PackageCheck,
  Printer,
  QrCode,
  RefreshCw,
  Store,
  Wrench,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

import { approveActivation } from '@/ai/flows/approve-activation';
import { assignDeployment } from '@/ai/flows/assign-deployment';
import { bindQrToDeployment } from '@/ai/flows/bind-qr-to-deployment';
import { generateDeploymentPack } from '@/ai/flows/generate-deployment-pack';
import { getQrTemplates } from '@/ai/flows/get-qr-templates';
import type { QrTemplate } from '@/lib/schemas/qr-templates';
import {
  listDeploymentOperations,
  type DeploymentOperationsItem,
} from '@/ai/flows/list-deployment-operations';
import { markDeploymentDeployed } from '@/ai/flows/mark-deployment-deployed';
import { markDeploymentPrinted } from '@/ai/flows/mark-deployment-printed';
import { regenerateQrCode } from '@/ai/flows/regenerate-qr-code';
import { removeDeployment } from '@/ai/flows/remove-deployment';
import { reportDeploymentProblem } from '@/ai/flows/report-deployment-problem';
import { resolveDeploymentProblem } from '@/ai/flows/resolve-deployment-problem';
import { scheduleActivation } from '@/ai/flows/schedule-activation';
import { submitActivation } from '@/ai/flows/submit-activation';

type ArtifactPreview = {
  title: string;
  qrCodeId: string;
  trackingUrl: string;
  qrImageDataUrl: string;
  details?: {
    campaignName: string;
    activationName: string;
    storeName: string;
    placement: unknown;
  };
};

type CommandName =
  | 'assign'
  | 'bind'
  | 'pack'
  | 'printed'
  | 'deployed'
  | 'reprint'
  | 'resolve'
  | 'remove';

type ActivationCommandName = 'submit' | 'approve';

function formatStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

function formatPlacement(placement: unknown): string {
  if (typeof placement === 'string') {
    return placement;
  }

  if (
    placement &&
    typeof placement === 'object'
  ) {
    return Object.entries(placement as Record<string, unknown>)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(' · ');
  }

  return 'Placement details unavailable';
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function qrArtifactFilename(dataUrl: string, qrCodeId: string) {
  const extension = dataUrl.startsWith('data:image/svg+xml') ? 'svg' : 'png';
  return qrCodeId + '.' + extension;
}

function DeploymentCard({
  item,
  busyCommand,
  qrTemplates,
  selectedTemplateId,
  onTemplateChange,
  onCommand,
  onActivationCommand,
  onOpenSchedule,
  activationBusyCommand,
  onReportProblem,
  onRemove,
}: {
  item: DeploymentOperationsItem;
  busyCommand: string | null;
  qrTemplates: QrTemplate[];
  selectedTemplateId?: string;
  onTemplateChange: (deploymentId: string, templateId: string) => void;
  onCommand: (item: DeploymentOperationsItem, command: CommandName) => void;
  onActivationCommand: (
    item: DeploymentOperationsItem,
    command: ActivationCommandName
  ) => void;
  onOpenSchedule: (item: DeploymentOperationsItem) => void;
  activationBusyCommand: string | null;
  onReportProblem: (item: DeploymentOperationsItem) => void;
  onRemove: (item: DeploymentOperationsItem) => void;
}) {
  const removed = Boolean(item.removedAt);
  const problem = item.status === 'PROBLEM_REPORTED';
  const busy = busyCommand?.startsWith(`${item.deploymentId}:`) ?? false;
  const activationBusy =
    activationBusyCommand?.startsWith(`${item.activationId}:`) ?? false;

  function actionButton(
    command: CommandName,
    label: string,
    icon: React.ReactNode,
    variant: 'default' | 'outline' | 'secondary' = 'outline',
    disabled = false
  ) {
    const active = busyCommand === `${item.deploymentId}:${command}`;

    return (
      <Button
        type="button"
        size="sm"
        variant={variant}
        disabled={busy || disabled}
        onClick={() => onCommand(item, command)}
      >
        {active ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          icon
        )}
        {label}
      </Button>
    );
  }

  return (
    <Card className={removed ? 'opacity-75' : undefined}>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Store className="h-5 w-5" />
              {item.storeName}
            </CardTitle>
            <CardDescription className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {formatPlacement(item.placement)}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={problem ? 'destructive' : 'outline'}>
              {formatStatus(item.status)}
            </Badge>

            {removed ? (
              <Badge variant="secondary">REMOVED</Badge>
            ) : null}

            {item.qrStatus ? (
              <Badge variant="secondary">
                QR {formatStatus(item.qrStatus)}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="font-medium">Campaign</p>
            <p className="text-muted-foreground">{item.campaignName}</p>
          </div>

          <div>
            <p className="font-medium">Activation</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-muted-foreground">{item.activationName}</p>
              <Badge variant="outline">
                {formatStatus(item.activationStatus)}
              </Badge>
            </div>
          </div>

          <div>
            <p className="font-medium">Activation target</p>
            <p className="text-muted-foreground">
              {formatPlacement(item.activationTarget)}
            </p>
          </div>

          <div>
            <p className="font-medium">Deployment ID</p>
            <p className="break-all text-muted-foreground">
              {item.deploymentId}
            </p>
          </div>

          {item.qrCodeId ? (
            <div>
              <p className="font-medium">QR Identity</p>
              <p className="break-all text-muted-foreground">
                {item.qrCodeId}
              </p>
            </div>
          ) : null}

          {item.trackingUrl ? (
            <div>
              <p className="font-medium">Tracking URL</p>
              <p className="break-all text-muted-foreground">
                {item.trackingUrl}
              </p>
            </div>
          ) : null}
        </div>

        {!removed ? (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Activation Operations</p>
                <p className="text-sm text-muted-foreground">
                  Shopper availability is governed separately from the physical
                  Deployment lifecycle.
                </p>
              </div>
              <Badge variant="outline">
                {formatStatus(item.activationStatus)}
              </Badge>
            </div>

            {item.activationStatus === 'DRAFT' &&
            !item.activationSubmittedAt ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This Activation has not yet been submitted for operation.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={activationBusy}
                  onClick={() => onActivationCommand(item, 'submit')}
                >
                  {activationBusyCommand === `${item.activationId}:submit` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Submit Activation
                </Button>
              </div>
            ) : null}

            {item.activationStatus === 'PENDING_APPROVAL' &&
            item.activationApprovalRequired &&
            !item.activationApprovedAt ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This Activation requires approval before it can be activated
                  or scheduled.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={activationBusy}
                  onClick={() => onActivationCommand(item, 'approve')}
                >
                  {activationBusyCommand === `${item.activationId}:approve` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Approve Activation
                </Button>
              </div>
            ) : null}

            {item.activationStatus === 'DRAFT' &&
            Boolean(item.activationSubmittedAt) &&
            (!item.activationApprovalRequired ||
              Boolean(item.activationApprovedAt)) ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This Activation is authorised to be activated now or
                  scheduled for a future start.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={activationBusy}
                  onClick={() => onOpenSchedule(item)}
                >
                  Activate / Schedule
                </Button>
              </div>
            ) : null}

            {item.activationStatus === 'ACTIVE' ? (
              <p className="text-sm text-muted-foreground">
                This Activation is operational for shopper resolution.
              </p>
            ) : null}

            {item.activationStatus === 'SCHEDULED' ? (
              <p className="text-sm text-muted-foreground">
                This Activation is scheduled to become operational
                {item.activationStartAt
                  ? ` at ${new Date(item.activationStartAt).toLocaleString()}.`
                  : '.'}
              </p>
            ) : null}
          </div>
        ) : null}

        {problem ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Deployment problem reported</AlertTitle>
            <AlertDescription>
              {item.problemReason || 'No problem reason is available.'}
              {item.problemPreviousStatus
                ? ` Previous state: ${formatStatus(item.problemPreviousStatus)}.`
                : ''}
            </AlertDescription>
          </Alert>
        ) : null}

        {removed ? (
          <Alert>
            <Archive className="h-4 w-4" />
            <AlertTitle>Deployment removed</AlertTitle>
            <AlertDescription>
              This historical Deployment is preserved as read-only. Its
              lifecycle evidence has not been deleted.
            </AlertDescription>
          </Alert>
        ) : null}

        {!removed ? (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {problem ? (
              actionButton(
                'resolve',
                'Resolve Problem',
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )
            ) : (
              <>
                {item.status === 'NOT_ASSIGNED'
                  ? ['SCHEDULED', 'ACTIVE'].includes(item.activationStatus)
                    ? actionButton(
                        'assign',
                        'Begin Preparation',
                        <Wrench className="mr-2 h-4 w-4" />,
                        'default'
                      )
                    : (
                        <Button
                          type="button"
                          size="sm"
                          disabled
                          title="Activate or schedule this Activation before preparing its Deployment."
                        >
                          <Wrench className="mr-2 h-4 w-4" />
                          Begin Preparation
                        </Button>
                      )
                  : null}

                {item.status === 'ASSIGNED'
                  ? actionButton(
                      'bind',
                      'Prepare QR',
                      <QrCode className="mr-2 h-4 w-4" />,
                      'default'
                    )
                  : null}

                {item.qrCodeId &&
                ['READY_TO_PRINT', 'PRINTED', 'DEPLOYED'].includes(item.status) ? (
                  <div className="w-full space-y-2 rounded-lg border bg-muted/20 p-3">
                    <Label htmlFor={"qr-template-" + item.deploymentId}>
                      QR Presentation
                    </Label>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={(templateId) =>
                        onTemplateChange(item.deploymentId, templateId)
                      }
                      disabled={busy || qrTemplates.length === 0}
                    >
                      <SelectTrigger id={"qr-template-" + item.deploymentId}>
                        <SelectValue placeholder="Select a QR Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {qrTemplates.map((template) => (
                          <SelectItem
                            key={template.templateId}
                            value={template.templateId}
                          >
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {qrTemplates.length === 0
                        ? 'No saved QR Templates are available. Create a QR Template before generating or reprinting a branded QR artifact.'
                        : 'The selected template controls only the printable QR appearance. QR identity and tracking URL remain unchanged.'}
                    </p>
                  </div>
                ) : null}

                {item.status === 'READY_TO_PRINT' ? (
                  <>
                    {actionButton(
                      'pack',
                      'Generate Deployment Pack',
                      <PackageCheck className="mr-2 h-4 w-4" />,
                      'default',
                      selectedTemplateId === undefined
                    )}

                    {actionButton(
                      'printed',
                      'Mark as Printed',
                      <Printer className="mr-2 h-4 w-4" />
                    )}
                  </>
                ) : null}

                {item.status === 'PRINTED'
                  ? actionButton(
                      'deployed',
                      'Mark as Deployed',
                      <CheckCircle2 className="mr-2 h-4 w-4" />,
                      'default'
                    )
                  : null}

                {item.qrCodeId &&
                ['READY_TO_PRINT', 'PRINTED', 'DEPLOYED'].includes(item.status)
                  ? actionButton(
                      'reprint',
                      'Reprint QR',
                      <RefreshCw className="mr-2 h-4 w-4" />,
                      'outline',
                      selectedTemplateId === undefined
                    )
                  : null}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onReportProblem(item)}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Problem
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onRemove(item)}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Remove Deployment
                </Button>
              </>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DeploymentOperations() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = React.useState<DeploymentOperationsItem[]>([]);
  const [qrTemplates, setQrTemplates] = React.useState<QrTemplate[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [busyCommand, setBusyCommand] = React.useState<string | null>(null);
  const [activationBusyCommand, setActivationBusyCommand] =
    React.useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] =
    React.useState<DeploymentOperationsItem | null>(null);
  const [scheduleMode, setScheduleMode] =
    React.useState<'now' | 'later'>('now');
  const [scheduleStartAt, setScheduleStartAt] = React.useState('');
  const [scheduleEndAt, setScheduleEndAt] = React.useState('');
  const [scheduleTimezone, setScheduleTimezone] = React.useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [isSchedulingActivation, setIsSchedulingActivation] =
    React.useState(false);

  const [problemTarget, setProblemTarget] =
    React.useState<DeploymentOperationsItem | null>(null);
  const [problemReason, setProblemReason] = React.useState('');
  const [isReportingProblem, setIsReportingProblem] = React.useState(false);

  const [removeTarget, setRemoveTarget] =
    React.useState<DeploymentOperationsItem | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const [artifact, setArtifact] = React.useState<ArtifactPreview | null>(null);

  const loadQrTemplates = React.useCallback(async () => {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (authenticatedUser == null || retailerId == null) {
      setQrTemplates([]);
      setSelectedTemplateIds({});
      return;
    }

    try {
      const idToken = await authenticatedUser.getIdToken();
      const templates = await getQrTemplates({ idToken, retailerId });
      setQrTemplates(templates);
    } catch (error) {
      console.error('Load QR Templates error:', error);
      setQrTemplates([]);
    }
  }, [user]);

  const loadOperations = React.useCallback(async () => {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadFailed(false);

    try {
      const idToken = await authenticatedUser.getIdToken();

      const result = await listDeploymentOperations({
        idToken,
        retailerId,
      });

      setItems(result);
    } catch (error) {
      console.error(
        '[Deployment Operations] Failed to load Deployments:',
        error
      );

      setLoadFailed(true);

      toast({
        title: 'Could not load Deployment Operations',
        description:
          'Canonical Deployment records could not be loaded.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    void loadOperations();
  }, [loadOperations]);

  React.useEffect(() => {
    void loadQrTemplates();
  }, [loadQrTemplates]);

  function handleTemplateChange(deploymentId: string, templateId: string) {
    setSelectedTemplateIds((current) => ({
      ...current,
      [deploymentId]: templateId,
    }));
  }

  async function getCommandContext() {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId) {
      throw new Error('An authenticated retailer context is required.');
    }

    const idToken = await authenticatedUser.getIdToken();

    return {
      idToken,
      retailerId,
    };
  }

  async function runCommand(
    item: DeploymentOperationsItem,
    command: CommandName
  ) {
    const commandKey = `${item.deploymentId}:${command}`;
    setBusyCommand(commandKey);

    try {
      const context = await getCommandContext();

      switch (command) {
        case 'assign':
          await assignDeployment({
            ...context,
            deploymentId: item.deploymentId,
          });

          toast({
            title: 'Preparation started',
            description: `${item.storeName} is now ready for QR preparation.`,
          });
          break;

        case 'bind':
          await bindQrToDeployment({
            ...context,
            deploymentId: item.deploymentId,
          });

          toast({
            title: 'QR prepared',
            description:
              'The stable production QR identity is now bound to this Deployment.',
          });
          break;

        case 'pack': {
          const templateId = selectedTemplateIds[item.deploymentId];

          if (templateId === undefined) {
            throw new Error(
              'Select a QR Presentation Template before generating the Deployment Pack.'
            );
          }

          const result = await generateDeploymentPack({
            ...context,
            deploymentId: item.deploymentId,
            templateId,
          });

          setArtifact({
            title: 'Deployment Pack',
            qrCodeId: result.qrCodeId,
            trackingUrl: result.qr.trackingUrl,
            qrImageDataUrl: result.qr.qrImageDataUrl,
            details: {
              campaignName: result.campaign.name,
              activationName: result.activation.name,
              storeName: result.deployment.storeName,
              placement: result.deployment.placement,
            },
          });

          toast({
            title: 'Deployment Pack generated',
            description:
              'The printable artifact is ready. Lifecycle state has not changed.',
          });
          break;
        }

        case 'printed':
          await markDeploymentPrinted({
            ...context,
            deploymentId: item.deploymentId,
          });

          toast({
            title: 'Deployment marked as printed',
            description:
              'The Deployment lifecycle has advanced to PRINTED.',
          });
          break;

        case 'deployed':
          await markDeploymentDeployed({
            ...context,
            deploymentId: item.deploymentId,
          });

          toast({
            title: 'Deployment confirmed',
            description:
              'The Deployment and its QR identity are now deployed.',
          });
          break;

        case 'reprint': {
          if (!item.qrCodeId) {
            throw new Error(
              'This Deployment does not have a canonical QR identity.'
            );
          }

          const templateId = selectedTemplateIds[item.deploymentId];

          if (templateId === undefined) {
            throw new Error(
              'Select a QR Presentation Template before reprinting the QR.'
            );
          }

          const result = await regenerateQrCode({
            ...context,
            qrCodeId: item.qrCodeId,
            templateId,
          });

          setArtifact({
            title: 'QR Reprint',
            qrCodeId: result.qrCodeId,
            trackingUrl: result.trackingUrl,
            qrImageDataUrl: result.qrImageDataUrl,
          });

          toast({
            title: 'QR reprint generated',
            description:
              'The existing QR identity and tracking URL were preserved.',
          });
          break;
        }

        case 'resolve':
          await resolveDeploymentProblem({
            ...context,
            deploymentId: item.deploymentId,
          });

          toast({
            title: 'Problem resolved',
            description:
              'The server restored the Deployment to its recorded previous lifecycle state.',
          });
          break;

        default:
          throw new Error('Unsupported Deployment command.');
      }

      await loadOperations();
    } catch (error) {
      console.error(
        `[Deployment Operations] Command ${command} failed:`,
        error
      );

      toast({
        title: 'Deployment action failed',
        description:
          error instanceof Error
            ? error.message
            : 'The Deployment command failed.',
        variant: 'destructive',
      });
    } finally {
      setBusyCommand(null);
    }
  }

  async function runActivationCommand(
    item: DeploymentOperationsItem,
    command: ActivationCommandName
  ) {
    const commandKey = `${item.activationId}:${command}`;
    setActivationBusyCommand(commandKey);

    try {
      const context = await getCommandContext();

      if (command === 'submit') {
        await submitActivation({
          ...context,
          activationId: item.activationId,
        });

        toast({
          title: 'Activation submitted',
          description: item.activationApprovalRequired
            ? 'The Activation is now pending approval.'
            : 'The Activation is ready to be activated or scheduled.',
        });
      } else if (command === 'approve') {
        await approveActivation({
          ...context,
          activationId: item.activationId,
        });

        toast({
          title: 'Activation approved',
          description: 'The Activation is ready to be activated or scheduled.',
        });
      } else {
        throw new Error('Unsupported Activation command.');
      }

      await loadOperations();
    } catch (error) {
      console.error(
        `[Deployment Operations] Activation command ${command} failed:`,
        error
      );

      toast({
        title: 'Activation action failed',
        description:
          error instanceof Error
            ? error.message
            : 'The Activation command failed.',
        variant: 'destructive',
      });
    } finally {
      setActivationBusyCommand(null);
    }
  }

  async function handleScheduleActivation() {
    if (!scheduleTarget) {
      return;
    }

    if (scheduleMode === 'later' && !scheduleStartAt) {
      toast({
        title: 'Start time required',
        description: 'Choose when this Activation should become operational.',
        variant: 'destructive',
      });
      return;
    }

    setIsSchedulingActivation(true);

    try {
      const context = await getCommandContext();
      const startAt =
        scheduleMode === 'now' ? new Date() : new Date(scheduleStartAt);
      const endAt = scheduleEndAt ? new Date(scheduleEndAt) : undefined;

      if (Number.isNaN(startAt.getTime())) {
        throw new Error('Choose a valid Activation start date and time.');
      }

      if (endAt && Number.isNaN(endAt.getTime())) {
        throw new Error('Choose a valid Activation end date and time.');
      }

      const result = await scheduleActivation({
        ...context,
        activationId: scheduleTarget.activationId,
        startAt: startAt.toISOString(),
        ...(endAt ? { endAt: endAt.toISOString() } : {}),
        timezone: scheduleTimezone,
      });

      toast({
        title:
          result.status === 'ACTIVE'
            ? 'Activation is active'
            : 'Activation scheduled',
        description:
          result.status === 'ACTIVE'
            ? 'The shopper Activation is now operational.'
            : 'The Activation will become operational at its scheduled start time.',
      });

      setScheduleTarget(null);
      setScheduleStartAt('');
      setScheduleEndAt('');
      await loadOperations();
    } catch (error) {
      console.error(
        '[Deployment Operations] Failed to schedule Activation:',
        error
      );

      toast({
        title: 'Activation could not be scheduled',
        description:
          error instanceof Error
            ? error.message
            : 'The Activation scheduling command failed.',
        variant: 'destructive',
      });
    } finally {
      setIsSchedulingActivation(false);
    }
  }

  async function handleReportProblem() {
    if (!problemTarget) {
      return;
    }

    const reason = problemReason.trim();

    if (!reason) {
      toast({
        title: 'Problem reason required',
        description:
          'Describe the operational problem before reporting it.',
        variant: 'destructive',
      });
      return;
    }

    setIsReportingProblem(true);

    try {
      const context = await getCommandContext();

      await reportDeploymentProblem({
        ...context,
        deploymentId: problemTarget.deploymentId,
        problemReason: reason,
      });

      toast({
        title: 'Problem reported',
        description:
          'Normal Deployment lifecycle actions are paused until the problem is resolved.',
      });

      setProblemTarget(null);
      setProblemReason('');
      await loadOperations();
    } catch (error) {
      console.error(
        '[Deployment Operations] Failed to report problem:',
        error
      );

      toast({
        title: 'Problem could not be reported',
        description:
          error instanceof Error
            ? error.message
            : 'The Deployment problem command failed.',
        variant: 'destructive',
      });
    } finally {
      setIsReportingProblem(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) {
      return;
    }

    setIsRemoving(true);

    try {
      const context = await getCommandContext();

      await removeDeployment({
        ...context,
        deploymentId: removeTarget.deploymentId,
      });

      toast({
        title: 'Deployment removed',
        description:
          'The Deployment remains preserved historically and its associated QR identity is retired where applicable.',
      });

      setRemoveTarget(null);
      await loadOperations();
    } catch (error) {
      console.error(
        '[Deployment Operations] Failed to remove Deployment:',
        error
      );

      toast({
        title: 'Deployment could not be removed',
        description:
          error instanceof Error
            ? error.message
            : 'The Deployment removal command failed.',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  }

  const activeItems = items.filter((item) => !item.removedAt);
  const removedItems = items.filter((item) => Boolean(item.removedAt));

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold">Deployment Operations</h2>
        <p className="text-muted-foreground">
          Prepare, print, deploy, troubleshoot, and retire physical
          Point-of-Decision deployments using their canonical lifecycle.
        </p>
      </header>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Deployment Operations...
          </CardContent>
        </Card>
      ) : loadFailed ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">
              Deployment Operations could not be loaded.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No operational data is being shown because the canonical read
              failed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Active Deployments</h3>
              <p className="text-sm text-muted-foreground">
                Actions shown below are determined by each Deployment's
                canonical lifecycle state.
              </p>
            </div>

            {activeItems.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center">
                  <p className="font-medium">No active Deployments.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Deployments created through shelf activation will appear
                    here for operational preparation.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeItems.map((item) => (
                  <DeploymentCard
                    key={item.deploymentId}
                    item={item}
                    busyCommand={busyCommand}
                    qrTemplates={qrTemplates}
                    selectedTemplateId={selectedTemplateIds[item.deploymentId]}
                    onTemplateChange={handleTemplateChange}
                    onCommand={(deployment, command) =>
                      void runCommand(deployment, command)
                    }
                    onActivationCommand={(deployment, command) =>
                      void runActivationCommand(deployment, command)
                    }
                    onOpenSchedule={(deployment) => {
                      setScheduleTarget(deployment);
                      setScheduleMode('now');
                      setScheduleStartAt('');
                      setScheduleEndAt('');
                    }}
                    activationBusyCommand={activationBusyCommand}
                    onReportProblem={(deployment) => {
                      setProblemReason('');
                      setProblemTarget(deployment);
                    }}
                    onRemove={setRemoveTarget}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">
                Removed Deployments
              </h3>
              <p className="text-sm text-muted-foreground">
                Historical operational records retained without destructive
                deletion.
              </p>
            </div>

            {removedItems.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No Deployments have been removed.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {removedItems.map((item) => (
                  <DeploymentCard
                    key={item.deploymentId}
                    item={item}
                    busyCommand={busyCommand}
                    qrTemplates={qrTemplates}
                    selectedTemplateId={selectedTemplateIds[item.deploymentId]}
                    onTemplateChange={handleTemplateChange}
                    onCommand={(deployment, command) =>
                      void runCommand(deployment, command)
                    }
                    onActivationCommand={() => undefined}
                    onOpenSchedule={() => undefined}
                    activationBusyCommand={activationBusyCommand}
                    onReportProblem={() => undefined}
                    onRemove={() => undefined}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Dialog
        open={Boolean(scheduleTarget)}
        onOpenChange={(open) => {
          if (!open && !isSchedulingActivation) {
            setScheduleTarget(null);
            setScheduleStartAt('');
            setScheduleEndAt('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate or Schedule Activation</DialogTitle>
            <DialogDescription>
              Choose when this Activation should become operational for shopper
              resolution. The server remains authoritative over the resulting
              lifecycle state.
            </DialogDescription>
          </DialogHeader>

          {scheduleTarget ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-medium">Campaign</p>
                  <p className="text-muted-foreground">
                    {scheduleTarget.campaignName}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Activation</p>
                  <p className="text-muted-foreground">
                    {scheduleTarget.activationName}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Store</p>
                  <p className="text-muted-foreground">
                    {scheduleTarget.storeName}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Deployment ID</p>
                  <p className="break-all text-muted-foreground">
                    {scheduleTarget.deploymentId}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="activation-timing">Activation timing</Label>
              <Select
                value={scheduleMode}
                onValueChange={(value: 'now' | 'later') => {
                  setScheduleMode(value);
                  if (value === 'now') {
                    setScheduleStartAt('');
                  }
                }}
              >
                <SelectTrigger id="activation-timing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Activate now</SelectItem>
                  <SelectItem value="later">Schedule for later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleMode === 'later' ? (
              <div className="grid gap-2">
                <Label htmlFor="activation-start-at">
                  Start date and time
                </Label>
                <input
                  id="activation-start-at"
                  type="datetime-local"
                  value={scheduleStartAt}
                  onChange={(event) => setScheduleStartAt(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                The server will use the current time when you confirm.
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="activation-end-at">
                End date and time (optional)
              </Label>
              <input
                id="activation-end-at"
                type="datetime-local"
                value={scheduleEndAt}
                onChange={(event) => setScheduleEndAt(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="activation-timezone">Timezone</Label>
              <input
                id="activation-timezone"
                type="text"
                value={scheduleTimezone}
                onChange={(event) => setScheduleTimezone(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSchedulingActivation}
              onClick={() => {
                setScheduleTarget(null);
                setScheduleStartAt('');
                setScheduleEndAt('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                isSchedulingActivation ||
                (scheduleMode === 'later' && !scheduleStartAt)
              }
              onClick={() => void handleScheduleActivation()}
            >
              {isSchedulingActivation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Activate / Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(problemTarget)}
        onOpenChange={(open) => {
          if (!open && !isReportingProblem) {
            setProblemTarget(null);
            setProblemReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Deployment Problem</DialogTitle>
            <DialogDescription>
              Report an operational exception for{' '}
              {problemTarget?.storeName ?? 'this Deployment'}. The current
              lifecycle state will be retained by the server so it can be
              restored when the problem is resolved.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="deployment-problem-reason">
              Problem reason
            </Label>
            <Textarea
              id="deployment-problem-reason"
              value={problemReason}
              onChange={(event) => setProblemReason(event.target.value)}
              placeholder="Describe the problem..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isReportingProblem}
              onClick={() => {
                setProblemTarget(null);
                setProblemReason('');
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isReportingProblem}
              onClick={() => void handleReportProblem()}
            >
              {isReportingProblem ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              Report Problem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open && !isRemoving) {
            setRemoveTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Deployment?</AlertDialogTitle>
            <AlertDialogDescription>
              This does not delete the Deployment or rewrite its lifecycle
              history. The Deployment will be preserved as removed, and an
              associated QR identity will be retired according to the
              canonical server command.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isRemoving}
              onClick={(event) => {
                event.preventDefault();
                void handleRemove();
              }}
            >
              {isRemoving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              Remove Deployment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(artifact)}
        onOpenChange={(open) => {
          if (!open) {
            setArtifact(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{artifact?.title}</DialogTitle>
            <DialogDescription>
              This rendering uses the existing canonical QR identity and
              tracking URL.
            </DialogDescription>
          </DialogHeader>

          {artifact ? (
            <div className="space-y-5">
              <div className="flex justify-center rounded-lg border bg-white p-6">
                <img
                  src={artifact.qrImageDataUrl}
                  alt="Canonical deployment QR code"
                  className="h-64 w-64"
                />
              </div>

              {artifact.details ? (
                <div className="grid gap-3 text-sm">
                  <div>
                    <p className="font-medium">Campaign</p>
                    <p className="text-muted-foreground">
                      {artifact.details.campaignName}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Activation</p>
                    <p className="text-muted-foreground">
                      {artifact.details.activationName}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Store</p>
                    <p className="text-muted-foreground">
                      {artifact.details.storeName}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Placement</p>
                    <p className="text-muted-foreground">
                      {formatPlacement(artifact.details.placement)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1 text-sm">
                <p className="font-medium">QR Identity</p>
                <p className="break-all text-muted-foreground">
                  {artifact.qrCodeId}
                </p>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-medium">Tracking URL</p>
                <p className="break-all text-muted-foreground">
                  {artifact.trackingUrl}
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {artifact ? (
              <Button
                type="button"
                onClick={() =>
                  downloadDataUrl(
                    artifact.qrImageDataUrl,
                    qrArtifactFilename(artifact.qrImageDataUrl, artifact.qrCodeId)
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
