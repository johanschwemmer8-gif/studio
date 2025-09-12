
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
import { ArrowLeft, UserPlus, Trash2, Edit, Eye, EyeOff, Upload, Save, Image as ImageIcon } from 'lucide-react';
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load the saved logo from localStorage when the component mounts
    const savedLogo = localStorage.getItem('interact-aoe-logo');
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
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
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setLogoPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveLogo = () => {
      if (logoPreview) {
          localStorage.setItem('interact-aoe-logo', logoPreview);
           // Dispatch a custom event to notify other components (like the layout) instantly
          window.dispatchEvent(new CustomEvent('logoUpdated'));
          toast({
              title: "Logo Saved",
              description: "Your new logo has been saved and applied."
          });
      } else {
          localStorage.removeItem('interact-aoe-logo');
          window.dispatchEvent(new CustomEvent('logoUpdated'));
           toast({
              title: "Logo Removed",
              description: "The logo has been removed."
          });
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
            <CardTitle>Brand Settings</CardTitle>
            <CardDescription>Manage your global brand settings, like the main logo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label htmlFor="logo-upload">Platform Logo</Label>
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-32 h-16 bg-muted rounded-md flex items-center justify-center">
                        {logoPreview ? (
                            <Image src={logoPreview} alt="Logo Preview" width={128} height={64} className="object-contain h-full" />
                        ) : (
                            <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                                <ImageIcon className="h-6 w-6" />
                                <span>Logo Preview</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 w-full">
                        <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} />
                        <p className="text-xs text-muted-foreground mt-2">Upload a .png, .jpg, or .svg file. Max size: 1MB.</p>
                    </div>
                </div>
            </div>
             <Button onClick={handleSaveLogo}>
                <Save className="mr-2 h-4 w-4" />
                Save Logo
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
