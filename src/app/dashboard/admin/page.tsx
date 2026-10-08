'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  PlusCircle, List, Eye, RefreshCw,
  UserPlus, Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createPlatformRetailerUserAction } from '@/ai/flows/create-platform-retailer-user';
import { Badge } from '@/components/ui/badge';
import { PlatformAiGovernanceManager } from '@/components/dashboard/platform-ai-governance-manager';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  normalizeTenantDocument,
  type SavedRetailer,
} from '@/lib/schemas/tenant';
import { createRetailerTenant } from '@/ai/flows/create-retailer-tenant';


function AddUserDialog({ retailer }: { retailer: SavedRetailer }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);
        setIsLoading(true);

        const form = event.currentTarget;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;

        if (!auth) {
            setFormError("Infrastructure Logic Error.");
            setIsLoading(false);
            return;
        }

        try {
            const idToken = await auth.currentUser?.getIdToken(true);

            await createPlatformRetailerUserAction({
                idToken: idToken || '',
                retailerId: retailer.id,
                displayName: name,
                email,
                password,
                role: 'networkOwner',
                scope: {
                    level: 'network',
                    networkId: retailer.id,
                },
            });

            toast({
                title: "Network Owner Established",
                description: `${name} can now access ${retailer.name} as Network Owner.`,
            });
            form.reset();
            setIsDialogOpen(false);
        } catch (e: any) {
            console.error("Provisioning Error:", e);
            setFormError("A network or system error occurred while provisioning the user.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="font-bold text-[10px] uppercase">
                    <UserPlus className="mr-2 h-3.5 w-3.5" />
                    Setup User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateUser}>
                    <DialogHeader>
                        <DialogTitle>Establish Network Owner for {retailer.name}</DialogTitle>
                        <DialogDescription>Create the retailer's initial network-level administrator.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Full Name</Label>
                            <Input name="name" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Email</Label>
                            <Input name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Temporary Password</Label>
                            <div className="relative">
                                <Input name="password" type={showPassword ? 'text' : 'password'} required className="pr-10" />
                            </div>
                        </div>

                        <div className="space-y-2 rounded-md border p-3">
                            <Label className="text-[10px] font-black uppercase">Initial Authority</Label>
                            <p className="text-xs font-semibold">Network Owner</p>
                            <p className="text-[11px] text-muted-foreground">
                                Establishes the retailer's first network-level administrator.
                                Additional user administration is configured separately.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Establish Network Owner"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminPage() {
  const [newRetailerName, setNewRetailerName] = useState('');
  const [retailers, setRetailers] = useState<SavedRetailer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'tenants'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: SavedRetailer[] = snapshot.docs.map((tenantDoc) =>
          normalizeTenantDocument(tenantDoc.id, tenantDoc.data())
        );
        setRetailers(fetched);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddRetailer = async () => {
    const name = newRetailerName.trim();
    if (!name) return;

    try {
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        toast({
          title: "Failed to Add",
          description: "Your administrator session has expired.",
          variant: "destructive",
        });
        return;
      }

      const result = await createRetailerTenant({
        idToken,
        name,
      });

      if (!result.success) {
        toast({
          title: "Failed to Add",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      setNewRetailerName('');
      toast({
        title: "Retailer Added!",
        description: result.message,
      });
    } catch (error) {
      console.error("[Retailer Admin] Retailer creation failed:", error);
      toast({
        title: "Failed to Add",
        description: "Retailer creation failed.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">iNteract Admin Panel</h2>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Platform-level governance, retailer onboarding, and trusted identity provisioning.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card className="border-primary/10">
                <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Retailer Onboarding</CardTitle>
                    <CardDescription>Register new retail groups to the platform.</CardDescription>
                </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. Woolworths"
                            value={newRetailerName}
                            onChange={(e) => setNewRetailerName(e.target.value)}
                            className="h-11"
                        />
                        <Button onClick={handleAddRetailer} disabled={!newRetailerName.trim()} className="h-11 px-8">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Retailer
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg">Active Retailers</CardTitle>
                </CardHeader>
                <CardContent>
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                ) : retailers.length > 0 ? (
                    <div className="space-y-2">
                        {retailers.map((retailer) => (
                            <div key={retailer.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 group hover:bg-muted/50 transition-colors">
                                <List className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                    <span className="font-bold text-sm block truncate">{retailer.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{retailer.id}</span>
                                </div>
                                {retailer.type === 'test' && <Badge variant="outline" className="text-[8px] font-black uppercase bg-accent/10 border-accent/20">Test Tenant</Badge>}
                                <AddUserDialog retailer={retailer} />
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                    <Link href={`/dashboard/admin/view/${retailer.id}`}><Eye className="h-4 w-4" /></Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
                        <p className="text-xs font-bold uppercase tracking-widest">No retailers configured.</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <PlatformAiGovernanceManager />



        </div>
      </div>
    </div>
  );
}
