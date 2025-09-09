
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Trash2, Edit, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import UserPermissions from './user-permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const permissionsSchema = z.object({
  dashboard: z.boolean().default(false),
  roi: z.boolean().default(false),
  visualsReporting: z.boolean().default(false),
  realTime: z.boolean().default(false),
  abTesting: z.boolean().default(false),
  systemIntegration: z.boolean().default(false),
  retailMediaNetwork: z.boolean().default(false),
});

const userSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  brand: z.string().min(1, 'Brand is required'),
  permissions: permissionsSchema,
});

type User = z.infer<typeof userSchema>;
type Brand = { name: string };

const permissionLabels: { id: keyof z.infer<typeof permissionsSchema>; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'roi', label: 'Retailer ROI' },
    { id: 'visualsReporting', label: 'Visuals & Reporting' },
    { id: 'realTime', label: 'Real-Time Data' },
    { id: 'abTesting', label: 'A/B Testing' },
    { id: 'systemIntegration', label: 'System & Integration' },
    { id: 'retailMediaNetwork', label: 'Retail Media Network' },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedBrandData = localStorage.getItem('brandManagement');
    if (savedBrandData) {
      try {
        const parsedData = JSON.parse(savedBrandData);
        if (parsedData.brands) {
          setBrands(parsedData.brands);
        }
      } catch (error) {
        console.error("Failed to parse brand data from localStorage", error);
      }
    }
  }, []);

  const form = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '',
      email: '',
      department: '',
      position: '',
      brand: '',
      permissions: {
        dashboard: true, // Default permission
        roi: false,
        visualsReporting: false,
        realTime: false,
        abTesting: false,
        systemIntegration: false,
        retailMediaNetwork: false,
      }
    },
  });

  const onSubmit = (data: User) => {
    setUsers([...users, data]);
    form.reset();
    setIsDialogOpen(false);
    toast({
      title: 'User Added',
      description: `${data.fullName} has been successfully added.`,
    });
  };

  const handleRemoveUser = (index: number) => {
    const userToRemove = users[index];
    setUsers(users.filter((_, i) => i !== index));
    toast({
      title: 'User Removed',
      description: `${userToRemove.fullName} has been removed.`,
      variant: 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Add, edit, or remove users for your organization's dashboard.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Fill in the details below and assign permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 py-4">
                 {/* User Details */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Name & Surname</Label>
                        <Input id="fullName" {...form.register('fullName')} />
                        {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...form.register('email')} />
                        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" {...form.register('department')} />
                         {form.formState.errors.department && <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input id="position" {...form.register('position')} />
                         {form.formState.errors.position && <p className="text-sm text-destructive">{form.formState.errors.position.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Controller
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map(brand => (
                                            <SelectItem key={brand.name} value={brand.name}>{brand.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         {form.formState.errors.brand && <p className="text-sm text-destructive">{form.formState.errors.brand.message}</p>}
                    </div>
                </div>
                 {/* Permissions */}
                 <div className="space-y-4">
                    <Label className="flex items-center gap-2"><ShieldCheck className="text-primary"/> Permissions</Label>
                     <div className="space-y-2 p-4 border rounded-md max-h-80 overflow-y-auto">
                        {permissionLabels.map((p) => (
                           <div key={p.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`perm-${p.id}`}
                                    checked={form.watch(`permissions.${p.id}`)}
                                    onCheckedChange={(checked) => form.setValue(`permissions.${p.id}`, !!checked)}
                                />
                                <Label htmlFor={`perm-${p.id}`} className="font-normal">{p.label}</Label>
                           </div>
                        ))}
                    </div>
                 </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No users have been added yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell>
                      <p className="font-medium">{user.brand}</p>
                  </TableCell>
                  <TableCell>
                      <UserPermissions permissions={user.permissions} labels={permissionLabels} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
