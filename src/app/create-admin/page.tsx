
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Trash2, Edit, Loader2, AlertTriangle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type UserAccount = {
  uid: string;
  name?: string;
  email: string;
  role: string;
  retailerId?: string;
  isActive: boolean;
};

export default function CreateAdminPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers: UserAccount[] = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserAccount));
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Fetch users error:", error);
      toast({ title: "Sync Error", description: "Could not retrieve user registry.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsCreating(true);

    const form = event.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (!auth) {
        setFormError("Infrastructure Logic Error.");
        setIsCreating(false);
        return;
    }

    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        toast({
            title: "Account Created",
            description: `Authentication successful for ${email}. Next step: Provision claims in Admin Panel.`,
        });
        form.reset();
        setIsDialogOpen(false);
    } catch (error: any) {
        setFormError(error.message);
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
       <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight uppercase">User Access Control</h1>
        <p className="text-muted-foreground mt-2">Authoritative registry of all platform and retailer accounts.</p>
      </div>
      
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="flex flex-row justify-between items-start border-b bg-muted/30">
          <div>
            <CardTitle className="text-lg">Platform Users</CardTitle>
            <CardDescription className="text-xs">
              Manage accounts and review assigned identity claims.
            </CardDescription>
          </div>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="font-bold uppercase text-[10px] tracking-widest gap-2 h-10 px-6">
                        <UserPlus className="h-4 w-4" />
                        Create New Account
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleCreateUser}>
                        <DialogHeader>
                            <DialogTitle>Setup User Account</DialogTitle>
                            <DialogDescription>
                                Step 1: Create the Firebase Authentication record.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase">Full Name</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase">Email Address</Label>
                                <Input id="email" name="email" type="email" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="password" name="password" className="text-[10px] font-black uppercase">Initial Password</Label>
                                <div className="relative">
                                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="pr-10" />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isCreating} className="w-full">
                                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Auth Account"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="text-[10px] font-black uppercase tracking-widest">
                <TableHead className="px-6">Full Name</TableHead>
                <TableHead>Email / UID</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-20" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground italic text-xs uppercase tracking-widest">
                    No users registered in platform.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.uid} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold px-6">{user.name || 'Anonymous'}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{user.email}</p>
                        <code className="text-[9px] text-muted-foreground font-mono bg-muted/50 px-1 rounded">{user.uid}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.retailerId ? (
                        <Badge variant="outline" className="font-mono text-[9px] uppercase font-bold border-primary/10">{user.retailerId}</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="text-[9px] font-black uppercase tracking-widest">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                        <Badge variant={user.isActive ? "default" : "outline"} className={cn(
                          "text-[9px] font-black uppercase",
                          user.isActive ? "bg-green-500 text-white" : "text-muted-foreground"
                        )}>
                          {user.isActive ? 'ACTIVE' : 'DISABLED'}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t p-6">
            <Button asChild variant="outline" className="font-bold uppercase text-[10px] tracking-widest h-10 px-8 gap-2">
                <Link href="/dashboard/admin">
                  <ShieldCheck className="h-4 w-4" />
                  Go to Claim Provisioning
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
