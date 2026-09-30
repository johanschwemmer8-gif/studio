'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  initializePlatformAiGovernanceV1,
  approvePlatformAiGovernanceV1,
  activatePlatformAiGovernanceV1,
} from '@/ai/flows/platform-ai-governance-actions';

type GovernanceAction =
  | 'initialize'
  | 'approve'
  | 'activate';

export function PlatformAiGovernanceManager() {
  const [pendingAction, setPendingAction] =
    useState<GovernanceAction | null>(null);

  const { toast } = useToast();

  const execute = async (
    action: GovernanceAction
  ) => {
    setPendingAction(action);

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error(
          'No authenticated Platform Operator session.'
        );
      }

      const idToken = await user.getIdToken(true);
      let description: string;

      if (action === 'initialize') {
        const result =
          await initializePlatformAiGovernanceV1(
            idToken
          );

        if (!result.success) {
          throw new Error(result.message);
        }

        description = result.result.alreadyExists
          ? 'Canonical AI Governance v1 already exists.'
          : 'Canonical AI Governance v1 created as DRAFT.';
      } else if (action === 'approve') {
        const result =
          await approvePlatformAiGovernanceV1(
            idToken
          );

        if (!result.success) {
          throw new Error(result.message);
        }

        description = result.result.alreadyApproved
          ? 'Canonical AI Governance v1 is already APPROVED.'
          : 'Canonical AI Governance v1 approved.';
      } else {
        const result =
          await activatePlatformAiGovernanceV1(
            idToken
          );

        if (!result.success) {
          throw new Error(result.message);
        }

        description = result.result.alreadyActive
          ? 'Canonical AI Governance v1 is already ACTIVE.'
          : 'Canonical AI Governance v1 activated.';
      }

      toast({
        title: 'AI Governance',
        description,
      });
    } catch (error) {
      console.error(
        '[AI Governance] Operator action failed:',
        error
      );

      toast({
        title: 'AI Governance Action Failed',
        description:
          error instanceof Error
            ? error.message
            : 'The governance action failed.',
        variant: 'destructive',
      });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Platform AI Governance
        </CardTitle>

        <CardDescription className="text-xs">
          Controlled lifecycle for canonical iNteract
          Platform AI Governance v1. Each transition
          requires authenticated Platform Operator
          authority.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3 md:grid-cols-3">
        <Button
          variant="outline"
          disabled={pendingAction !== null}
          onClick={() => execute('initialize')}
        >
          {pendingAction === 'initialize' && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Initialize v1
        </Button>

        <Button
          variant="outline"
          disabled={pendingAction !== null}
          onClick={() => execute('approve')}
        >
          {pendingAction === 'approve' && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Approve v1
        </Button>

        <Button
          disabled={pendingAction !== null}
          onClick={() => execute('activate')}
        >
          {pendingAction === 'activate' && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Activate v1
        </Button>
      </CardContent>
    </Card>
  );
}
