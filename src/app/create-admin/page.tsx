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
    UserPlus, Search, Loader2, AlertTriangle, 
    Eye, EyeOff, ShieldCheck, RefreshCw, KeyRound, CheckCircle2, UserCheck
} from 'lucide-react';
import Link from 'next/link';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { listAuthUsers, type AuthUser } from '@/ai/flows/list-auth-users';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type UserAccount = {
  uid: string;
  name?: string;
  email: string;
  role: string;
  retailerId?: string;
  isActive: boolean;
};

export default function UserAccessControlPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [firestoreUsers, setFirestoreUsers] = useState<UserAccount[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDiscovering, startDiscovery] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const { toast } = useToast();

  // 1. Live Firestore Subscription (Provisioned Users)
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserAccount));
      setFirestoreUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Fetch users error:", error);
      toast({ title: "Sync Error", description: "Could not retrieve user registry.", variant: "destructive" });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  // 2. Discover Auth Accounts (Unprovisioned Users)
  const handleDiscoverUsers = () => {
    startDiscovery(async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken(true);
            if (!idToken) throw new Error("Auth session expired.");
            const users = await listAuthUsers({ idToken });
            setAuthUsers(users);
            toast({ title: "Auth Discovery Complete", description: `Identified ${users.length} accounts in project.` });
        } catch (e: any) {
            toast({ title: "Discovery Failed", description: e.message, variant: "destructive" });
        }
    });
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsCreating(true);

    const form = event.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (!auth || !db) {
        setFormError("Infrastructure Logic Error.");
        setIsCreating(false);
        return;
    }

    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            name,
            email,
            role: 'analyst',
            isActive: true,
            createdAt: serverTimestamp()
        }, { merge: true });

        toast({ title: "Account Created", description: `Identification successful for ${email}.` });
        form.reset();
        setIsCreateDialogOpen(false);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            setFormError("Account already exists in Firebase Auth. Please use 'Discover Accounts' to provision it.");
        } else {
            setFormError(error.message);
        }
    } finally {
        setIsCreating(false);
    }
  };

  // Merge discovery results with provisioned state
  const unprovisionedAuthUsers = authUsers.filter(au => !firestoreUsers.some(fu => fu.uid === au.uid));

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
       <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tight uppercase">Identity Registry</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Authoritative control of all platform and retailer accounts.</p>
      </div>

      <Tabs defaultValue="provisioned" className="w-full">
        <div className="flex justify-between items-center mb-6">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="provisioned" className="rounded-lg font-bold gap-2">
                    <ShieldCheck className="h-4 w-4" /> Provisioned
                </TabsTrigger>
                <TabsTrigger value="auth" className="rounded-lg font-bold gap-2">
                    <UserCheck className="h-4 w-4" /> Discoverable Accounts
                </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-3">
                <Button variant="outline" onClick={handleDiscoverUsers} disabled={isDiscovering} className="font-bold uppercase text-[10px] tracking-widest gap-2">
                    {isDiscovering ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                    Discover Auth Accounts
                </Button>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-black uppercase text-[10px] tracking-widest gap-2 px-6">
                            <UserPlus className="h-4 w-4" />
                            Create New Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreateUser}>
                            <DialogHeader>
                                <DialogTitle>Setup User Account</DialogTitle>
                                <DialogDescription>Create a fresh Firebase Authentication record.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                {formError && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Friction Point</AlertTitle>
                                        <AlertDescription className="text-xs">{formError}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Full Name</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Email Address</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Initial Password</Label>
                                    <div className="relative">
                                        <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="pr-10" />
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 h-6 w-6" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating} className="w-full h-12 font-black uppercase tracking-widest text-xs">
                                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Identity"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        <TabsContent value="provisioned">
            <Card className="border-primary/10 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Active Platform Registry</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="text-[10px] font-black uppercase tracking-widest">
                                <TableHead className="px-6">Identity</TableHead>
                                <TableHead>UID Reference</TableHead>
                                <TableHead>Tenant Anchor</TableHead>
                                <TableHead>Access Level</TableHead>
                                <TableHead className="text-right px-6">Operational Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/20" /></TableCell></TableRow>
                        ) : firestoreUsers.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-xs uppercase tracking-widest">No provisioned users found.</TableCell></TableRow>
                        ) : (
                            firestoreUsers.map((user) => (
                            <TableRow key={user.uid} className="group hover:bg-muted/30 transition-colors">
                                <TableCell className="px-6">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-sm">{user.name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell><code className="text-[9px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">{user.uid}</code></TableCell>
                                <TableCell>
                                    {user.retailerId ? (
                                        <Badge variant="outline" className="font-mono text-[9px] uppercase font-bold border-primary/10">{user.retailerId}</Badge>
                                    ) : <span className="text-[10px] text-muted-foreground italic">Unassigned</span>}
                                </TableCell>
                                <TableCell><Badge className="text-[9px] font-black uppercase tracking-widest">{user.role}</Badge></TableCell>
                                <TableCell className="text-right px-6">
                                    <Badge variant={user.isActive ? "default" : "outline"} className={cn("text-[9px] font-black uppercase", user.isActive ? "bg-green-500" : "text-muted-foreground")}>
                                        {user.isActive ? 'ACTIVE' : 'DISABLED'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="auth">
             <Card className="border-accent/20 bg-accent/5 shadow-inner">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-accent-foreground" /> 
                        Unprovisioned Auth Accounts
                    </CardTitle>
                    <CardDescription className="text-xs">Users existing in Firebase Authentication but not yet linked to the iNteract platform.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/50">
                            <TableRow className="text-[10px] font-black uppercase tracking-widest">
                                <TableHead className="px-6">Auth Identity</TableHead>
                                <TableHead>Firebase UID</TableHead>
                                <TableHead>Existing Claims</TableHead>
                                <TableHead className="text-right px-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isDiscovering ? (
                             <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-accent" /></TableCell></TableRow>
                        ) : unprovisionedAuthUsers.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-xs font-bold uppercase tracking-widest">No unlinked Auth accounts discovered.</TableCell></TableRow>
                        ) : (
                            unprovisionedAuthUsers.map((u) => (
                                <TableRow key={u.uid}>
                                    <TableCell className="px-6 font-bold text-xs">{u.email || u.displayName || 'Unnamed User'}</TableCell>
                                    <TableCell><code className="text-[9px] font-mono opacity-60">{u.uid}</code></TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {u.role && <Badge variant="secondary" className="text-[8px] uppercase">{u.role}</Badge>}
                                            {u.retailerId && <Badge variant="outline" className="text-[8px] uppercase">{u.retailerId}</Badge>}
                                            {!u.role && !u.retailerId && <span className="text-[10px] italic text-muted-foreground">None</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <Button asChild variant="secondary" size="sm" className="font-black uppercase text-[9px] h-7 tracking-widest">
                                            <Link href="/dashboard/admin">
                                                Provision Access
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button asChild variant="outline" className="font-bold uppercase text-[10px] tracking-widest gap-2">
            <Link href="/dashboard/admin">
                <KeyRound className="h-4 w-4" />
                Open Verified Access Manager
            </Link>
        </Button>
      </div>
    </div>
  );
}
