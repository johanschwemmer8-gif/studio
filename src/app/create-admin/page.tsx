
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
import { UserPlus, Trash2, Edit, Save, Image as ImageIcon, AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd } from 'lucide-react';
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
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';

type User = {
  name: string;
  email: string;
  role: string;
};

export default function CreateAdminPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [dashboardLogoPreview, setDashboardLogoPreview] = useState<string | null>(null);
  const [dashboardLogoWidth, setDashboardLogoWidth] = useState(128);
  
  const [landingLogoPreview, setLandingLogoPreview] = useState<string | null>(null);
  const [landingLogoWidth, setLandingLogoWidth] = useState(128);
  const [landingLogoAlign, setLandingLogoAlign] = useState('flex-start');
  const [landingLogoPadding, setLandingLogoPadding] = useState(0);

  const [formError, setFormError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Load dashboard logo
    const savedDashboardLogo = localStorage.getItem('interact-aoe-logo');
    if (savedDashboardLogo) setDashboardLogoPreview(savedDashboardLogo);
    const savedDashboardWidth = localStorage.getItem('interact-aoe-logo-width');
    if (savedDashboardWidth) setDashboardLogoWidth(Number(savedDashboardWidth));

    // Load landing page logo
    const savedLandingLogo = localStorage.getItem('landing-page-logo');
    if (savedLandingLogo) setLandingLogoPreview(savedLandingLogo);
    const savedLandingWidth = localStorage.getItem('landing-page-logo-width');
    if (savedLandingWidth) setLandingLogoWidth(Number(savedLandingWidth));
    const savedLandingAlign = localStorage.getItem('landing-page-logo-align');
    if (savedLandingAlign) setLandingLogoAlign(savedLandingAlign);
    const savedLandingPadding = localStorage.getItem('landing-page-logo-padding');
    if (savedLandingPadding) setLandingLogoPadding(Number(savedLandingPadding));
  }, []);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const form = event.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (!auth) {
        setFormError("Firebase is not configured. Cannot create user.");
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        setUsers([...users, { name, email, role: 'Administrator' }]);
        toast({
            title: "User Created",
            description: `${name} can now log in.`,
        });
        form.reset();
        setIsDialogOpen(false);
    } catch (error: any) {
        setFormError(error.message);
    }
  };
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'dashboard' | 'landing') => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (type === 'dashboard') {
                  setDashboardLogoPreview(reader.result as string);
              } else {
                  setLandingLogoPreview(reader.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveLogo = (type: 'dashboard' | 'landing') => {
      if (type === 'dashboard') {
          if (dashboardLogoPreview) {
              localStorage.setItem('interact-aoe-logo', dashboardLogoPreview);
              localStorage.setItem('interact-aoe-logo-width', String(dashboardLogoWidth));
          } else {
              localStorage.removeItem('interact-aoe-logo');
              localStorage.removeItem('interact-aoe-logo-width');
          }
          window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { key: 'interact-aoe-logo' }}));
          toast({ title: "Dashboard Logo Saved" });
      } else {
          if (landingLogoPreview) {
              localStorage.setItem('landing-page-logo', landingLogoPreview);
              localStorage.setItem('landing-page-logo-width', String(landingLogoWidth));
              localStorage.setItem('landing-page-logo-align', landingLogoAlign);
              localStorage.setItem('landing-page-logo-padding', String(landingLogoPadding));
          } else {
              localStorage.removeItem('landing-page-logo');
              localStorage.removeItem('landing-page-logo-width');
              localStorage.removeItem('landing-page-logo-align');
              localStorage.removeItem('landing-page-logo-padding');
          }
          window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { key: 'landing-page-logo' }}));
          toast({ title: "Landing Page Logo Saved" });
      }
  };

  const logoContainerClass = cn('w-full px-4', {
    'text-left': landingLogoAlign === 'flex-start',
    'text-center': landingLogoAlign === 'center',
    'text-right': landingLogoAlign === 'flex-end',
  });
  
  const headerStyle: React.CSSProperties = {
    paddingTop: `${landingLogoPadding}px`,
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
       <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Admin Setup</h1>
        <p className="text-muted-foreground mt-2">Create your first administrator account to get started.</p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Add, edit, or remove platform administrators.
            </CardDescription>
          </div>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add New User
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleCreateUser}>
                        <DialogHeader>
                            <DialogTitle>Create New Platform User</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to create a new administrator account.
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
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Full Name
                                </Label>
                                <Input id="name" name="name" required className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input id="email" name="email" type="email" required className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">
                                    Password
                                </Label>
                                <div className="col-span-3 relative">
                                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="pr-10" />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Create User</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No users created yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <Button asChild variant="default">
                <Link href="/login">Go to Login Page</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
