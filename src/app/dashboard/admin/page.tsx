
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
import { retailPortfolio as initialRetailPortfolio, type RetailPortfolio, type Store } from '@/lib/data';
import { Download, Save, Upload, Trash2, QrCode, PlusCircle, Pencil } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';

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

type GeneratedQrCode = {
  id: string;
  url: string;
  qrCodeUrl: string;
  sku: string;
  storeId: string;
  location: string;
  timestamp: Date;
};

type NewStore = {
  region: string;
  area: string;
  name: string;
  code: string;
  address: string;
  contact: string;
};

export default function AdminPage() {
  const [retailPortfolio, setRetailPortfolio] = useState<RetailPortfolio>(initialRetailPortfolio);
  const [newBrand, setNewBrand] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const { toast } = useToast();

  const [primaryColor, setPrimaryColor] = useState('#1E90FF');
  const [backgroundColor, setBackgroundColor] = useState('#F8F8F8');
  const [accentColor, setAccentColor] = useState('#FFD700');
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedQrCode[]>([]);

  const [newStore, setNewStore] = useState<NewStore>({
    region: '',
    area: '',
    name: '',
    code: '',
    address: '',
    contact: '',
  });

  const allStores = retailPortfolio.flatMap(brand =>
    brand.regions.flatMap(region =>
      region.areas.flatMap(area =>
        area.stores.map(store => ({
          brand: brand.brand,
          region: region.name,
          area: area.name,
          ...store
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

  const handleAddStore = () => {
    if (!selectedBrand || !newStore.name || !newStore.code) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please select a brand and fill in at least the store name and code.',
        });
        return;
    }

    const updatedPortfolio = retailPortfolio.map(brand => {
        if (brand.brand === selectedBrand) {
            const newStoreData: Store = {
                name: newStore.name,
                code: parseInt(newStore.code, 10),
                address: newStore.address,
                contact: newStore.contact,
            };

            const regionName = newStore.region || 'Uncategorized';
            const areaName = newStore.area || 'Uncategorized';

            let region = brand.regions.find(r => r.name === regionName);
            if (!region) {
                region = { name: regionName, areas: [] };
                brand.regions.push(region);
            }

            let area = region.areas.find(a => a.name === areaName);
            if (!area) {
                area = { name: areaName, stores: [] };
                region.areas.push(area);
            }

            area.stores.push(newStoreData);
        }
        return brand;
    });

    setRetailPortfolio(updatedPortfolio);
    setNewStore({ region: '', area: '', name: '', code: '', address: '', contact: '' });
    toast({
        title: 'Store Added!',
        description: `"${newStore.name}" has been added to the "${selectedBrand}" brand.`,
    });
  };

  const handleRemoveStore = (brandName: string, storeCode: number) => {
    const updatedPortfolio = retailPortfolio.map(brand => {
      if (brand.brand === brandName) {
        brand.regions.forEach(region => {
          region.areas.forEach(area => {
            area.stores = area.stores.filter(store => store.code !== storeCode);
          });
          // Clean up empty areas
          region.areas = region.areas.filter(area => area.stores.length > 0);
        });
        // Clean up empty regions
        brand.regions = brand.regions.filter(region => region.areas.length > 0);
      }
      return brand;
    });

    setRetailPortfolio(updatedPortfolio);
    toast({
        title: 'Store Removed',
        description: 'The selected store has been removed.',
    });
  };
  
  const handleSaveChanges = () => {
    try {
      document.documentElement.style.setProperty('--primary', hexToHsl(primaryColor));
      document.documentElement.style.setProperty('--background', hexToHsl(backgroundColor));
      document.documentElement.style.setProperty('--accent', hexToHsl(accentColor));
      
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

  const handleGenerateCodes = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const count = parseInt(formData.get('count') as string, 10) || 1;
    const sku = formData.get('sku') as string;
    const storeId = formData.get('storeId') as string;
    const location = formData.get('location') as string;

    const newCodes: GeneratedQrCode[] = Array.from({ length: count }, (_, i) => {
        const uniqueId = `prod-${sku}-${Date.now() + i}`;
        const url = `https://your-store.com/product/${uniqueId}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}`;
        return {
            id: uniqueId,
            url,
            qrCodeUrl,
            sku: sku,
            storeId: storeId,
            location: `${location} #${i + 1}`,
            timestamp: new Date(),
        };
    });

    setGeneratedCodes(prev => [...newCodes, ...prev]);
    toast({
      title: `${count} QR Code(s) Generated!`,
      description: 'They have been added to the directory below.',
    });
  };

  const handleNewStoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewStore(prev => ({ ...prev, [id]: value }));
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
          <fieldset disabled={!selectedBrand} className="disabled:opacity-50">
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
            <Separator className="my-6" />
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
          </fieldset>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Store Management</CardTitle>
          <CardDescription>
            Manage your retail structure. First, select a brand above, then add, remove, or view stores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <fieldset disabled={!selectedBrand} className="disabled:opacity-50">
             <h3 className="text-lg font-medium pt-4 border-b pb-2 mb-4">Add a New Store to "{selectedBrand || '...'}"</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input id="name" placeholder="e.g., Sandton City" value={newStore.name} onChange={handleNewStoreChange}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Store Code</Label>
                  <Input id="code" type="number" placeholder="e.g., 1001" value={newStore.code} onChange={handleNewStoreChange}/>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="e.g., 83 Rivonia Rd, Sandhurst" value={newStore.address} onChange={handleNewStoreChange}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Information</Label>
                  <Input id="contact" placeholder="e.g., 011 217 6000" value={newStore.contact} onChange={handleNewStoreChange}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region Name (Optional)</Label>
                  <Input id="region" placeholder="e.g., Gauteng" value={newStore.region} onChange={handleNewStoreChange}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area Name (Optional)</Label>
                  <Input id="area" placeholder="e.g., Johannesburg North" value={newStore.area} onChange={handleNewStoreChange}/>
                </div>
            </div>

            <Button className="mt-6" onClick={handleAddStore}>Add Store</Button>
          </fieldset>
          <Separator />
           <h3 className="text-lg font-medium pt-4">Store Directory</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Store Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allStores.map((store, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{store.brand}</TableCell>
                    <TableCell>{store.name}</TableCell>
                    <TableCell>{store.code}</TableCell>
                    <TableCell>{store.address}</TableCell>
                    <TableCell>{store.contact}</TableCell>
                     <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveStore(store.brand, store.code)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove Store</span>
                        </Button>
                      </TableCell>
                  </TableRow>
                ))}
                 {allStores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                      No stores found. Select a brand and add one above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Code &amp; Content Management</CardTitle>
          <CardDescription>
            This is the central hub for creating and managing the personalized content that customers see.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-4">Bulk QR Code Generation</h3>
                <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end" onSubmit={handleGenerateCodes}>
                    <div className="space-y-2">
                        <Label htmlFor="count">Number of Codes</Label>
                        <Input id="count" name="count" type="number" placeholder="e.g., 50" defaultValue="1" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sku">Product SKU</Label>
                        <Input id="sku" name="sku" placeholder="e.g., 501-ABC" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="storeId">Store ID</Label>
                        <Input id="storeId" name="storeId" placeholder="e.g., 1001" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Physical Location</Label>
                        <Input id="location" name="location" placeholder="Aisle 3 - Shoe Display" required />
                    </div>
                    <Button type="submit" className="lg:col-span-4">
                        <QrCode className="mr-2 h-4 w-4" />
                        Generate Codes
                    </Button>
                </form>
            </div>
            <Separator />
            <div>
                <h3 className="text-lg font-medium border-b pb-2 mb-4">QR Code Directory</h3>
                <div className="border rounded-md max-h-96 overflow-y-auto">
                    {generatedCodes.length > 0 ? (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>QR</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Store ID</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {generatedCodes.map((code, index) => (
                            <TableRow key={index}>
                            <TableCell>
                                <Image src={code.qrCodeUrl} alt={`QR Code for ${code.sku}`} width={28} height={28} className="rounded-sm" />
                            </TableCell>
                            <TableCell className="font-medium">{code.sku}</TableCell>
                            <TableCell>{code.storeId}</TableCell>
                            <TableCell>{code.location}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                  <a href={code.qrCodeUrl} download={`qr-code-${code.sku}-${index}.png`}>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                                 <Button variant="outline" size="icon" className="h-8 w-8">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        No QR codes have been generated yet.
                    </div>
                    )}
                </div>
            </div>
            <Separator />
            <div className="grid lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-medium border-b pb-2 mb-4">Landing Page Customization</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Template</Label>
                             <Select defaultValue="single-product">
                                <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single-product">Single Product Page</SelectItem>
                                    <SelectItem value="promo-offer">Promotional Offer Page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="productName">Product Name</Label>
                            <Input id="productName" placeholder="e.g., Eco-Friendly Water Bottle" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="productDescription">Product Description</Label>
                            <Textarea id="productDescription" placeholder="A brief description of the product." />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="productImage">Product Images</Label>
                            <Button variant="outline" className="w-full">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Images
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="pricing">Pricing</Label>
                                <Input id="pricing" type="number" placeholder="25.00" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="promoPricing">Promotional Price</Label>
                                <Input id="promoPricing" type="number" placeholder="19.99" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ctaButton">CTA Button</Label>
                             <Select defaultValue="add-to-cart">
                                <SelectTrigger>
                                <SelectValue placeholder="Select a CTA" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add-to-cart">Add to Cart</SelectItem>
                                    <SelectItem value="add-to-wishlist">Add to Wishlist</SelectItem>
                                    <SelectItem value="get-offer">Get Offer</SelectItem>
                                    <SelectItem value="chat-assistant">Chat with an Assistant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <Button className="w-full">
                            <Save className="mr-2 h-4 w-4" />
                            Save Content
                        </Button>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-medium border-b pb-2 mb-4">Offer &amp; Promotion Engine</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="offerType">Offer Type</Label>
                            <Select defaultValue="percentage-off">
                                <SelectTrigger>
                                <SelectValue placeholder="Select offer type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage-off">10% Off</SelectItem>
                                    <SelectItem value="bogo">Buy One Get One Free</SelectItem>
                                    <SelectItem value="fixed-amount">R50 Off</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="validityDates">Validity Dates</Label>
                            <Input id="validityDates" type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="redemptionLimit">Redemption Limit</Label>
                            <Input id="redemptionLimit" type="number" placeholder="e.g., 1000" />
                        </div>
                         <div className="space-y-2">
                            <Label>Applicable Brand/Store</Label>
                             <Select>
                                <SelectTrigger>
                                <SelectValue placeholder="Apply to..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Brands &amp; Stores</SelectItem>
                                    {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Offer
                        </Button>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
