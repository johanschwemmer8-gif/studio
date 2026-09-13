'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Eye, EyeOff, ShieldCheck, UserPlus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createUser } from '@/ai/flows/create-user';

function LoginPageContent() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [retailerEmail, setRetailerEmail] = useState('');
  const [retailerPassword, setRetailerPassword] = useState('');
  
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isBootstrapOpen, setIsBootstrapOpen] = useState(false);
  const [isBootstrapping, startBootstrap] = useTransition();
  
  const [isAdminResetOpen, setIsAdminResetOpen] = useState(false);
  const [isRetailerResetOpen, setIsRetailerResetOpen] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>, userType: 'admin' | 'retailer') => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const email = userType === 'admin' ? adminEmail : retailerEmail;
    const password = userType === 'admin' ? adminPassword : retailerPassword;
    const redirectPath = userType === 'admin' ? '/dashboard/admin' : '/retailer-mvp/dashboard';

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Welcome Back', description: 'Authentication successful.' });
      router.push(redirectPath);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBootstrap = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const name = formData.get('name') as string;

      startBootstrap(async () => {
          try {
              const res = await createUser({
                  name,
                  email,
                  password,
                  role: 'admin',
                  retailerId: 'platform-admin',
                  isBootstrap: true
              });

              if (res.success) {
                  toast({ title: "Bootstrap Successful", description: "Admin identity established. You can now sign in." });
                  setIsBootstrapOpen(false);
              } else {
                  toast({ title: "Bootstrap Failed", description: res.message, variant: "destructive" });
              }
          } catch (e: any) {
              toast({ title: "Error", description: e.message, variant: "destructive" });
          }
      });
  };

  const handlePasswordReset = async (emailToReset: string, closeDialog: () => void) => {
    if (!emailToReset) return;
    setIsResetting(true);
    try {
        await sendPasswordResetEmail(auth, emailToReset);
        toast({ title: "Reset Email Sent", description: "Check your inbox for instructions." });
        closeDialog();
        setResetEmail('');
    } catch (error: any) {
         toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsResetting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
      <Tabs defaultValue={view === 'retailer' ? 'retailer' : 'admin'} className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-background shadow-sm h-12 p-1 rounded-xl">
          <TabsTrigger value="admin" className="rounded-lg font-bold gap-2">
            <ShieldCheck className="h-4 w-4" /> Admin
          </TabsTrigger>
          <TabsTrigger value="retailer" className="rounded-lg font-bold gap-2">
            <UserPlus className="h-4 w-4" /> Retailer
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="admin">
          <Card className="border-primary/10 shadow-2xl">
            <form onSubmit={(e) => handleLogin(e, 'admin')}>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter">Control Plane</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Platform Governance Login</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {error && <Alert variant="destructive" className="py-2"><AlertDescription className="text-[10px] font-bold uppercase">{error}</AlertDescription></Alert>}
                <div className="space-y-1">
                  <Label htmlFor="admin-email">Identity (Email)</Label>
                  <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin-password">Credentials (Password)</Label>
                  <div className="relative">
                    <Input id="admin-password" type={showPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required className="h-11 pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsAdminResetOpen(true)}>Forgot Password?</button>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest text-xs shadow-xl" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In to Platform"}
                </Button>
                
                <Dialog open={isBootstrapOpen} onOpenChange={setIsBootstrapOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100">
                            Register First Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleBootstrap}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent"/> Initial Bootstrap</DialogTitle>
                                <DialogDescription>Register the very first platform administrator account. Only Johan@interactaoe.co.za is authorized for this action.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-1"><Label>Full Name</Label><Input name="name" required /></div>
                                <div className="space-y-1"><Label>Identity Email</Label><Input name="email" type="email" placeholder="Johan@interactaoe.co.za" required /></div>
                                <div className="space-y-1"><Label>Secure Password</Label><Input name="password" type="password" required /></div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-12 font-black" disabled={isBootstrapping}>
                                    {isBootstrapping ? <Loader2 className="animate-spin" /> : "Provision First Identity"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="retailer">
           <Card className="border-primary/10 shadow-2xl">
            <form onSubmit={(e) => handleLogin(e, 'retailer')}>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter">Retailer Portal</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Commercial MVP Access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {error && <Alert variant="destructive" className="py-2"><AlertDescription className="text-[10px] font-bold uppercase">{error}</AlertDescription></Alert>}
                <div className="space-y-1">
                  <Label htmlFor="retailer-email">Email</Label>
                  <Input id="retailer-email" type="email" value={retailerEmail} onChange={(e) => setRetailerEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="retailer-password">Password</Label>
                  <div className="relative">
                    <Input id="retailer-password" type={showPassword ? 'text' : 'password'} value={retailerPassword} onChange={(e) => setRetailerPassword(e.target.value)} required className="h-11 pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsRetailerResetOpen(true)}>Forgot Password?</button>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest text-xs shadow-xl" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In to MVP"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAdminResetOpen} onOpenChange={setIsAdminResetOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
            <div className="space-y-2 py-4">
                <Label>Email Address</Label>
                <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            </div>
            <DialogFooter>
                <Button onClick={() => handlePasswordReset(resetEmail, () => setIsAdminResetOpen(false))} disabled={isResetting}>
                    {isResetting ? <Loader2 className="animate-spin" /> : "Send Link"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin opacity-20" /></div>}>
      <LoginPageContent />
    </Suspense>
  )
}
