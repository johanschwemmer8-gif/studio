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
  PlusCircle, List, Eye, Trash2, RefreshCw, 
  UserPlus, AlertTriangle, EyeOff, Loader2,
  ShieldCheck, KeyRound, CheckCircle2
} from 'lucide-react';
import RetailerDashboardPreview from '@/components/dashboard/retailer-dashboard-preview';
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignUserClaims } from '@/ai/flows/assign-user-claims';
import { Badge } from '@/components/ui/badge';

export type SavedRetailer = {
  name: string;
};

function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

function VerifiedAccessManager({ retailers }: { retailers: SavedRetailer[] }) {
    const [targetUid, setTargetUid] = useState('');
    const [selectedRole, setSelectedRole] = useState<'retailerAdmin' | 'storeManager' | 'analyst'>('retailerAdmin');
    const [selectedRetailer, setSelectedRetailer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAssign = async () => {
        if (!targetUid || !selectedRetailer) return;
        setIsLoading(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const result = await assignUserClaims({
                idToken: idToken || '',
                targetUid,
                role: selectedRole,
                retailerId: slugify(selectedRetailer)
            });

            if (result.success) {
                toast({ title: "Identity Verified", description: result.message });
                setTargetUid('');
            } else {
                throw new Error(result.message);
            }
        } catch (e: any) {
            toast({ title: "Provisioning Failed", description: e.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Verified Claim Manager
                </CardTitle>
                <CardDescription className="text-xs">Securely assign trusted tenant identity and roles to users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Firebase User UID</Label>
                        <Input placeholder="e.g. gHZ9n7s2b9X8..." value={targetUid} onChange={e => setTargetUid(e.target.value)} className="bg-white h-9 text-xs font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Tenant/Retailer</Label>
                            <Select onValueChange={setSelectedRetailer} value={selectedRetailer}>
                                <SelectTrigger className="bg-white h-9 text-xs"><SelectValue placeholder="Select Tenant" /></SelectTrigger>
                                <SelectContent>
                                    {retailers.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">Role</Label>
                            <Select onValueChange={(v: any) => setSelectedRole(v)} value={selectedRole}>
                                <SelectTrigger className="bg-white h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="retailerAdmin">Admin</SelectItem>
                                    <SelectItem value="storeManager">Manager</SelectItem>
                                    <SelectItem value="analyst">Analyst</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleAssign} disabled={isLoading || !targetUid || !selectedRetailer} className="w-full gap-2 font-black uppercase text-[10px] tracking-widest">
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
                    Provision Trusted Access
                </Button>
            </CardFooter>
        </Card>
    );
}

function AddUserDialog({ retailer }: { retailer: SavedRetailer }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [createdUid, setCreatedUid] = useState<string | null>(null);
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
            const result = await createUserWithEmailAndPassword(auth, email, password);
            setCreatedUid(result.user.uid);
            toast({
                title: "Authentication Created",
                description: `UID: ${result.user.uid}. Next: Provision Claims.`,
            });
            form.reset();
        } catch (error: any) {
            setFormError(error.message);
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
                {!createdUid ? (
                    <form onSubmit={handleCreateUser}>
                        <DialogHeader>
                            <DialogTitle>Setup User for {retailer.name}</DialogTitle>
                            <DialogDescription>Step 1: Create Firebase Authentication account.</DialogDescription>
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
                                <Label className="text-[10px] font-black uppercase">Password</Label>
                                <div className="relative">
                                    <Input name="password" type={showPassword ? 'text' : 'password'} required className="pr-10" />
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Auth Account"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <DialogHeader>
                            <DialogTitle>Provision Access</DialogTitle>
                            <DialogDescription>Step 2: Assign custom claims to UID: <code className="text-xs">{createdUid}</code></DialogDescription>
                        </DialogHeader>
                        <VerifiedAccessManager retailers={[retailer]} />
                        <Button variant="outline" className="w-full" onClick={() => setCreatedUid(null)}>Add Another</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function AdminPage() {
  const [newRetailerName, setNewRetailerName] = useState('');
  const [savedRetailers, setSavedRetailers] = useState<SavedRetailer[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const storedRetailers = localStorage.getItem('savedRetailers');
    if (storedRetailers) {
        setSavedRetailers(JSON.parse(storedRetailers));
    }
  }, []);

  const handleAddRetailer = () => {
    if (newRetailerName.trim()) {
      const newSavedRetailer = { name: newRetailerName };
      const updatedSavedRetailers = [...savedRetailers, newSavedRetailer];
      setSavedRetailers(updatedSavedRetailers);
      localStorage.setItem('savedRetailers', JSON.stringify(updatedSavedRetailers));
      setNewRetailerName('');
      toast({
        title: "Retailer Added!",
        description: `"${newRetailerName}" has been created.`
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
                {savedRetailers.length > 0 ? (
                    <div className="space-y-2">
                        {savedRetailers.map((retailer, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 group hover:bg-muted/50 transition-colors">
                                <List className="h-4 w-4 text-muted-foreground" />
                                <span className="font-bold text-sm flex-1">{retailer.name}</span>
                                <AddUserDialog retailer={retailer} />
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                    <Link href={`/dashboard/admin/view/${slugify(retailer.name)}`}><Eye className="h-4 w-4" /></Link>
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
            <VerifiedAccessManager retailers={savedRetailers} />
            
            <Card className="border-accent border-2 bg-accent/5">
                <CardHeader><CardTitle className="text-sm font-black uppercase">Platform Audit</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Identity Protocol</span>
                        <Badge variant="outline" className="text-[10px] font-black uppercase bg-green-50 text-green-700">JWT Claim</Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Tenant Bound</span>
                        <Badge variant="outline" className="text-[10px] font-black uppercase bg-green-50 text-green-700">Enforced</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
