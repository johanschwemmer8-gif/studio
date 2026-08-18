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
import { Save, TestTube2, Cloud, BrainCircuit } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CloudConfigurationPage() {
  const { toast } = useToast();

  const handleSaveChanges = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Settings Saved',
      description: 'Your cloud and AI model configuration has been updated.',
    });
  };
  
  const handleTestConnection = () => {
    toast({
      title: 'Connection Successful',
      description: 'Successfully connected to the cloud provider.',
    });
  };

  return (
    <div className="space-y-8">
       <div>
        <BackButton fallback="/dashboard/core-integration" label="Back to Infrastructure Layer" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Cloud Services & AI Model Configuration
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage connections to your cloud provider and configure generative AI models.
        </p>
      </div>

      <Separator />

      <form onSubmit={handleSaveChanges}>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Cloud className="text-primary"/> Cloud Provider</CardTitle>
                    <CardDescription>
                        Provide the API credentials for your cloud services provider.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="cloud-provider">Cloud Provider</Label>
                        <Select defaultValue="gcp">
                            <SelectTrigger id="cloud-provider">
                                <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gcp">Google Cloud Platform</SelectItem>
                                <SelectItem value="aws">Amazon Web Services</SelectItem>
                                <SelectItem value="azure">Microsoft Azure</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input id="api-key" type="password" placeholder="••••••••••••••••••••" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="api-secret">API Secret / Private Key</Label>
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary"/> Generative AI Models</CardTitle>
                    <CardDescription>
                        Configure the AI models used for different platform features.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="chat-model">Chat & Personalization Model</Label>
                        <Input id="chat-model" defaultValue="gemini-2.5-flash" />
                         <p className="text-xs text-muted-foreground">Model used for chatbot conversations and product recommendations.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="analytics-model">Analytics Model</Label>
                        <Input id="analytics-model" defaultValue="gemini-2.5-pro" />
                         <p className="text-xs text-muted-foreground">Model used for analyzing dashboard metrics and providing insights.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        
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
