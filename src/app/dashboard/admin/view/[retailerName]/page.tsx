
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { type SavedRetailer } from '@/app/dashboard/admin/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, User, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function RetailerViewPage() {
  const [retailer, setRetailer] = useState<SavedRetailer | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const retailerNameSlug = params.retailerName;
    if (typeof window !== 'undefined' && retailerNameSlug) {
      const storedRetailers = localStorage.getItem('savedRetailers');
      if (storedRetailers) {
        const retailers: SavedRetailer[] = JSON.parse(storedRetailers);
        const foundRetailer = retailers.find(r => slugify(r.name) === retailerNameSlug);
        setRetailer(foundRetailer || null);
      }
    }
    setLoading(false);
  }, [params.retailerName]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!retailer) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Retailer Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested retailer could not be found.</p>
        <Button onClick={() => router.push('/dashboard/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Panel
        </Button>
      </div>
    );
  }

  const getPermissionLabel = (permissionKey: string) => {
    const labels: {[key: string]: string} = {
        dashboard: 'Retailer Dashboard',
        roi: 'Retailer ROI',
        visualsReporting: 'Visuals & Reporting',
        realTime: 'Real-Time Data',
        admin: 'Admin Panel',
        systemIntegration: 'System Integration',
    };
    return labels[permissionKey] || permissionKey;
  }

  return (
    <div className="space-y-8">
        <div>
            <Button onClick={() => router.push('/dashboard/admin')} variant="ghost" className='mb-4'>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Panel
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">{retailer.name}</h2>
            <p className="text-muted-foreground">
                Detailed configuration for {retailer.name}.
            </p>
        </div>
        
        <Separator />

        {retailer.brands.map((brand, brandIndex) => (
            <Card key={brandIndex}>
                <CardHeader>
                    <CardTitle>{brand.name}</CardTitle>
                    <CardDescription>Brand details, including stores and user access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="text-primary"/> Stores</h3>
                        {brand.stores.length > 0 ? (
                             <ul className="space-y-2 list-inside">
                                {brand.stores.map((store, storeIndex) => (
                                    <li key={storeIndex} className="p-3 rounded-md bg-muted/50">
                                        <p className="font-medium">{store.name}</p>
                                        <p className="text-sm text-muted-foreground">Store Code: {store.code}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No stores configured for this brand.</p>
                        )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><User className="text-primary"/> User Access</h3>
                         {brand.users.length > 0 ? (
                            <div className="space-y-4">
                                {brand.users.map((user, userIndex) => (
                                    <div key={userIndex} className="p-4 border rounded-md">
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-green-500" />
                                            <h4 className="font-semibold text-sm">Granted Permissions:</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {Object.entries(user.permissions).map(([key, value]) => 
                                               value && <Badge key={key} variant="secondary">{getPermissionLabel(key)}</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">No users configured for this brand.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );
}
