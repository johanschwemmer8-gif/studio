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
import { Cloud, Database, ShoppingBasket, KeyRound, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import ApiKeyManager from '@/components/dashboard/api-key-manager';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


export default function SystemIntegrationPage() {
    
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">
            App Connections
            </h2>
            <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Configure your third-party identifiers (POS, PIM, CRM) to synchronize your data standards with the iNteract platform.
            </p>
        </div>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1.5 py-1.5 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
            <AlertTriangle className="h-3.5 w-3.5" /> Configuration Only
        </Badge>
      </div>

      <Alert className="bg-primary/5 border-primary/10">
        <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Integration Notice</AlertTitle>
        <AlertDescription className="text-xs">
            These connections are currently in <strong>Demo Configuration</strong> mode. You can define your standard endpoints and API keys, but factual synchronization requires a production-tier infrastructure handshake.
        </AlertDescription>
      </Alert>

      <Separator />

       <Card className="border-primary/10">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 font-black text-lg">
                  <KeyRound className="text-primary h-5 w-5" />
                  API Access Management
              </CardTitle>
              <CardDescription className="text-xs">
                  Generate secure keys to allow external systems to interact with your retail intelligence data.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <ApiKeyManager />
          </CardContent>
      </Card>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black text-base uppercase tracking-tight">
                    <Database className="text-primary h-4 w-4" />
                    Checkout / POS
                </CardTitle>
                <CardDescription className="text-[10px] leading-tight mt-1">
                    Manage the handshake with your Point-of-Sale system for GTIN-aligned transaction capture.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest">
                  <Link href="/retailer-mvp/system-integration/pos">Configure POS Settings</Link>
                </Button>
            </CardContent>
        </Card>
        <Card className="border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black text-base uppercase tracking-tight">
                    <ShoppingBasket className="text-primary h-4 w-4" />
                    Product / PIM
                </CardTitle>
                <CardDescription className="text-[10px] leading-tight mt-1">
                   Map your Product Information Management system to ensure global identifier integrity.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest">
                  <Link href="/retailer-mvp/system-integration/pim">Configure PIM Mapping</Link>
                </Button>
            </CardContent>
        </Card>
        <Card className="border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black text-base uppercase tracking-tight">
                    <Cloud className="text-primary h-4 w-4" />
                    Loyalty / CRM
                </CardTitle>
                <CardDescription className="text-[10px] leading-tight mt-1">
                    Connect your shopper profiles to enable personalized behavioral insights and rewards.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest">
                    <Link href="/retailer-mvp/system-integration/crm">Configure CRM Logic</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
