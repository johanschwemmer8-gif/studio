'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, TestTube2, ShoppingBasket } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function PimConfigurationPage() {
  const { toast } = useToast();

  const handleSaveChanges = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Settings Saved',
      description: 'Your PIM configuration has been updated.',
    });
  };
  
  const handleTestConnection = () => {
    toast({
      title: 'Connection Successful',
      description: 'Successfully connected to the PIM system.',
    });
  };

  return (
    <div className="space-y-8">
       <div>
        <BackButton fallback="/dashboard/core-integration" label="Back to System Connections" />
        <h2 className="text-2xl font-bold tracking-tight mb-2 uppercase leading-none">
          PIM System Integration
        </h2>
        <p className="text-muted-foreground max-w-3xl text-sm mt-2">
          Sync your Product Information Management system to keep product details, descriptions, and images up-to-date across the iNteract cloud.
        </p>
      </div>

      <Separator />

      <form onSubmit={handleSaveChanges}>
        <Card className="border-primary/10 shadow-lg">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                    <ShoppingBasket className="text-primary h-5 w-5" />
                    Connection Settings
                </CardTitle>
                <CardDescription className="text-xs">
                    Provide the production API details for your global PIM system.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                    <Label htmlFor="api-endpoint" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Endpoint URL</Label>
                    <Input id="api-endpoint" placeholder="https://api.your-pim.com/v1/" className="h-11 font-mono" />
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="api-key" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Key</Label>
                        <Input id="api-key" type="password" placeholder="••••••••••••••••••••" className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="api-secret" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Secret</Label>
                        <Input id="api-secret" type="password" placeholder="••••••••••••••••••••" className="h-11" />
                    </div>
                </div>
                <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleTestConnection} className="font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                        <TestTube2 className="mr-2 h-4 w-4" />
                        Test Handshake
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" className="h-12 px-12 font-black uppercase text-xs tracking-widest shadow-xl">
                <Save className="mr-2 h-4 w-4" />
                Save PIM Configuration
            </Button>
        </div>
      </form>

    </div>
  );
}
