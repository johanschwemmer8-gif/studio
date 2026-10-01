'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Scale,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { HubNav } from '@/components/dashboard/hub-nav';

import {
  getRetailerAiGovernanceForRetailer,
} from '@/ai/flows/get-retailer-ai-governance';
import {
  saveRetailerAiGovernance,
} from '@/ai/flows/save-retailer-ai-governance';

type GovernanceFields = {
  aiInteractionTransparency: string;
  capabilityPurposeTransparency: string;
  sponsoredInfluenceDisclosure: string;
  commercialInfluenceDisclosure: string;
  complaintRecourse: string;
};

const EMPTY_FIELDS: GovernanceFields = {
  aiInteractionTransparency: '',
  capabilityPurposeTransparency: '',
  sponsoredInfluenceDisclosure: '',
  commercialInfluenceDisclosure: '',
  complaintRecourse: '',
};

const RULES = [
  {
    field: 'aiInteractionTransparency',
    ruleId: 'retailer-transparency-ai-interaction',
    ruleType: 'TRANSPARENCY_REQUIREMENT',
    platformControlId: 'GOV-12-001',
    title: 'AI Interaction Transparency',
    description:
      'Additional retailer requirement for telling shoppers when they are interacting with AI.',
  },
  {
    field: 'capabilityPurposeTransparency',
    ruleId: 'retailer-transparency-capability-purpose',
    ruleType: 'TRANSPARENCY_REQUIREMENT',
    platformControlId: 'GOV-12-002',
    title: 'Capability Purpose Transparency',
    description:
      'Additional retailer requirement explaining the purpose of the AI capability.',
  },
  {
    field: 'sponsoredInfluenceDisclosure',
    ruleId: 'retailer-sponsorship-transparent-influence',
    ruleType: 'SPONSORSHIP_DISCLOSURE_REQUIREMENT',
    platformControlId: 'GOV-09-005',
    title: 'Sponsored Influence Disclosure',
    description:
      'Additional retailer requirement for transparent disclosure of sponsored influence.',
  },
  {
    field: 'commercialInfluenceDisclosure',
    ruleId: 'retailer-sponsorship-commercial-influence',
    ruleType: 'SPONSORSHIP_DISCLOSURE_REQUIREMENT',
    platformControlId: 'GOV-12-006',
    title: 'Commercial Influence Transparency',
    description:
      'Additional retailer requirement for disclosure of commercial influence or sponsorship.',
  },
  {
    field: 'complaintRecourse',
    ruleId: 'retailer-complaint-recourse',
    ruleType: 'COMPLAINT_RECOURSE_REQUIREMENT',
    platformControlId: 'GOV-13-007',
    title: 'Complaint & Recourse',
    description:
      'Additional retailer requirement for shopper complaint, dispute, or recourse information.',
  },
] as const;

const aiHubItems = [
  {
    label: 'Settings',
    href: '/retailer-mvp/ai-configuration',
  },
  {
    label: 'Welcome & Content',
    href: '/retailer-mvp/ai-content',
  },
  {
    label: 'Performance Audit',
    href: '/retailer-mvp/ai-performance',
  },
  {
    label: 'Ethics & Policy',
    href: '/retailer-mvp/ai-policy',
  },
];

export default function RetailerAIPolicyPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [fields, setFields] =
    useState<GovernanceFields>(EMPTY_FIELDS);
  const [governanceVersion, setGovernanceVersion] =
    useState('1.0.0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] =
    useState<string | null>(null);

  const loadGovernance = useCallback(async () => {
    if (!user?.retailerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const idToken = await user.getIdToken();

      const result =
        await getRetailerAiGovernanceForRetailer({
          idToken,
          retailerId: user.retailerId,
        });

      if (!result.governance) {
        setFields(EMPTY_FIELDS);
        setGovernanceVersion('1.0.0');
        return;
      }

      setGovernanceVersion(
        result.governance.governanceVersion
      );

      const nextFields: GovernanceFields = {
        ...EMPTY_FIELDS,
      };

      for (
        const rule of result.governance.additiveRules
      ) {
        const definition = RULES.find(
          item => item.ruleId === rule.ruleId
        );

        if (!definition) {
          continue;
        }

        nextFields[definition.field] =
          Array.isArray(rule.value)
            ? rule.value.join('\n')
            : rule.value;
      }

      setFields(nextFields);
    } catch (error) {
      console.error(
        'Load retailer AI governance error:',
        error
      );

      setLoadError(
        'Retailer AI governance could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadGovernance();
  }, [loadGovernance]);

  const updateField = (
    field: keyof GovernanceFields,
    value: string
  ) => {
    setFields(current => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user?.retailerId || saving) {
      return;
    }

    setSaving(true);

    try {
      const idToken = await user.getIdToken();

      const additiveRules = RULES
        .filter(
          definition =>
            fields[definition.field].trim().length > 0
        )
        .map(definition => ({
          ruleId: definition.ruleId,
          ruleType: definition.ruleType,
          platformControlId:
            definition.platformControlId,
          title: definition.title,
          description: definition.description,
          value:
            fields[definition.field].trim(),
        }));

      const result =
        await saveRetailerAiGovernance({
          idToken,
          retailerId: user.retailerId,
          governanceVersion,
          status: 'ACTIVE',
          additiveRules,
        });

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: 'Governance saved',
        description:
          additiveRules.length > 0
            ? 'Your permitted retailer AI governance additions are active.'
            : 'No retailer additions are configured. iNteract Platform Governance remains fully active.',
      });

      await loadGovernance();
    } catch (error) {
      console.error(
        'Save retailer AI governance error:',
        error
      );

      toast({
        variant: 'destructive',
        title: 'Governance not saved',
        description:
          error instanceof Error
            ? error.message
            : 'Retailer AI governance could not be saved.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase">
          Ari Experience
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configure permitted retailer-specific AI
          governance requirements for Ari.
        </p>
      </div>

      <HubNav items={aiHubItems} />
      <Separator />

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>
          iNteract Platform Governance remains mandatory
        </AlertTitle>
        <AlertDescription>
          Retailer governance is additive only. These
          settings cannot disable, weaken, replace, or
          override mandatory iNteract AI governance,
          capability authority, safety controls, evidence
          requirements, or provider and model authority.
        </AlertDescription>
      </Alert>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            Governance unavailable
          </AlertTitle>
          <AlertDescription>
            {loadError} Saving is unavailable until the
            authoritative governance state can be loaded.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>
                  Transparency Requirements
                </CardTitle>
                <CardDescription>
                  Add retailer-specific transparency
                  requirements within the permitted
                  Platform Governance boundary.
                </CardDescription>
              </div>
              <Badge variant="outline">
                Additive only
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ai-interaction-transparency">
                AI Interaction Transparency
              </Label>
              <p className="text-xs text-muted-foreground">
                GOV-12-001
              </p>
              <Textarea
                id="ai-interaction-transparency"
                value={
                  fields.aiInteractionTransparency
                }
                onChange={event =>
                  updateField(
                    'aiInteractionTransparency',
                    event.target.value
                  )
                }
                placeholder="Optional additional retailer requirement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capability-purpose">
                Capability Purpose Transparency
              </Label>
              <p className="text-xs text-muted-foreground">
                GOV-12-002
              </p>
              <Textarea
                id="capability-purpose"
                value={
                  fields.capabilityPurposeTransparency
                }
                onChange={event =>
                  updateField(
                    'capabilityPurposeTransparency',
                    event.target.value
                  )
                }
                placeholder="Optional additional retailer requirement"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Sponsorship & Commercial Disclosure
            </CardTitle>
            <CardDescription>
              Add stricter retailer requirements for
              sponsored or commercially influenced
              shopper experiences.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sponsored-influence">
                Sponsored Influence Disclosure
              </Label>
              <p className="text-xs text-muted-foreground">
                GOV-09-005
              </p>
              <Textarea
                id="sponsored-influence"
                value={
                  fields.sponsoredInfluenceDisclosure
                }
                onChange={event =>
                  updateField(
                    'sponsoredInfluenceDisclosure',
                    event.target.value
                  )
                }
                placeholder="Optional additional retailer requirement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commercial-influence">
                Commercial Influence Transparency
              </Label>
              <p className="text-xs text-muted-foreground">
                GOV-12-006
              </p>
              <Textarea
                id="commercial-influence"
                value={
                  fields.commercialInfluenceDisclosure
                }
                onChange={event =>
                  updateField(
                    'commercialInfluenceDisclosure',
                    event.target.value
                  )
                }
                placeholder="Optional additional retailer requirement"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Complaint & Recourse
          </CardTitle>
          <CardDescription>
            Add retailer-specific requirements for how
            shoppers can dispute an AI-supported outcome
            or seek recourse.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <Label htmlFor="complaint-recourse">
            Complaint & Recourse Requirement
          </Label>
          <p className="text-xs text-muted-foreground">
            GOV-13-007
          </p>
          <Textarea
            id="complaint-recourse"
            value={fields.complaintRecourse}
            onChange={event =>
              updateField(
                'complaintRecourse',
                event.target.value
              )
            }
            placeholder="Optional additional retailer requirement"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">
                Effective Governance
              </p>
              <p className="text-sm text-muted-foreground">
                Mandatory iNteract Platform Governance
                plus any valid retailer additions saved
                here.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={
              saving ||
              Boolean(loadError) ||
              !user?.retailerId
            }
          >
            {saving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Governance
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
