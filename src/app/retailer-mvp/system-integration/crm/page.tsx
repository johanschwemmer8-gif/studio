'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Clock3, Settings } from 'lucide-react';
import Link from 'next/link';

export default function CrmConfigurationPage() {
  return (
    <div className="space-y-8">
      <div>
        <BackButton
          fallback="/retailer-mvp/system-integration"
          label="Back to App Connections"
        />
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold tracking-tight">
            CRM / Loyalty Integration
          </h2>
          <Badge variant="outline">
            <Clock3 className="mr-1 h-3 w-3" />
            Production Connection Pending
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Prepare the connection between iNteract and your CRM or loyalty
          environment for future retailer-approved customer and loyalty data exchange.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Integration Scope</CardTitle>
          <CardDescription>
            CRM / Loyalty synchronization requires production infrastructure and
            retailer-approved credentials before factual data exchange can begin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Demo Configuration records the intended service and API endpoint
            only. It does not establish, test or claim a live connection.
          </p>
          <p>
            Production onboarding will provision credentials through the trusted
            infrastructure boundary and validate the external system handshake.
          </p>
          <Button asChild>
            <Link href="/retailer-mvp/system-integration">
              <Settings className="mr-2 h-4 w-4" />
              Manage Integration Configuration
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
