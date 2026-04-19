
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandSettingsForm from '@/components/dashboard/brand-settings-form';
import BrandManagementForm from '@/components/dashboard/brand-management-form';
import UserManagement from '@/components/dashboard/user-management';

function slugify(text: string) {
    if (!text) return '';
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

function RetailerBilling() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>Manage the retailer's subscription and view billing history.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <h3 className="text-lg font-semibold text-primary">Pro Plan</h3>
                        <p className="text-muted-foreground">
                            Renews on: {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}
                        </p>
                    </div>
                     <p className="text-3xl font-bold">R1,250<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    <Button>Change Plan</Button>
                </div>
            </CardContent>
        </Card>
    )
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

  return (
    <div className="space-y-8">
        <div>
            <Button onClick={() => router.push('/dashboard/admin')} variant="ghost" className='mb-4 -ml-4'>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Panel
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">{retailer.name}</h2>
            <p className="text-muted-foreground">
                Manage all configurations for this retailer, from branding and store structure to users and billing.
            </p>
        </div>
        
        <Tabs defaultValue="configuration">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="configuration">Brand & Stores</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="configuration" className="mt-6">
                <div className="space-y-6">
                    <BrandSettingsForm />
                    <BrandManagementForm />
                </div>
            </TabsContent>
            <TabsContent value="users" className="mt-6">
                <UserManagement />
            </TabsContent>
            <TabsContent value="billing" className="mt-6">
                <RetailerBilling />
            </TabsContent>
        </Tabs>
    </div>
  );
}
