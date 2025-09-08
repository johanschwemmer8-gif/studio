
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, UserPlus } from 'lucide-react';
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

export default function UserAdminPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real application, you would handle form submission here,
    // like sending data to your backend.
    console.log('New user created!');
    setIsDialogOpen(false); // Close the dialog on successful creation
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
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Add, edit, or remove platform administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                                <Input id="name" required className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input id="email" type="email" required className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">
                                    Password
                                </Label>
                                <Input id="password" type="password" required className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Create User</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
