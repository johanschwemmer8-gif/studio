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
import { Building2, User, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/ui/back-button';

function slugify(text: string) {
    if (!text) return '';
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
        <BackButton fallback="/dashboard/admin" label="Back to Admin Panel" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div>
            <BackButton fallback="/dashboard/admin" label="Back to Admin Panel" />
            <h2 className="text-3xl font-bold tracking-tight">{retailer.name}</h2>
            <p className="text-muted-foreground">
                Manage settings and view data for this specific retailer.
            </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building2 className="text-primary"/> Store Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">View and manage all store locations for {retailer.name}.</p>
                    <Button className="mt-4 w-full">Manage Stores</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="text-primary"/> User Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">Control which users have access to this retailer's dashboard.</p>
                    <Button className="mt-4 w-full">Manage Users</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/> Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">Configure security settings and API keys for this retailer.</p>
                    <Button className="mt-4 w-full">Security Settings</Button>
                </CardContent>
            </Card>
        </div>
        
        <Separator />
        
        <div>
            <h3 className="text-xl font-bold tracking-tight">Key Metrics</h3>
             <p className="text-muted-foreground">High-level performance indicators for {retailer.name}.</p>
        </div>
        
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">0</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">0</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Uplift</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">R0.00</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">0</p>
                </CardContent>
            </Card>
         </div>
    </div>
  );
}
