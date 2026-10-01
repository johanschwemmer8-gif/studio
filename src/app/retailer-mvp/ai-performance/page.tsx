'use client';

import { Activity, Database, ShieldCheck } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HubNav } from '@/components/dashboard/hub-nav';

const aiHubItems = [
  { label: 'Settings', href: '/retailer-mvp/ai-configuration' },
  { label: 'Performance Audit', href: '/retailer-mvp/ai-performance' },
  { label: 'Ethics & Policy', href: '/retailer-mvp/ai-policy' },
];

export default function AIPerformanceMonitor() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase">
          Ari Experience
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review authoritative Ari performance evidence as measured shopper
          interaction data becomes available.
        </p>
      </div>

      <HubNav items={aiHubItems} />

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Authoritative evidence required</AlertTitle>
        <AlertDescription>
          Ari performance metrics are not displayed until they can be derived
          from validated production interaction evidence. Simulated
          conversations, synthetic KPIs, and unsupported performance claims are
          not used as retailer intelligence.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Activity className="mb-2 h-5 w-5 text-muted-foreground" />
            <CardTitle>Performance Audit</CardTitle>
            <CardDescription>
              Measured Ari performance will appear here when sufficient
              authoritative evidence is available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No validated performance dataset is currently available for this
              view.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Database className="mb-2 h-5 w-5 text-muted-foreground" />
            <CardTitle>Evidence Status</CardTitle>
            <CardDescription>
              Future metrics must remain traceable to real shopper interaction
              and runtime evidence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Evidence collection and performance analysis will be validated
              before retailer-facing metrics are enabled.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
