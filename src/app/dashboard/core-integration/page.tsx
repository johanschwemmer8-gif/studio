
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
import { ArrowLeft, Cloud, Database, ShoppingBasket, KeyRound, Settings, ShieldCheck, Ban, SlidersHorizontal, BarChart2, Eye } from 'lucide-react';
import Link from 'next/link';
import ApiKeyManager from '@/components/dashboard/api-key-manager';

export default function CoreIntegrationPage() {

  const coreFeatures = [
    { 
      name: "Secure Key Storage", 
      description: "Keys are encrypted at rest and in transit, ensuring they are never exposed.",
      icon: <ShieldCheck className="h-5 w-5 text-green-500" />
    },
    { 
      name: "Revocation & Rotation", 
      description: "Instantly revoke compromised keys and set up automated rotation policies.",
      icon: <Ban className="h-5 w-5 text-red-500" />
    },
    { 
      name: "Scope Management", 
      description: "Assign granular permissions to each key, limiting access to specific resources.",
      icon: <SlidersHorizontal className="h-5 w-5 text-blue-500" />
    },
    { 
      name: "Rate Limiting", 
      description: "Protect your services from abuse with customizable rate limits per key.",
      icon: <BarChart2 className="h-5 w-5 text-yellow-500" />
    },
    { 
      name: "Usage Tracking", 
      description: "Monitor API usage and performance with detailed logs and analytics.",
      icon: <Eye className="h-5 w-5 text-purple-500" />
    },
     { 
      name: "Key Preview Display", 
      description: "Safely preview key details without exposing the full key, reducing accidental leaks.",
      icon: <Eye className="h-5 w-5 text-indigo-500" />
    },
  ];


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
                  Manage the core features of the iNteract AOE platform that can be assigned to API Keys.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coreFeatures.map(feature => (
                    <div key={feature.name} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="flex-shrink-0">{feature.icon}</div>
                        <div>
                            <h3 className="font-semibold">{feature.name}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
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
                <Button asChild className="w-full">
                  <Link href="/dashboard/core-integration/erp">Configure ERP</Link>
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
