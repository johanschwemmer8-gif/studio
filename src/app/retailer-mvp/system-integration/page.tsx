
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
import { Cloud, Database, ShoppingBasket, KeyRound, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ApiKeyManager from '@/components/dashboard/api-key-manager';


export default function SystemIntegrationPage() {
    
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          System & Integration
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Connect your third-party systems like POS and PIM to synchronize data with the iNteract-AOE platform.
        </p>
      </div>

      <Separator />

       <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <KeyRound className="text-primary" />
                  API Key Management
              </CardTitle>
              <CardDescription>
                  Generate and manage API keys for your external services to provide secure access to iNteract.
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
                <Button asChild className="w-full" disabled>
                  <Link href="#">Configure ERP</Link>
                </Button>
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
                <Button asChild className="w-full" disabled>
                  <Link href="#">Configure PIM</Link>
                </Button>
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
                <Button asChild className="w-full" disabled>
                    <Link href="#">Configure Cloud</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
