
'use client';

import { Suspense, useState } from 'react';
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
import { AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    if (!auth) {
        setError("Firebase is not configured correctly. Please check your environment variables.");
        setIsLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      router.push(redirectPath);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (emailToReset: string, closeDialog: () => void) => {
    if (!emailToReset) {
        toast({
            title: "Email Required",
            description: "Please enter your email address.",
            variant: "destructive",
        });
        return;
    }
    if (!auth) {
        setError("Firebase is not configured correctly.");
        return;
    }

    setIsResetting(true);
    try {
        await sendPasswordResetEmail(auth, emailToReset);
        toast({
            title: "Password Reset Email Sent",
            description: `If an account exists for ${emailToReset}, you will receive an email with instructions.`,
        });
        closeDialog();
        setResetEmail('');
    } catch (error: any) {
         toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsResetting(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Tabs defaultValue={view === 'retailer' ? 'retailer' : 'admin'} className="w-full max-w-sm">
        {view !== 'retailer' && (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">iNteract Admin</TabsTrigger>
            <TabsTrigger value="retailer">Retailer MVP</TabsTrigger>
          </TabsList>
        )}
        
        {/* Admin Login Tab */}
        <TabsContent value="admin">
          <Card>
            <form onSubmit={(e) => handleLogin(e, 'admin')}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Admin Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@interact.io"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                    <Dialog open={isAdminResetOpen} onOpenChange={setIsAdminResetOpen}>
                        <DialogTrigger asChild>
                            <button type="button" className="underline text-muted-foreground">Forgot password?</button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reset Admin Password</DialogTitle>
                                <DialogDescription>
                                    Enter your admin email address to receive a password reset link.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="reset-email-admin">Email Address</Label>
                                <Input
                                    id="reset-email-admin"
                                    type="email"
                                    placeholder="admin@interact.io"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                <Button type="button" onClick={() => handlePasswordReset(resetEmail, () => setIsAdminResetOpen(false))} disabled={isResetting}>
                                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Reset Link
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Retailer Login Tab */}
        <TabsContent value="retailer">
           <Card>
            <form onSubmit={(e) => handleLogin(e, 'retailer')}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Retailer Login</CardTitle>
                <CardDescription>
                  Access your Retailer MVP dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="retailer-email">Email</Label>
                  <Input
                    id="retailer-email"
                    type="email"
                    placeholder="manager@retailer.com"
                    value={retailerEmail}
                    onChange={(e) => setRetailerEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retailer-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="retailer-password"
                      type={showPassword ? 'text' : 'password'}
                      value={retailerPassword}
                      onChange={(e) => setRetailerPassword(e.target.value)}
                      required
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                    <Dialog open={isRetailerResetOpen} onOpenChange={setIsRetailerResetOpen}>
                        <DialogTrigger asChild>
                            <button type="button" className="underline text-muted-foreground">Forgot password?</button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reset Retailer Password</DialogTitle>
                                <DialogDescription>
                                    Enter your retailer email address to receive a password reset link.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="reset-email-retailer">Email Address</Label>
                                <Input
                                    id="reset-email-retailer"
                                    type="email"
                                    placeholder="manager@retailer.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                <Button type="button" onClick={() => handlePasswordReset(resetEmail, () => setIsRetailerResetOpen(false))} disabled={isResetting}>
                                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Reset Link
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
