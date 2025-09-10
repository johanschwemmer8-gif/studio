
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
import { KeyRound, PlusCircle, Copy, Trash2, Ban, CheckCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { type SavedRetailer } from '@/app/dashboard/admin/page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ApiKey = {
  id: string;
  retailerName: string;
  key: string;
  createdAt: string;
  status: 'active' | 'revoked';
};

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [retailers, setRetailers] = useState<SavedRetailer[]>([]);
  const [selectedRetailer, setSelectedRetailer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('apiKeys');
      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      }
      const storedRetailers = localStorage.getItem('savedRetailers');
      if (storedRetailers) {
        setRetailers(JSON.parse(storedRetailers));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      toast({
        title: 'Error',
        description: 'Could not load data from your browser storage.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  }, [toast]);

  const saveKeysToStorage = (keys: ApiKey[]) => {
    localStorage.setItem('apiKeys', JSON.stringify(keys));
    setApiKeys(keys);
  };

  const generateApiKey = () => {
    if (!selectedRetailer) {
        toast({
            title: 'No Retailer Selected',
            description: 'Please select a retailer before generating a key.',
            variant: 'destructive',
        });
        return;
    }
    const newKey = `ik_${crypto.randomUUID().replace(/-/g, '')}`;
    const newApiKey: ApiKey = {
      id: crypto.randomUUID(),
      retailerName: selectedRetailer,
      key: newKey,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    saveKeysToStorage([...apiKeys, newApiKey]);
    toast({
      title: 'API Key Generated!',
      description: `A new key has been created for ${selectedRetailer}.`,
    });
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied to Clipboard!',
      description: 'The API key has been copied.',
    });
  };

  const toggleKeyStatus = (id: string, newStatus: 'active' | 'revoked') => {
    const updatedKeys = apiKeys.map((k) => (k.id === id ? { ...k, status: newStatus } : k));
    saveKeysToStorage(updatedKeys);
    toast({
      title: `Key ${newStatus === 'active' ? 'Re-activated' : 'Revoked'}`,
      description: `The key's status has been updated.`,
    });
  };

  const deleteKey = (id: string) => {
    const updatedKeys = apiKeys.filter((k) => k.id !== id);
    saveKeysToStorage(updatedKeys);
    toast({
      title: 'API Key Deleted',
      description: 'The key has been permanently removed.',
      variant: 'destructive',
    });
  };
  
  const maskKey = (key: string) => `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
        <div className="flex-1 space-y-2">
            <Label htmlFor="retailer-select">Select Retailer</Label>
            <Select onValueChange={setSelectedRetailer} value={selectedRetailer}>
                <SelectTrigger id="retailer-select">
                    <SelectValue placeholder="Select a retailer to generate a key" />
                </SelectTrigger>
                <SelectContent>
                    {retailers.length > 0 ? (
                        retailers.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)
                    ) : (
                        <SelectItem value="none" disabled>No retailers found. Please add one first.</SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
        <div className="flex-shrink-0 self-end">
            <Button onClick={generateApiKey} disabled={!selectedRetailer}>
                <PlusCircle className="mr-2 h-4 w-4" /> Generate New Key
            </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Retailer</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">Loading API keys...</TableCell>
              </TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No API keys have been generated yet.
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.retailerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">{maskKey(apiKey.key)}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(apiKey.key)}>
                           <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={apiKey.status === 'active' ? 'default' : 'destructive'}>
                      {apiKey.status === 'active' ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Ban className="mr-1 h-3 w-3" />
                      )}
                      {apiKey.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                     {apiKey.status === 'active' ? (
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleKeyStatus(apiKey.id, 'revoked')}>
                            <Ban className="h-4 w-4" />
                            <span className="sr-only">Revoke</span>
                         </Button>
                     ) : (
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => toggleKeyStatus(apiKey.id, 'active')}>
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Re-activate</span>
                        </Button>
                     )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the API key for <span className="font-semibold">{apiKey.retailerName}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteKey(apiKey.id)} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete key
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
