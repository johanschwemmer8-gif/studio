
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { PlusCircle, Building2, UserPlus, Save, Trash2, ShieldCheck, List } from 'lucide-react';
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

export type SavedRetailer = {
  name: string;
  brands: Brand[];
};

const initialPermissions: Permissions = {
  dashboard: false,
  roi: false,
  visualsReporting: false,
  realTime: false,
  admin: false,
  systemIntegration: false,
};

function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function AdminPage() {
  const [newRetailerName, setNewRetailerName] = useState('');
  const [addedRetailer, setAddedRetailer] = useState<string | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrandName, setNewBrandName] = useState('');

  const [savedRetailers, setSavedRetailers] = useState<SavedRetailer[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    // Load saved retailers from localStorage on component mount
    const storedRetailers = localStorage.getItem('savedRetailers');
    if (storedRetailers) {
        setSavedRetailers(JSON.parse(storedRetailers));
    }
  }, []);

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
        const newSavedRetailer = { name: addedRetailer, brands };
        const updatedSavedRetailers = [...savedRetailers, newSavedRetailer];
        setSavedRetailers(updatedSavedRetailers);
        localStorage.setItem('savedRetailers', JSON.stringify(updatedSavedRetailers));
        
        // Reset the configuration section and form
        setAddedRetailer(null);
        setNewRetailerName('');
        setBrands([]);
        
        // In a real app, you would probably show a toast notification
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
      
      {savedRetailers.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Retailers Added</CardTitle>
                <CardDescription>A list of all successfully configured retailers.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {savedRetailers.map((retailer, index) => (
                        <li key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <List className="h-4 w-4 text-muted-foreground" />
                            <Link href={`/dashboard/admin/view/${slugify(retailer.name)}`} className="font-medium hover:underline">
                                {retailer.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      )}

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
