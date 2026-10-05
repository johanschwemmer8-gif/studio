
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Trash2, Loader2, Clock3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { saveRetailerApiKey } from '@/ai/flows/save-retailer-api-key';
import { deleteRetailerApiKey } from '@/ai/flows/delete-retailer-api-key';

type ApiKey = {
  id: string;
  serviceName: string;
  integrationType: 'pos' | 'pim' | 'crm';
  endpoint: string;
  createdAt: string | any;
  status: 'configuration_pending';
};

export default function ApiKeyManager() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [integrationType, setIntegrationType] = useState<'pos' | 'pim' | 'crm'>('pos');
  const [endpoint, setEndpoint] = useState('');
  const { toast } = useToast();

  const retailerId = user?.retailerId || 'unknown';

  useEffect(() => {
    if (!db || retailerId === 'unknown') {
        setIsLoading(false);
        return;
    }

    const docRef = doc(db, 'retailerIntegrations', retailerId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const keys: ApiKey[] = Object.entries(data)
              .filter(([, config]: [string, any]) =>
                config?.status === 'configuration_pending' &&
                ['pos', 'pim', 'crm'].includes(config?.integrationType) &&
                typeof config?.endpoint === 'string' &&
                config.endpoint.trim().length > 0
              )
              .map(([name, config]: [string, any]) => ({
                id: name,
                serviceName: name,
                integrationType: config.integrationType,
                endpoint: config.endpoint,
                createdAt: config.lastUpdated,
                status: 'configuration_pending',
              }));
            setApiKeys(keys);
        } else {
            setApiKeys([]);
        }
        setLoadError(null);
        setIsLoading(false);
    }, (error) => {
        console.error('[App Connections] Failed to load integration configurations:', error);
        setApiKeys([]);
        setLoadError('Unable to load integration configurations.');
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [retailerId]);

  const generateApiKey = async () => {
    if (!serviceName.trim() || !endpoint.trim() || retailerId === 'unknown') return;
    
    setIsGenerating(true);
    try {
        const idToken = await user?.getIdToken();
        const result = await saveRetailerApiKey({
            idToken,
            retailerId,
            serviceName,
            integrationType,
            endpoint: endpoint.trim(),
        });

        if (result.success) {
            toast({ title: 'Configuration Saved', description: result.message });
            setServiceName('');
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ title: 'Integration Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsGenerating(false);
    }
  };

  const deleteKey = async (name: string) => {
    if (retailerId === "unknown") return;
    try {
        const idToken = await user?.getIdToken();
        const result = await deleteRetailerApiKey({
            idToken,
            retailerId,
            serviceName: name,
        });

        if (result.success) {
            toast({ title: "Integration Removed", description: result.message, variant: "destructive" });
        } else {
            throw new Error(result.message);
        }
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 p-4 border rounded-lg bg-muted/20 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="service-name">Connection Name</Label>
          <Input
            id="service-name"
            placeholder="e.g. Retailer POS"
            value={serviceName}
            onChange={e => setServiceName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="integration-type">Integration Type</Label>
          <select
            id="integration-type"
            value={integrationType}
            onChange={e => setIntegrationType(e.target.value as 'pos' | 'pim' | 'crm')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="pos">POS / ERP</option>
            <option value="pim">PIM / E-commerce</option>
            <option value="crm">CRM / Loyalty</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="integration-endpoint">API Endpoint</Label>
          <Input
            id="integration-endpoint"
            type="url"
            placeholder="https://api.your-system.com/v1/"
            value={endpoint}
            onChange={e => setEndpoint(e.target.value)}
          />
        </div>

        <div className="md:col-span-3 flex justify-end">
          <Button
            type="button"
            onClick={generateApiKey}
            disabled={!serviceName.trim() || !endpoint.trim() || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            Save Demo Configuration
          </Button>
        </div>

        <p className="md:col-span-3 text-xs text-muted-foreground">
          Credentials are not collected in Demo Configuration mode. Production
          credential provisioning and connection testing require the production
          infrastructure handshake.
        </p>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="text-[10px] font-black uppercase tracking-widest">
              <TableHead className="px-6">Service Integration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
            ) : loadError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-destructive text-xs">
                  {loadError}
                </TableCell>
              </TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground italic text-xs">No integration configurations defined.</TableCell></TableRow>
            ) : (
              apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id} className="group">
                  <TableCell className="font-bold px-6">{apiKey.serviceName}</TableCell>
                  <TableCell className="uppercase text-xs font-bold">
                    {apiKey.integrationType}
                  </TableCell>
                  <TableCell>
                    <code className="font-mono text-[9px] text-muted-foreground break-all">
                      {apiKey.endpoint}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-black uppercase">
                      <Clock3 className="mr-1 h-2.5 w-2.5" />
                      Production Connection Pending
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Configuration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the demo configuration for <span className="font-bold">{apiKey.serviceName}</span>. No production connection is currently active.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteKey(apiKey.serviceName)} className="bg-destructive hover:bg-destructive/90 font-bold uppercase text-[10px] tracking-widest">
                            Remove Configuration
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
