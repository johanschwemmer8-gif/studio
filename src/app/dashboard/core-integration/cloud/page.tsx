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
        <BackButton fallback="/dashboard/core-integration" label="Back to System Connections" />
        <h2 className="text-2xl font-bold tracking-tight mb-2 uppercase leading-none">
          Cloud & AI Configuration
        </h2>
        <p className="text-muted-foreground max-w-3xl text-sm mt-2">
          Manage core infrastructure connections and the specific Generative AI models powering the iNteract Intelligence Layer.
        </p>
      </div>

      <Separator />

      <form onSubmit={handleSaveChanges}>
        <div className="space-y-8">
            <Card className="border-primary/10 shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight"><Cloud className="text-primary h-5 w-5"/> Cloud Provider</CardTitle>
                    <CardDescription className="text-xs">
                        Configure authoritative credentials for your platform cloud provider.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                     <div className="space-y-2">
                        <Label htmlFor="cloud-provider" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cloud Provider</Label>
                        <Select defaultValue="gcp">
                            <SelectTrigger id="cloud-provider" className="h-11">
                                <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gcp">Google Cloud Platform (Authoritative)</SelectItem>
                                <SelectItem value="aws">Amazon Web Services</SelectItem>
                                <SelectItem value="azure">Microsoft Azure</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-key" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Key</Label>
                            <Input id="api-key" type="password" placeholder="••••••••••••••••••••" className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="api-secret" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Private Key / Secret</Label>
                            <Input id="api-secret" type="password" placeholder="••••••••••••••••••••" className="h-11" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={handleTestConnection} className="font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                            <TestTube2 className="mr-2 h-4 w-4" />
                            Test Handshake
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight"><BrainCircuit className="text-primary h-5 w-5"/> Generative AI Models</CardTitle>
                    <CardDescription className="text-xs">
                        Select the specialized models for different platform intelligence features.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="chat-model" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ari Guidance Model</Label>
                        <Input id="chat-model" defaultValue="gemini-2.5-flash" className="h-11 font-mono" />
                         <p className="text-[10px] text-muted-foreground italic">Model optimized for low-latency shopper conversations and product recommendations.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="analytics-model" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intelligence Aggregator Model</Label>
                        <Input id="analytics-model" defaultValue="gemini-2.5-pro" className="h-11 font-mono" />
                         <p className="text-[10px] text-muted-foreground italic">High-reasoning model for complex behavioral analytics and ROI projection.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="flex justify-end mt-8">
            <Button type="submit" size="lg" className="h-12 px-12 font-black uppercase text-xs tracking-widest shadow-xl">
                <Save className="mr-2 h-4 w-4" />
                Save Infrastructure Settings
            </Button>
        </div>
      </form>

    </div>
  );
}
