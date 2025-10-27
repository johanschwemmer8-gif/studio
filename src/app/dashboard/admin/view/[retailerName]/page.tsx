
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
            <Button onClick={() => router.push('/dashboard/admin')} variant="ghost" className='mb-4'>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Panel
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">{retailer.name}</h2>
            <p className="text-muted-foreground">
                This page is a placeholder for viewing detailed retailer configuration. The actual management is done by the retailer in their own admin panel.
            </p>
        </div>
        
        <Separator />
        
        <Card>
            <CardHeader>
                <CardTitle>Configuration Overview</CardTitle>
                <CardDescription>High-level summary of the retailer's setup.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Detailed brand, store, and user information is managed within the retailer's own dashboard.</p>
            </CardContent>
        </Card>
    </div>
  );
}
