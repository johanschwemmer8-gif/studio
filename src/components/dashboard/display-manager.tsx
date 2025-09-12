
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, Link, Tv, MonitorSmartphone, MapPin, Building2, Clock } from 'lucide-react';
import { getDisplays, type Display } from '@/ai/flows/get-displays';
import { registerDisplay } from '@/ai/flows/register-display';
import { storesByRegion } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

function ClientFormattedDate({ timestamp }: { timestamp: any }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      setFormattedDate(new Date(timestamp.toDate()).toLocaleString());
    } else if (timestamp) {
       setFormattedDate(new Date(timestamp).toLocaleString());
    }
  }, [timestamp]);

  if (!formattedDate) {
    return <span className="text-xs italic">pending...</span>;
  }

  return <span>{formattedDate}</span>;
}

export default function DisplayManager() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  
  const allStores = storesByRegion.flatMap(region => region.stores.map(store => ({ ...store, province: region.province })));

  const fetchDisplays = async () => {
    setLoading(true);
    try {
      const displayData = await getDisplays({ retailerId: 'ret_123xyz' });
      setDisplays(displayData);
    } catch (error) {
      console.error("Error fetching displays:", error);
      toast({ title: 'Error', description: 'Could not fetch display data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisplays();
  }, [toast]);
  
  const handleRegisterDisplay = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRegistering(true);
    const formData = new FormData(event.currentTarget);
    const storeCode = formData.get('storeId') as string;
    const storeName = allStores.find(s => s.code.toString() === storeCode)?.name || 'Unknown Store';

    try {
        const result = await registerDisplay({ retailerId: 'ret_123xyz', storeId: storeName });
        if (result.success) {
            toast({
                title: 'Display Registered',
                description: `New display with ID ${result.displayId} has been created.`,
            });
            fetchDisplays(); // Refresh the list
            setIsModalOpen(false);
        } else {
            throw new Error(result.message || 'Failed to register display.');
        }
    } catch (error: any) {
        toast({ title: 'Registration Failed', description: error.message, variant: 'destructive'});
    } finally {
        setIsRegistering(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
            <CardTitle className="flex items-center gap-2"><MonitorSmartphone className="text-primary" /> In-store Display Management</CardTitle>
            <CardDescription>
                Register new in-store screens and assign content configurations to them.
            </CardDescription>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2"/> Register New Display</Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleRegisterDisplay}>
                    <DialogHeader>
                        <DialogTitle>Register a New Display</DialogTitle>
                        <DialogDescription>Select the store where this display will be located. A unique ID will be generated.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="storeId">Store Location</Label>
                        <Select name="storeId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a store" />
                            </SelectTrigger>
                            <SelectContent>
                                {allStores.map(store => (
                                    <SelectItem key={store.code} value={store.code.toString()}>{store.name}, {store.province}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isRegistering}>
                            {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Register Display
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display ID</TableHead>
              <TableHead>Store Location</TableHead>
              <TableHead>Assigned Content</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            ) : displays.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No displays registered yet.</TableCell></TableRow>
            ) : (
              displays.map((display) => (
                <TableRow key={display.displayId}>
                  <TableCell className="font-mono text-xs">{display.displayId}</TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4"/>
                        {display.storeId}
                      </div>
                  </TableCell>
                  <TableCell>
                    {display.contentConfigId ? (
                        <code className="text-xs font-mono p-1 rounded-sm bg-muted">{display.contentConfigId}</code>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={display.status === 'online' ? 'default' : 'secondary'} className={display.status === 'online' ? 'bg-green-500/20 text-green-700' : ''}>
                        {display.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="h-4 w-4"/>
                        <ClientFormattedDate timestamp={display.lastPing} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled>
                        <Link className="mr-2 h-3.5 w-3.5"/>
                        Assign Content
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
