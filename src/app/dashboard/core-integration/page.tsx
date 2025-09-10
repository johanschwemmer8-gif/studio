
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
import { ArrowLeft, Cloud, Database, ShoppingBasket, KeyRound, Settings } from 'lucide-react';
import Link from 'next/link';
import ApiKeyManager from '@/components/dashboard/api-key-manager';

export default function CoreIntegrationPage() {

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="-ml-4 mb-4">
            <Link href="/dashboard/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to iNteract Admin Panel
            </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          iNteract Core Integration
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Configure and manage the core systems, data sources, and cloud services that power the iNteract AOE platform.
        </p>
      </div>

      <Separator />

       <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Settings className="text-primary" />
                  Core Features
              </CardTitle>
              <CardDescription>
                  Manage the core features of the iNteract AOE platform.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will be used to manage the core features that can be assigned to API Keys.
              </p>
          </CardContent>
      </Card>

       <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <KeyRound className="text-primary" />
                  API Key Management
              </CardTitle>
              <CardDescription>
                  Generate and manage API keys for your retailers to provide secure access to iNteract services.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <ApiKeyManager />
          </CardContent>
      </Card>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="text-primary" />
                    ERP System
                </CardTitle>
                <CardDescription>
                    Connect to your Enterprise Resource Planning system for live stock and pricing data.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full">Configure ERP</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingBasket className="text-primary" />
                    PIM System
                </CardTitle>
                <CardDescription>
                   Sync your Product Information Management system to keep product details up-to-date.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full">Configure PIM</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Cloud className="text-primary" />
                    Cloud Services
                </CardTitle>
                <CardDescription>
                    Manage connections to cloud providers and generative AI model configurations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full">Configure Cloud</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
