
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, UserPlus, Trash2, Edit, Eye, EyeOff, Save, Image as ImageIcon, AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd } from 'lucide-react';
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

type User = {
  name: string;
  email: string;
  role: string;
};

export default function UserAdminPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([
    { name: 'Admin User', email: 'admin@interact.io', role: 'Administrator' },
  ]);
  const [dashboardLogoPreview, setDashboardLogoPreview] = useState<string | null>(null);
  const [dashboardLogoWidth, setDashboardLogoWidth] = useState(128);
  
  const [landingLogoPreview, setLandingLogoPreview] = useState<string | null>(null);
  const [landingLogoWidth, setLandingLogoWidth] = useState(128);
  const [landingLogoAlign, setLandingLogoAlign] = useState('flex-start');

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
  }, []);

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;

    setUsers([...users, { name, email, role: 'Administrator' }]);
    toast({
        title: "User Created",
        description: `${name} has been added to the user list.`,
    });
    form.reset();
    setIsDialogOpen(false); 
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
          } else {
              localStorage.removeItem('landing-page-logo');
              localStorage.removeItem('landing-page-logo-width');
              localStorage.removeItem('landing-page-logo-align');
          }
          window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { key: 'landing-page-logo' }}));
          toast({ title: "Landing Page Logo Saved" });
      }
  };

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="-ml-4 mb-4">
            <Link href="/dashboard/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to iNteract Admin Panel
            </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          iNteract User Administration
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage platform administrators, retailer users, and their associated permissions.
        </p>
      </div>
      
      <Separator />

      <Card>
        <CardHeader>
            <CardTitle>Dashboard Brand Settings</CardTitle>
            <CardDescription>Manage your global brand settings for the main dashboard, like the logo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label htmlFor="dashboard-logo-upload">Platform Logo</Label>
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-48 h-20 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {dashboardLogoPreview ? (
                            <Image 
                                src={dashboardLogoPreview} 
                                alt="Logo Preview" 
                                width={dashboardLogoWidth} 
                                height={dashboardLogoWidth / (128/50)}
                                className="h-auto"
                                style={{ width: `${dashboardLogoWidth}px` }}
                            />
                        ) : (
                            <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                                <ImageIcon className="h-6 w-6" />
                                <span>Logo Preview</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <Input id="dashboard-logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleLogoUpload(e, 'dashboard')} />
                         <div>
                            <Label htmlFor="dashboard-logo-size">Logo Width: {dashboardLogoWidth}px</Label>
                            <Slider
                                id="dashboard-logo-size"
                                min={40}
                                max={240}
                                step={2}
                                value={[dashboardLogoWidth]}
                                onValueChange={(value) => setDashboardLogoWidth(value[0])}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Upload a .png, .jpg, or .svg file. Max size: 1MB.</p>
                    </div>
                </div>
            </div>
             <Button onClick={() => handleSaveLogo('dashboard')}>
                <Save className="mr-2 h-4 w-4" />
                Save Dashboard Logo
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Login Page Brand Settings</CardTitle>
            <CardDescription>Customize the logo and its position on the public-facing login/landing page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label htmlFor="landing-logo-upload">Landing Page Logo</Label>
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-48 h-20 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {landingLogoPreview ? (
                            <Image src={landingLogoPreview} alt="Landing Logo Preview" width={landingLogoWidth} height={landingLogoWidth / (128/50)} className="h-auto" style={{ width: `${landingLogoWidth}px` }}/>
                        ) : (
                            <div className="text-xs text-muted-foreground flex flex-col items-center gap-1"><ImageIcon className="h-6 w-6" /><span>Logo Preview</span></div>
                        )}
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <Input id="landing-logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleLogoUpload(e, 'landing')} />
                         <div>
                            <Label htmlFor="landing-logo-size">Logo Width: {landingLogoWidth}px</Label>
                            <Slider id="landing-logo-size" min={40} max={240} step={2} value={[landingLogoWidth]} onValueChange={(value) => setLandingLogoWidth(value[0])}/>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <Label>Logo Position</Label>
                 <RadioGroup value={landingLogoAlign} onValueChange={setLandingLogoAlign} className="grid sm:grid-cols-3 gap-4 mt-2">
                    <Label htmlFor="align-left" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", landingLogoAlign === 'flex-start' && "border-primary")}>
                        <RadioGroupItem value="flex-start" id="align-left" className="sr-only" />
                        <AlignHorizontalJustifyStart className="mb-3 h-6 w-6" />
                        Left
                    </Label>
                     <Label htmlFor="align-center" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", landingLogoAlign === 'center' && "border-primary")}>
                        <RadioGroupItem value="center" id="align-center" className="sr-only" />
                        <AlignHorizontalJustifyCenter className="mb-3 h-6 w-6" />
                        Center
                    </Label>
                     <Label htmlFor="align-right" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", landingLogoAlign === 'flex-end' && "border-primary")}>
                        <RadioGroupItem value="flex-end" id="align-right" className="sr-only" />
                        <AlignHorizontalJustifyEnd className="mb-3 h-6 w-6" />
                        Right
                    </Label>
                </RadioGroup>
            </div>
             <Button onClick={() => handleSaveLogo('landing')}>
                <Save className="mr-2 h-4 w-4" />
                Save Landing Page Logo
            </Button>
        </CardContent>
      </Card>


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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
