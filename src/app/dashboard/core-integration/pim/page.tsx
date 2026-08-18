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
import { Save, TestTube2 } from 'lucide-react';
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
        <BackButton fallback="/dashboard/core-integration" label="Back to Infrastructure Layer" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          PIM System Integration
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Sync your Product Information Management system to keep product details, descriptions, and images up-to-date.
        </p>
      </div>

      <Separator />

      <form onSubmit={handleSaveChanges}>
        <Card>
            <CardHeader>
                <CardTitle>Connection Settings</CardTitle>
                <CardDescription>
                    Provide the API details for your PIM system.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="api-endpoint">API Endpoint URL</Label>
                    <Input id="api-endpoint" placeholder="https://api.your-pim.com/v1/" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input id="api-key" type="password" placeholder="••••••••••••••••••••" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="api-secret">API Secret</Label>
                    <Input id="api-secret" type="password" placeholder="••••••••••••••••••••" />
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={handleTestConnection}>
                        <TestTube2 className="mr-2 h-4 w-4" />
                        Test Connection
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end mt-8">
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
            </Button>
        </div>
      </form>

    </div>
  );
}
