
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, List, Eye, Trash2, RefreshCw, UserPlus, AlertTriangle, EyeOff, Loader2 } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';


export type SavedRetailer = {
  name: string;
};

function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

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
            setFormError("Firebase is not configured. Cannot create user.");
            setIsLoading(false);
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // In a real app, you would also save user details to Firestore here,
            // linking them to the retailerId.
            toast({
                title: "Retailer User Created",
                description: `${name} can now log into the ${retailer.name} MVP dashboard.`,
            });
            form.reset();
            setIsDialogOpen(false);
        } catch (error: any) {
            setFormError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add 1st User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateUser}>
                    <DialogHeader>
                        <DialogTitle>Create First User for {retailer.name}</DialogTitle>
                        <DialogDescription>
                            This user will be able to log in to the Retailer MVP dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {formError && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
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
                                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="pr-10" autoComplete="new-password" />
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
                         <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
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
        description: `"${newRetailerName}" has been created. You can now view their landing page and dashboard.`
      });
    }
  };

  const handleDeleteRetailer = (retailerToDelete: SavedRetailer) => {
    const updatedRetailers = savedRetailers.filter(r => r.name !== retailerToDelete.name);
    setSavedRetailers(updatedRetailers);
    localStorage.setItem('savedRetailers', JSON.stringify(updatedRetailers));
    toast({
      title: 'Retailer Deleted',
      description: `"${retailerToDelete.name}" has been removed.`,
    });
  };

  const handleUpdateAoe = () => {
    toast({
        title: "AOE Updated",
        description: "The system has been synchronized with the latest retailer list.",
    });
  };


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">iNteract Admin Panel</h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage retailers on the iNteract-AOE platform. This section defines the template for the Retailer MVP.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Retailer Management</CardTitle>
            <CardDescription>
              Add new retailers to the iNteract-AOE platform.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleUpdateAoe}>
              <RefreshCw className="mr-2 h-4 w-4"/>
              Update AOE
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="retailer-name" className="sr-only">Retailer Name</Label>
                    <Input
                    id="retailer-name"
                    placeholder="e.g., Example Retail Group"
                    value={newRetailerName}
                    onChange={(e) => setNewRetailerName(e.target.value)}
                    />
                </div>
              <Button onClick={handleAddRetailer} disabled={!newRetailerName.trim()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Retailer
              </Button>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Onboarded Retailers</CardTitle>
            <CardDescription>A list of all successfully configured retailers.</CardDescription>
        </CardHeader>
        <CardContent>
          {savedRetailers.length > 0 ? (
            <ul className="space-y-2">
                {savedRetailers.map((retailer, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <List className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/dashboard/admin/view/${slugify(retailer.name)}`} className="font-medium hover:underline flex-1">
                            {retailer.name}
                        </Link>
                        <AddUserDialog retailer={retailer} />
                         <Button asChild variant="outline" size="sm">
                            <Link href="/login?view=retailer" target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                View Login Page
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete the retailer "{retailer.name}" and all associated configuration. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteRetailer(retailer)}>
                                        Yes, delete retailer
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </li>
                ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <p>No retailers have been configured yet.</p>
                <p className="text-sm">Add a new retailer above to see them listed here.</p>
            </div>
          )}
        </CardContent>
      </Card>


      {savedRetailers.length > 0 && (
          <div className="space-y-4">
              <Separator />
              <h3 className="text-xl font-bold tracking-tight">Dashboard Previews</h3>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {savedRetailers.map((retailer, index) => (
                      <RetailerDashboardPreview key={index} retailer={retailer} />
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}
