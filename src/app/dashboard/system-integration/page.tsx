
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, TestTube2, Wifi, WifiOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type IntegrationStatus = 'connected' | 'disconnected' | 'testing';

type IntegrationState = {
    enabled: boolean;
    apiKey: string;
    apiEndpoint: string;
    status: IntegrationStatus;
};

export default function SystemIntegrationPage() {
    const { toast } = useToast();
    const [integrations, setIntegrations] = useState<Record<string, IntegrationState>>({
        sap: { enabled: true, apiKey: 's4p_live_f4k3_k3y_pr0d', apiEndpoint: 'https://api.sap.com/s4hana', status: 'connected' },
        salesforce: { enabled: false, apiKey: '', apiEndpoint: '', status: 'disconnected' },
        oracle: { enabled: false, apiKey: '', apiEndpoint: '', status: 'disconnected' },
        dynamics: { enabled: true, apiKey: 'dyn365_test_k3y_n0t_r34l', apiEndpoint: 'https://api.businesscentral.dynamics.com', status: 'connected' },
    });

    const handleToggle = (key: string) => {
        setIntegrations(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }));
    };

    const handleInputChange = (key: string, field: 'apiKey' | 'apiEndpoint', value: string) => {
        setIntegrations(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };
    
    const handleSaveChanges = (key: string) => {
        toast({
            title: 'Configuration Saved!',
            description: `Your settings for ${key.toUpperCase()} have been saved.`,
        });
    };

    const handleTestConnection = (key: string) => {
        setIntegrations(prev => ({ ...prev, [key]: { ...prev[key], status: 'testing' }}));
        setTimeout(() => {
            const isSuccess = Math.random() > 0.3; // 70% chance of success
            setIntegrations(prev => ({
                ...prev,
                [key]: { ...prev[key], status: isSuccess ? 'connected' : 'disconnected' }
            }));
            toast({
                title: isSuccess ? 'Connection Successful!' : 'Connection Failed',
                description: isSuccess ? `Successfully connected to ${key.toUpperCase()}.` : `Could not connect to ${key.toUpperCase()}. Please check your settings.`,
                variant: isSuccess ? 'default' : 'destructive',
            });
        }, 1500);
    };

    const integrationCards = [
        { key: 'sap', title: 'ERP Integration', description: 'e.g., SAP S/4HANA, Oracle NetSuite' },
        { key: 'salesforce', title: 'CRM Integration', description: 'e.g., Salesforce, HubSpot' },
        { key: 'oracle', title: 'E-commerce Platform', description: 'e.g., Salesforce Commerce Cloud, Shopify' },
        { key: 'dynamics', title: 'BI & Analytics', description: 'e.g., PowerBI, Tableau' },
    ];

    const getStatusIndicator = (status: IntegrationStatus) => {
        switch (status) {
            case 'connected':
                return <div className="flex items-center gap-2 text-green-500"><Wifi size={16} /><span>Connected</span></div>;
            case 'disconnected':
                return <div className="flex items-center gap-2 text-red-500"><WifiOff size={16} /><span>Disconnected</span></div>;
            case 'testing':
                return <div className="flex items-center gap-2 text-yellow-500 animate-pulse"><TestTube2 size={16} /><span>Testing...</span></div>;
        }
    };

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">System & Integration Configuration</h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage connections to your external systems to enable real-time data synchronization for inventory, sales, and customer data.
        </p>
      </div>
      <Separator />

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {integrationCards.map(({key, title, description}) => {
             const config = integrations[key];
            return (
                 <Card key={key}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>{title}</CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </div>
                            <Switch
                                checked={config.enabled}
                                onCheckedChange={() => handleToggle(key)}
                                aria-label={`Toggle ${title}`}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <fieldset disabled={!config.enabled} className="space-y-4 disabled:opacity-50">
                             <div className="space-y-2">
                                <Label htmlFor={`${key}-api-key`}>API Key</Label>
                                <Input id={`${key}-api-key`} type="password" placeholder="Enter API Key" value={config.apiKey} onChange={e => handleInputChange(key, 'apiKey', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`${key}-api-endpoint`}>API Endpoint URL</Label>
                                <Input id={`${key}-api-endpoint`} placeholder="https://api.service.com/v1" value={config.apiEndpoint} onChange={e => handleInputChange(key, 'apiEndpoint', e.target.value)} />
                            </div>
                         </fieldset>
                         <Separator />
                         <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                             <div className="font-medium text-sm">
                                {getStatusIndicator(config.status)}
                             </div>
                             <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleTestConnection(key)} disabled={!config.enabled || config.status === 'testing'}>
                                    <TestTube2 className="mr-2 h-4 w-4" />
                                    Test Connection
                                </Button>
                                <Button onClick={() => handleSaveChanges(key)} disabled={!config.enabled}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save
                                </Button>
                             </div>
                         </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>
       <Alert>
          <AlertTitle>Data Synchronization</AlertTitle>
          <AlertDescription>
            Enabling these integrations will sync data every 15 minutes. You can monitor the status of these syncs in the <strong>Real-Time Data</strong> dashboard.
          </AlertDescription>
        </Alert>
    </div>
  );
}
