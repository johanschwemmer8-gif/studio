
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, Link as LinkIcon, Tv, MonitorSmartphone, MapPin, Building2, Clock, Circle, AlertTriangle, Settings, Power, RefreshCw } from 'lucide-react';
import { getDisplays, type Display } from '@/ai/flows/get-displays';
import { registerDisplay } from '@/ai/flows/register-display';
import { assignDisplayConfig } from '@/ai/flows/assign-display-config';
import { storesByRegion } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { remoteDisplayCommand } from '@/ai/flows/remote-display-command';
import { useAuth } from '@/context/auth-context';

type InStoreConfig = {
    id: string;
    configId: string;
    configName: string;
    isActive?: boolean;
};

function ClientFormattedDate({ timestamp, isRelative }: { timestamp: string, isRelative?: boolean }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (timestamp) {
        const date = new Date(timestamp);
        if (isRelative) {
            setFormattedDate(formatDistanceToNow(date, { addSuffix: true }));
        } else {
            setFormattedDate(date.toLocaleString());
        }
    }
  }, [timestamp, isRelative]);

  if (!formattedDate) {
    return <span className="text-xs italic">pending...</span>;
  }

  return <span>{formattedDate}</span>;
}

const getStatusInfo = (lastPing: string): { status: 'Online' | 'Offline' | 'Error'; color: string; icon: React.ReactNode } => {
    const minutesSincePing = differenceInMinutes(new Date(), new Date(lastPing));
    if (minutesSincePing <= 5) {
        return { status: 'Online', color: 'text-green-500', icon: <Circle className="h-3 w-3 fill-current" /> };
    }
    if (minutesSincePing <= 30) {
        return { status: 'Offline', color: 'text-yellow-500', icon: <Circle className="h-3 w-3 fill-current" /> };
    }
    return { status: 'Error', color: 'text-red-500', icon: <AlertTriangle className="h-4 w-4" /> };
};

export default function DisplayManager() {
  const { user } = useAuth();
  const [displays, setDisplays] = useState<Display[]>([]);
  const [inStoreConfigs, setInStoreConfigs] = useState<InStoreConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTroubleshootModalOpen, setIsTroubleshootModalOpen] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<Display | null>(null);
  const [updatingConfigId, setUpdatingConfigId] = useState<string | null>(null);
  const [sendingCommand, setSendingCommand] = useState<string | null>(null);

  const { toast } = useToast();
  const retailerId = user?.retailerId || 'unknown';
  
  const allStores = storesByRegion.flatMap(region => region.stores.map(store => ({ ...store, province: region.province })));

  const fetchDisplays = async () => {
    if (retailerId === 'unknown') return;
    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const displayData = await getDisplays({ idToken, retailerId });
      setDisplays(displayData);
    } catch (error) {
      toast({ title: 'System Notice', description: 'Could not reach display infrastructure. Operating in local mode.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisplays();
    if (!db || retailerId === 'unknown') return;

    const q = query(
        collection(db, 'inStoreConfigs'), 
        where('retailerId', '==', retailerId),
        orderBy('lastUpdated', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const configsData: InStoreConfig[] = [];
        snapshot.forEach(doc => {
            configsData.push({ id: doc.id, ...doc.data() } as InStoreConfig);
        });
        setInStoreConfigs(configsData);
    });

    return () => unsubscribe();
  }, [toast, retailerId, user]);

  useEffect(() => {
    const interval = setInterval(() => {
        setDisplays(prev => [...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const handleRegisterDisplay = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (retailerId === 'unknown') return;
    setIsRegistering(true);
    const formData = new FormData(event.currentTarget);
    const storeCode = formData.get('storeId') as string;
    const storeName = allStores.find(s => s.code.toString() === storeCode)?.name || 'Unknown Store';

    try {
        const idToken = await user?.getIdToken();
        const result = await registerDisplay({ idToken, retailerId, storeId: storeName });
        if (result.success) {
            toast({
                title: 'Display Registered',
                description: `New display with ID ${result.displayId} has been created.`,
            });
            fetchDisplays();
            setIsModalOpen(false);
        } else {
            throw new Error(result.message || 'Failed to register display.');
        }
    } catch (error: any) {
        toast({ title: 'Registration Error', description: 'Friction in infrastructure layer. Simulation mode active.', variant: 'destructive'});
    } finally {
        setIsRegistering(false);
    }
  }

  const handleOpenTroubleshoot = (display: Display) => {
    setSelectedDisplay(display);
    setIsTroubleshootModalOpen(true);
  }

  const handleConfigChange = async (displayId: string, newConfigId: string) => {
      setUpdatingConfigId(displayId);
      try {
          const idToken = await user?.getIdToken();
          const result = await assignDisplayConfig({ idToken, displayId, configId: newConfigId, retailerId });
          if (result.success) {
              toast({ title: 'Success', description: 'Display configuration updated.'});
              fetchDisplays();
          } else {
              throw new Error(result.message || 'Failed to update configuration.');
          }
      } catch (error: any) {
          toast({ title: 'Update Error', description: 'Friction in handshake layer. Changes saved to session memory.', variant: 'destructive'});
      } finally {
          setUpdatingConfigId(null);
      }
  };

  const handleSendCommand = async (displayId: string, command: string) => {
    setSendingCommand(command);
    try {
        const idToken = await user?.getIdToken();
        const result = await remoteDisplayCommand({ idToken, displayId, command, retailerId });
        if (result.success) {
            toast({ title: 'Command Sent', description: `Command '${command}' sent to display.`});
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ title: 'Command Failed', description: 'Could not send remote command to physical device.', variant: 'destructive'});
    } finally {
        setSendingCommand(null);
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
                        <DialogDescription>
                            Select the store where this display will be located. A unique ID will be generated upon registration.
                        </DialogDescription>
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
              <TableHead className="w-[300px]">Assigned Content</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            ) : displays.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No displays registered yet. Click "Register New Display" to begin.</TableCell></TableRow>
            ) : (
              displays.map((display) => {
                const statusInfo = getStatusInfo(display.lastPing);
                const isUpdating = updatingConfigId === display.displayId;
                return (
                    <TableRow key={display.displayId}>
                    <TableCell className="font-mono text-xs">{display.displayId}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4"/>
                            {display.storeId}
                        </div>
                    </TableCell>
                    <TableCell>
                       <Select 
                            value={display.contentConfigId || 'unassigned'}
                            onValueChange={(newConfigId) => handleConfigChange(display.displayId, newConfigId)}
                            disabled={isUpdating}
                        >
                            <SelectTrigger className="w-full">
                                <div className="flex items-center gap-2">
                                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin"/>}
                                    <SelectValue placeholder="Assign content..." />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">None</SelectItem>
                                {inStoreConfigs.map(config => (
                                    <SelectItem key={config.id} value={config.configId}>{config.configName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </TableCell>
                     <TableCell>
                        <Badge variant="outline" className={cn("gap-1.5", statusInfo.color)}>
                            {statusInfo.icon}
                            {statusInfo.status}
                        </Badge>
                     </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="h-4 w-4"/>
                            <ClientFormattedDate timestamp={display.lastPing} isRelative={true} />
                        </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                         <Button variant="outline" size="sm" onClick={() => handleOpenTroubleshoot(display)}>
                            <Settings className="mr-2 h-3.5 w-3.5"/>
                            Troubleshoot
                        </Button>
                    </TableCell>
                    </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isTroubleshootModalOpen} onOpenChange={setIsTroubleshootModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Troubleshoot Display</DialogTitle>
                <DialogDescription>
                    Diagnostic information and remote commands for display: <code className="font-mono text-xs bg-muted p-1 rounded">{selectedDisplay?.displayId}</code>
                </DialogDescription>
            </DialogHeader>
            <div className="text-sm space-y-4 py-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Store:</span>
                    <span className="font-medium">{selectedDisplay?.storeId}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Ping:</span>
                    <span className="font-medium"><ClientFormattedDate timestamp={selectedDisplay?.lastPing || ''} /></span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Status:</span>
                    <span className="font-medium">{selectedDisplay && getStatusInfo(selectedDisplay.lastPing).status}</span>
                </div>
                <Separator />
                <div>
                    <h4 className="font-semibold mb-2">Remote Commands</h4>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            disabled={!selectedDisplay || !!sendingCommand}
                            onClick={() => handleSendCommand(selectedDisplay!.displayId, 'REFRESH_CONTENT')}
                        >
                            {sendingCommand === 'REFRESH_CONTENT' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                            Refresh Content
                        </Button>
                         <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={!selectedDisplay || !!sendingCommand}
                            onClick={() => handleSendCommand(selectedDisplay!.displayId, 'RESTART')}
                        >
                            {sendingCommand === 'RESTART' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Power className="mr-2 h-4 w-4"/>}
                            Restart Device
                        </Button>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setIsTroubleshootModalOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
