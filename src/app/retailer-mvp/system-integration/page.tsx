
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ShoppingBasket, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveRetailerApiKey, syncProducts, scheduledProductSync } from '@/ai/flows';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';


type IntegrationStatus = {
    status: 'connected' | 'disconnected' | 'error';
    lastUpdated: Timestamp;
    secretName?: string;
};

const MOCK_PRODUCTS = [
    { sku: 'RUN-001', name: 'Running Shoes', description: 'Lightweight and comfortable.', price: 1200.00, imageUrl: 'https://picsum.photos/seed/shoes/400', isAvailable: true },
    { sku: 'BOT-002', name: 'Insulated Water Bottle', description: 'Keeps drinks cold for 24h.', price: 350.00, imageUrl: 'https://picsum.photos/seed/bottle/400', isAvailable: true },
    { sku: 'TEE-003', name: 'Moisture-Wicking T-Shirt', description: 'Perfect for workouts.', price: 450.00, imageUrl: 'https://picsum.photos/seed/shirt/400', isAvailable: false },
];


export default function SystemIntegrationPage() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [serviceName, setServiceName] = useState('Lightspeed POS');
  const [isSaving, startSaving] = useTransition();
  const [isSyncing, startSyncing] = useTransition();
  const [isScheduledSyncing, startScheduledSyncing] = useTransition();
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, IntegrationStatus>>({});

  const retailerId = 'ret_123xyz'; // In a real app, this would come from auth context.

  useEffect(() => {
    if (!db) return;
    const integrationRef = doc(db, 'retailerIntegrations', retailerId);
    const unsubscribe = onSnapshot(integrationRef, (doc) => {
        if (doc.exists()) {
            setIntegrationStatus(doc.data() as Record<string, IntegrationStatus>);
        }
    });
    return () => unsubscribe();
  }, [retailerId]);

  const handleSaveApiKey = () => {
    startSaving(async () => {
        try {
            const result = await saveRetailerApiKey({ retailerId, serviceName, apiKey });
            if (result.success) {
                toast({ title: 'Success!', description: result.message });
                setApiKey('');
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };

  const handleManualSync = () => {
      startSyncing(async () => {
          try {
              const result = await syncProducts({ retailerId, products: MOCK_PRODUCTS });
              if (result.success) {
                  toast({ title: 'Sync Successful', description: `${result.syncedCount} products were synchronized.`});
              } else {
                  throw new Error('Sync failed on the backend.');
              }
          } catch (error: any) {
              toast({ title: 'Sync Failed', description: error.message, variant: 'destructive' });
          }
      });
  };
  
  const handleScheduledSync = () => {
       startScheduledSyncing(async () => {
          try {
              const result = await scheduledProductSync({ retailerId });
              if (result.success) {
                  toast({ title: 'Scheduled Sync Successful', description: result.message });
              } else {
                  throw new Error(result.message || 'Scheduled sync failed on the backend.');
              }
          } catch (error: any) {
              toast({ title: 'Sync Failed', description: error.message, variant: 'destructive' });
          }
      });
  };

  const currentServiceStatus = integrationStatus[serviceName];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">System & Integration</h2>
        <p className="text-muted-foreground max-w-3xl">
          Connect your third-party systems like POS and PIM to synchronize data with the iNteract-AOE platform.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>
            Securely store API keys for your external services. Keys are encrypted and stored in a secure vault.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid sm:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="service-name">Service</Label>
                   <Select value={serviceName} onValueChange={setServiceName}>
                      <SelectTrigger id="service-name">
                          <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Lightspeed POS">Lightspeed POS</SelectItem>
                          <SelectItem value="Salesforce Commerce Cloud">Salesforce Commerce Cloud</SelectItem>
                          <SelectItem value="Custom PIM">Custom PIM</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <Input 
                    id="api-key" 
                    type="password" 
                    placeholder="Enter your API key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
              </div>
           </div>
           {currentServiceStatus && (
               <Alert variant={currentServiceStatus.status === 'connected' ? 'default' : 'destructive'}>
                    {currentServiceStatus.status === 'connected' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle className="capitalize">Status: {currentServiceStatus.status}</AlertTitle>
                    <AlertDescription className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Last updated: {new Date(currentServiceStatus.lastUpdated.toDate()).toLocaleString()}
                    </AlertDescription>
                </Alert>
           )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveApiKey} disabled={isSaving || !apiKey}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save API Key
            </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Data Synchronization</CardTitle>
          <CardDescription>
            Manually or schedule synchronization of your product catalog from your PIM or POS system.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
                 <Button onClick={handleManualSync} disabled={isSyncing}>
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBasket className="mr-2 h-4 w-4" />}
                    Run Manual Sync
                </Button>
                 <Button onClick={handleScheduledSync} variant="secondary" disabled={isScheduledSyncing}>
                    {isScheduledSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                    Run Scheduled Sync
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                This will sync a predefined list of mock products to Firestore to simulate a real integration.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
