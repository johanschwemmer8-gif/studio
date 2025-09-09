
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { PlusCircle, Trash2, Edit, ShieldCheck, Save, Upload } from 'lucide-react';
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
import { type FormValues as BrandFormValues } from './brand-management-form';
import Papa from 'papaparse';

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
  id: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  brand: z.string().min(1, 'Brand is required'),
  division: z.string().optional(),
  region: z.string().optional(),
  area: z.string().optional(),
  store: z.string().optional(),
  permissions: permissionsSchema,
});

type User = z.infer<typeof userSchema>;

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
  const [brandData, setBrandData] = useState<BrandFormValues | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedBrandData = localStorage.getItem('brandManagement');
      if (savedBrandData) {
        setBrandData(JSON.parse(savedBrandData));
      }
    } catch (error) {
      console.error("Failed to parse brand data from localStorage", error);
    }
    
    try {
      const savedUsers = localStorage.getItem('userManagement');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
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
      division: '',
      region: '',
      area: '',
      store: '',
      permissions: {
        dashboard: true,
        roi: false,
        visualsReporting: false,
        realTime: false,
        abTesting: false,
        systemIntegration: false,
        retailMediaNetwork: false,
      }
    },
  });

  const selectedBrandName = useWatch({ control: form.control, name: 'brand' });
  const selectedDivisionName = useWatch({ control: form.control, name: 'division' });
  const selectedRegionName = useWatch({ control: form.control, name: 'region' });
  const selectedAreaName = useWatch({ control: form.control, name: 'area' });

  const selectedBrand = brandData?.brands.find(b => b.name === selectedBrandName);
  const divisions = selectedBrand?.divisions || [];
  
  const selectedDivision = divisions.find(d => d.name === selectedDivisionName);
  const regions = selectedDivision?.regions || [];

  const selectedRegion = regions.find(r => r.name === selectedRegionName);
  const areas = selectedRegion?.areas || [];

  const selectedArea = areas.find(a => a.name === selectedAreaName);
  const stores = selectedArea?.stores || [];

  const onSubmit = (data: User) => {
    setUsers([...users, {...data, id: Date.now().toString() }]);
    form.reset();
    setIsAddUserDialogOpen(false);
    toast({
      title: 'User Added',
      description: `${data.fullName} has been successfully added. Click 'Save Users' to persist changes.`,
    });
  };

  const handleSaveUsers = () => {
      localStorage.setItem('userManagement', JSON.stringify(users));
      toast({
          title: 'Users Saved!',
          description: 'The user list has been successfully saved.',
      });
  };

  const handleRemoveUser = (index: number) => {
    const userToRemove = users[index];
    setUsers(users.filter((_, i) => i !== index));
    toast({
      title: 'User Removed',
      description: `${userToRemove.fullName} has been removed. Click 'Save Users' to persist this change.`,
      variant: 'destructive',
    });
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import.',
        variant: 'destructive',
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedUsers: User[] = [];
        let errorCount = 0;
        
        results.data.forEach((row: any, index) => {
          const userToValidate = {
            fullName: row.fullName || '',
            email: row.email || '',
            department: row.department || '',
            position: row.position || '',
            brand: row.brand || '',
            permissions: {
                dashboard: (row.dashboard || 'false').toLowerCase() === 'true',
                roi: (row.roi || 'false').toLowerCase() === 'true',
                visualsReporting: (row.visualsReporting || 'false').toLowerCase() === 'true',
                realTime: (row.realTime || 'false').toLowerCase() === 'true',
                abTesting: (row.abTesting || 'false').toLowerCase() === 'true',
                systemIntegration: (row.systemIntegration || 'false').toLowerCase() === 'true',
                retailMediaNetwork: (row.retailMediaNetwork || 'false').toLowerCase() === 'true',
            }
          };

          const validation = userSchema.safeParse(userToValidate);
          if (validation.success) {
            parsedUsers.push({ ...validation.data, id: `import-${Date.now()}-${index}` });
          } else {
            errorCount++;
            console.warn(`Validation failed for row ${index + 2}:`, validation.error.flatten().fieldErrors);
          }
        });

        if (errorCount > 0) {
            toast({
                title: 'Import Warning',
                description: `${errorCount} row(s) had validation errors and were skipped. Check the console for details.`,
                variant: 'destructive'
            });
        }

        setUsers(prev => [...prev, ...parsedUsers]);
        setIsImportDialogOpen(false);
        toast({
          title: 'Import Successful',
          description: `${parsedUsers.length} users were successfully imported. Click 'Save Users' to persist.`,
        });
      },
      error: (error) => {
        toast({
          title: 'Import Failed',
          description: `An error occurred while parsing the CSV file: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };

  const getUserAccessScope = (user: User) => {
      if (user.store) return `Store: ${user.store}`;
      if (user.area) return `Area: ${user.area}`;
      if (user.region) return `Region: ${user.region}`;
      if (user.division) return `Division: ${user.division}`;
      if (user.brand) return `Brand: ${user.brand}`;
      return 'N/A';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Add, edit, or remove users for your organization's dashboard.
          </CardDescription>
        </div>
        <div className="flex gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Users</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Users from CSV</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file to bulk-add users. Make sure your file has the correct headers.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Required headers: `fullName`, `email`, `department`, `position`, `brand`.
                            <br />
                            Optional permission headers (use `true`/`false`): `dashboard`, `roi`, `visualsReporting`, `realTime`, `abTesting`, `systemIntegration`, `retailMediaNetwork`.
                        </p>
                        <Input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileImport} />
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
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
                      Fill in the details below, assign their access scope and permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                     {/* User Details & Scope */}
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
                         <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                            <h4 className="font-semibold text-sm">Access Scope</h4>
                            <div className="space-y-2">
                                <Label>Brand</Label>
                                <Controller
                                    control={form.control}
                                    name="brand"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger>
                                            <SelectContent>
                                                {brandData?.brands.map(brand => (
                                                    <SelectItem key={brand.name} value={brand.name}>{brand.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {form.formState.errors.brand && <p className="text-sm text-destructive">{form.formState.errors.brand.message}</p>}
                            </div>
                             {selectedBrand && divisions.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Division (Optional)</Label>
                                    <Controller
                                        control={form.control}
                                        name="division"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <SelectTrigger><SelectValue placeholder="All Divisions" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">All Divisions</SelectItem>
                                                    {divisions.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            )}
                            {selectedDivision && regions.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Region (Optional)</Label>
                                    <Controller
                                        control={form.control}
                                        name="region"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <SelectTrigger><SelectValue placeholder="All Regions" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">All Regions</SelectItem>
                                                    {regions.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            )}
                            {selectedRegion && areas.length > 0 && (
                                 <div className="space-y-2">
                                    <Label>Area (Optional)</Label>
                                    <Controller
                                        control={form.control}
                                        name="area"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <SelectTrigger><SelectValue placeholder="All Areas" /></SelectTrigger>
                                                <SelectContent>
                                                     <SelectItem value="">All Areas</SelectItem>
                                                    {areas.map(a => <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            )}
                            {selectedArea && stores.length > 0 && (
                                 <div className="space-y-2">
                                    <Label>Store (Optional)</Label>
                                    <Controller
                                        control={form.control}
                                        name="store"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <SelectTrigger><SelectValue placeholder="All Stores" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">All Stores</SelectItem>
                                                    {stores.map(s => <SelectItem key={s.code} value={s.name}>{s.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                     {/* Permissions */}
                     <div className="space-y-4">
                        <Label className="flex items-center gap-2"><ShieldCheck className="text-primary"/> Permissions</Label>
                         <div className="space-y-2 p-4 border rounded-md max-h-96 overflow-y-auto">
                            {permissionLabels.map((p) => (
                               <div key={p.id} className="flex items-center space-x-2">
                                    <Controller
                                        control={form.control}
                                        name={`permissions.${p.id}`}
                                        render={({ field }) => (
                                            <Checkbox
                                                id={`perm-${p.id}`}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <Label htmlFor={`perm-${p.id}`} className="font-normal">{p.label}</Label>
                               </div>
                            ))}
                        </div>
                     </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add User</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Access Scope</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                    No users have been added yet.
                    </TableCell>
                </TableRow>
                ) : (
                users.map((user, index) => (
                    <TableRow key={user.id || index}>
                    <TableCell>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                        <p className="font-medium">{getUserAccessScope(user)}</p>
                    </TableCell>
                    <TableCell>
                        <UserPermissions permissions={user.permissions} labels={permissionLabels} />
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" disabled>
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
        </div>
      </CardContent>
      <CardFooter>
          <Button onClick={handleSaveUsers}>
              <Save className="mr-2 h-4 w-4" />
              Save Users
          </Button>
      </CardFooter>
    </Card>
  );
}
