

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { PlusCircle, Building2, UserPlus, Save, Trash2, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Store = { name: string; code: string };

type Permissions = {
  dashboard: boolean;
  roi: boolean;
  visualsReporting: boolean;
  realTime: boolean;
  admin: boolean;
  systemIntegration: boolean;
};

type User = { 
  name: string; 
  email: string;
  permissions: Permissions;
};

type Brand = { name: string; stores: Store[]; users: User[] };

const initialPermissions: Permissions = {
  dashboard: false,
  roi: false,
  visualsReporting: false,
  realTime: false,
  admin: false,
  systemIntegration: false,
};

export default function AdminPage() {
  const [newRetailerName, setNewRetailerName] = useState('');
  const [addedRetailer, setAddedRetailer] = useState<string | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrandName, setNewBrandName] = useState('');
  
  const router = useRouter();

  const handleAddRetailer = () => {
    if (newRetailerName.trim()) {
      setAddedRetailer(newRetailerName);
    }
  };

  const handleAddBrand = () => {
    if (newBrandName.trim()) {
      setBrands([...brands, { name: newBrandName, stores: [], users: [] }]);
      setNewBrandName('');
    }
  };

  const handleAddStore = (brandIndex: number) => {
    const newBrands = [...brands];
    newBrands[brandIndex].stores.push({ name: '', code: '' });
    setBrands(newBrands);
  };
  
  const handleAddUser = (brandIndex: number) => {
    const newBrands = [...brands];
    newBrands[brandIndex].users.push({ name: '', email: '', permissions: {...initialPermissions} });
    setBrands(newBrands);
  };

  const handleRemoveItem = (brandIndex: number, type: 'store' | 'user', itemIndex: number) => {
      const newBrands = [...brands];
      if(type === 'store'){
          newBrands[brandIndex].stores.splice(itemIndex, 1);
      } else {
          newBrands[brandIndex].users.splice(itemIndex, 1);
      }
      setBrands(newBrands);
  };

  const handlePermissionChange = (brandIndex: number, userIndex: number, permission: keyof Permissions, checked: boolean) => {
    const newBrands = [...brands];
    newBrands[brandIndex].users[userIndex].permissions[permission] = checked;
    setBrands(newBrands);
  }

  const handleSaveConfiguration = () => {
    if (addedRetailer) {
        // In a real app, you would save all the configuration data here.
        console.log('Saving configuration for:', addedRetailer, brands);
        // For demonstration, we just log it. You might navigate or show a success message.
        alert('Retailer configuration saved!');
    }
  };

  const permissionLabels: {key: keyof Permissions, label: string}[] = [
      { key: 'dashboard', label: 'Retailer Dashboard' },
      { key: 'roi', label: 'Retailer ROI' },
      { key: 'visualsReporting', label: 'Visuals & Reporting' },
      { key: 'realTime', label: 'Real-Time Data' },
      { key: 'admin', label: 'Admin Panel' },
      { key: 'systemIntegration', label: 'System Integration' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">iNteract Admin Panel</h2>
        <p className="text-muted-foreground max-w-3xl">
          Manage retailers and their associated brands, stores, and platform settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retailer Management</CardTitle>
          <CardDescription>
            Add new retailers to the iNteract-AOE platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="retailer-name">Retailer Name</Label>
                <Input
                id="retailer-name"
                placeholder="e.g., Example Retail Group"
                value={newRetailerName}
                onChange={(e) => setNewRetailerName(e.target.value)}
                disabled={!!addedRetailer}
                />
            </div>
          <Button onClick={handleAddRetailer} disabled={!!addedRetailer || !newRetailerName.trim()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Retailer
          </Button>
        </CardContent>
      </Card>
      
      {addedRetailer && (
        <Card>
          <CardHeader>
            <CardTitle>Retailer Configuration & Access: {addedRetailer}</CardTitle>
            <CardDescription>
             Configure brands, stores, and user access for the new retailer. This will provide them with their own replicated iNteract Retailer MVP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Brand Management</h3>
                 <div className="flex gap-2">
                    <Input
                        placeholder="Enter new brand name"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                    />
                    <Button onClick={handleAddBrand}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Brand
                    </Button>
                </div>
                {brands.map((brand, brandIndex) => (
                    <div key={brandIndex} className="space-y-4 p-4 border rounded-md bg-muted/50">
                        <h4 className="font-medium text-lg">{brand.name}</h4>
                        <div className="space-y-2">
                            <Label>Stores</Label>
                            {brand.stores.map((store, storeIndex) => (
                                <div key={storeIndex} className="flex gap-2 items-center">
                                    <Input placeholder="Store Name" defaultValue={store.name} className="flex-1" />
                                    <Input placeholder="Store Code" defaultValue={store.code} className="w-32" />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(brandIndex, 'store', storeIndex)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                             <Button variant="outline" size="sm" onClick={() => handleAddStore(brandIndex)}>
                                <Building2 className="mr-2 h-4 w-4" /> Add Store
                            </Button>
                        </div>
                        <Separator />
                         <div className="space-y-2">
                            <Label>User Access</Label>
                             {brand.users.map((user, userIndex) => (
                                <div key={userIndex} className="flex gap-2 items-center">
                                    <Input placeholder="User Full Name" defaultValue={user.name} className="flex-1" />
                                    <Input placeholder="User Email" type="email" defaultValue={user.email} className="flex-1" />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                Manage Access
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuLabel>Dashboard Permissions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {permissionLabels.map((p) => (
                                                <DropdownMenuCheckboxItem
                                                    key={p.key}
                                                    checked={user.permissions[p.key]}
                                                    onCheckedChange={(checked) => handlePermissionChange(brandIndex, userIndex, p.key, !!checked)}
                                                >
                                                    {p.label}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(brandIndex, 'user', userIndex)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handleAddUser(brandIndex)}>
                                <UserPlus className="mr-2 h-4 w-4" /> Add User
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
             <Button size="lg" className="w-full" onClick={handleSaveConfiguration}>
                <Save className="mr-2 h-4 w-4" />
                Save Retailer Configuration
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
