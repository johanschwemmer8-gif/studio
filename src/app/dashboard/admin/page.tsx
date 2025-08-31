
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
import { retailPortfolio } from '@/lib/data';
import { Upload } from 'lucide-react';

export default function AdminPage() {
  const allStores = retailPortfolio.flatMap(brand =>
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
          <CardTitle>Brand Customization</CardTitle>
          <CardDescription>
            Tailor the look and feel of the platform to match your brand identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex items-center gap-4">
              <Input id="primary-color" type="color" defaultValue="#1E90FF" className="w-16 p-1"/>
              <p className="text-sm text-muted-foreground">
                Choose a primary color for buttons and highlights.
              </p>
            </div>
          </div>
          <Separator />
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
              <Input id="brand-name" placeholder="e.g., Your Retail Brand" />
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
