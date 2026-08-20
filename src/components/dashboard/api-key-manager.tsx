
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
import { KeyRound, PlusCircle, Copy, Trash2, Ban, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { saveRetailerApiKey } from '@/ai/flows/save-retailer-api-key';

type ApiKey = {
  id: string;
  serviceName: string;
  key: string;
  createdAt: string | any;
  status: 'active' | 'revoked' | 'connected';
};

export default function ApiKeyManager() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [serviceName, setServiceName] = useState('');
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
            const keys: ApiKey[] = Object.entries(data).map(([name, config]: [string, any]) => ({
                id: name,
                serviceName: name,
                key: config.secretName || 'Encrypted in Secret Manager',
                createdAt: config.lastUpdated,
                status: config.status,
            }));
            setApiKeys(keys);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [retailerId]);

  const generateApiKey = async () => {
    if (!serviceName.trim() || retailerId === 'unknown') return;
    
    setIsGenerating(true);
    try {
        const idToken = await user?.getIdToken();
        const fakeKey = `ik_${Math.random().toString(36).substring(2, 15)}`;
        
        const result = await saveRetailerApiKey({
            idToken,
            retailerId,
            serviceName,
            apiKey: fakeKey
        });

        if (result.success) {
            toast({ title: 'Connection Established', description: result.message });
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

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Path Copied',
      description: 'Secret Manager resource path copied to clipboard.',
    });
  };

  const deleteKey = async (name: string) => {
    if (!db || retailerId === 'unknown') return;
    try {
        // In a real app, this would also delete from Secret Manager via a flow.
        // For the pilot, we remove the reference from Firestore.
        const ref = doc(db, 'retailerIntegrations', retailerId);
        await setDoc(ref, { [name]: null }, { merge: true });
        toast({ title: 'Integration Removed', description: `Disconnected ${name}.`, variant: 'destructive' });
    } catch (e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/20">
        <div className="flex-1 space-y-2">
            <Label htmlFor="service-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Connection Name</Label>
            <Input 
                id="service-name" 
                placeholder="e.g. Lightspeed POS" 
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                className="h-10 bg-background"
            />
        </div>
        <div className="flex-shrink-0 self-end">
            <Button onClick={generateApiKey} disabled={!serviceName.trim() || isGenerating} className="h-10 font-bold uppercase text-[10px] tracking-widest">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} 
                Authorize Connection
            </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="text-[10px] font-black uppercase tracking-widest">
              <TableHead className="px-6">Service Integration</TableHead>
              <TableHead>Secret Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground italic text-xs">No external systems connected.</TableCell></TableRow>
            ) : (
              apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id} className="group">
                  <TableCell className="font-bold px-6">{apiKey.serviceName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <code className="font-mono text-[9px] text-muted-foreground truncate max-w-[200px]">{apiKey.key}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(apiKey.key)}>
                           <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[9px] font-black uppercase">
                      <CheckCircle className="mr-1 h-2.5 w-2.5" />
                      {apiKey.status}
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
                          <AlertDialogTitle>Revoke Integration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will disconnect <span className="font-bold">{apiKey.serviceName}</span>. Any data sync dependent on this key will fail.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteKey(apiKey.serviceName)} className="bg-destructive hover:bg-destructive/90 font-bold uppercase text-[10px] tracking-widest">
                            Confirm Revocation
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
