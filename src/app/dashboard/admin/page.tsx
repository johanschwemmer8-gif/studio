
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
import { storesByRegion } from '@/lib/data';
import { Upload } from 'lucide-react';

export default function AdminPage() {
  const allStores = storesByRegion.flatMap(region => 
    region.stores.map(store => ({
      name: store.name,
      province: region.province,
      code: store.code,
    }))
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
            Add new stores and manage existing locations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" placeholder="e.g., Sandton City" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Input id="province" placeholder="e.g., Gauteng" />
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
                  <TableHead>Store Name</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Store Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allStores.map((store, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>{store.province}</TableCell>
                    <TableCell>{store.code}</TableCell>
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
