
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { retailPortfolio as initialRetailPortfolio } from '@/lib/data';
import { Save, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QrCodeGenerator from '@/components/dashboard/qr-code-generator';
import { useToast } from '@/hooks/use-toast';

// Helper to convert hex to HSL string
const hexToHsl = (hex: string): string => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export default function AdminPage() {
  const [retailPortfolio, setRetailPortfolio] = useState(initialRetailPortfolio);
  const [newBrand, setNewBrand] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const { toast } = useToast();

  const [primaryColor, setPrimaryColor] = useState('#1E90FF');
  const [backgroundColor, setBackgroundColor] = useState('#F8F8F8');
  const [accentColor, setAccentColor] = useState('#FFD700');

  allStores = retailPortfolio.flatMap(brand =>
    brand.regions.flatMap(region =>
      region.areas.flatMap(area =>
        area.stores.map(store => ({
          brand: brand.brand,
          region: region.name,
          area: area.name,
          storeName: store.name,
          storeCode: store.code,
        }))
      )
    )
  );
  
  const brands = retailPortfolio.map(b => b.brand);

  const handleAddBrand = () => {
    const trimmedBrand = newBrand.trim();
    if (trimmedBrand && !brands.includes(trimmedBrand)) {
      const updatedPortfolio = [
        ...retailPortfolio,
        {
          brand: trimmedBrand,
          regions: [],
        },
      ];
      setRetailPortfolio(updatedPortfolio);
      setNewBrand('');
      setSelectedBrand(trimmedBrand);
      toast({
        title: 'Brand Added!',
        description: `The brand "${trimmedBrand}" has been added.`,
      });
    }
  };
  
  const handleSaveChanges = () => {
    try {
      document.documentElement.style.setProperty('--primary', hexToHsl(primaryColor));
      document.documentElement.style.setProperty('--background', hexToHsl(backgroundColor));
      document.documentElement.style.setProperty('--accent', hexToHsl(accentColor));
      
      // The logic to change the brand name itself is missing from the UI.
      // Assuming for now saving just applies themes. Re-rendering is automatic.
      setRetailPortfolio([...retailPortfolio]);

      toast({
        title: 'Theme Saved!',
        description: 'Your brand customizations have been applied.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Theme',
        description: 'There was a problem applying your color settings.',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Admin Panel</h2>
        <p className="text-muted-foreground max-w-3xl">
          Customize your brand, manage stores, and configure platform settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Individual Brand Customization</CardTitle>
          <CardDescription>
            Tailor the look and feel of the platform to match your brand identity.
            Select a brand to customize its theme, or add a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="new-brand-name">Add New Brand</Label>
              <div className="flex gap-2">
                <Input
                  id="new-brand-name"
                  placeholder="e.g., Your New Brand"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                />
                <Button onClick={handleAddBrand}>Add Brand</Button>
              </div>
            </div>
             <div className="space-y-2 flex-1">
              <Label htmlFor="brand-select">Select Existing Brand</Label>
              <Select value={selectedBrand || ''} onValueChange={setSelectedBrand}>
                <SelectTrigger id="brand-select">
                  <SelectValue placeholder="Select a brand..." />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <Input id="primary-color" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full p-1"/>
              <p className="text-xs text-muted-foreground">
                Main brand color for buttons and highlights.
              </p>
            </div>
             <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <Input id="background-color" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full p-1"/>
              <p className="text-xs text-muted-foreground">
                The main background color for the app.
              </p>
            </div>
             <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <Input id="accent-color" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full p-1"/>
              <p className="text-xs text-muted-foreground">
                Color for accents, special offers, and AI features.
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Label>Brand Logo</Label>
              <div className="flex items-center gap-4">
                 <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
                 <p className="text-sm text-muted-foreground">
                  Upload a logo to be displayed on the platform. (PNG, JPG, SVG)
                </p>
              </div>
            </div>
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
          <CardDescription>
            Create QR codes for your products. Customers can scan these in-store to
            view product information on your website. Just paste the product URL below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QrCodeGenerator />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Store Management</CardTitle>
          <CardDescription>
            Manage your retail structure, from brands and regions down to individual stores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input id="brand-name" placeholder="Select a brand above" value={selectedBrand || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region-name">Region Name</Label>
              <Input id="region-name" placeholder="e.g., Gauteng" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-name">Area Name</Label>
              <Input id="area-name" placeholder="e.g., Johannesburg North" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" placeholder="e.g., Sandton City" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-code">Store Code</Label>
              <Input id="store-code" type="number" placeholder="e.g., 1001" />
            </div>
          </div>

          <Button>Add Store</Button>
          <Separator />
           <h3 className="text-lg font-medium pt-4">Existing Stores</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Store Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allStores.map((store, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{store.brand}</TableCell>
                    <TableCell>{store.region}</TableCell>
                    <TableCell>{store.area}</TableCell>
                    <TableCell>{store.storeName}</TableCell>
                    <TableCell>{store.storeCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    