
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
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, User, ShieldCheck, RefreshCw, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/ui/back-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { resetTestRetailer } from '@/ai/flows/reset-test-retailer';
import { Badge } from '@/components/ui/badge';

const TEST_RETAILER_ID = 'interact-test-tenant';

function slugify(text: string) {
    if (!text) return '';
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function RetailerViewPage() {
  const [retailer, setRetailer] = useState<SavedRetailer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const params = useParams();
  const { toast } = useToast();

  useEffect(() => {
    const retailerNameSlug = params.retailerName;
    if (typeof window !== 'undefined' && retailerNameSlug) {
      if (retailerNameSlug === TEST_RETAILER_ID) {
          setRetailer({ name: 'iNteract Test Retailer' });
      } else {
          const storedRetailers = localStorage.getItem('savedRetailers');
          if (storedRetailers) {
            const retailers: SavedRetailer[] = JSON.parse(storedRetailers);
            const foundRetailer = retailers.find(r => slugify(r.name) === retailerNameSlug);
            setRetailer(foundRetailer || null);
          }
      }
    }
    setLoading(false);
  }, [params.retailerName]);

  const handleReset = async () => {
      setIsResetting(true);
      try {
          const idToken = await auth.currentUser?.getIdToken();
          if (!idToken) throw new Error("Auth session expired.");

          const result = await resetTestRetailer(idToken);
          if (result.success) {
              toast({
                  title: "Environment Reset",
                  description: "Test retailer data has been cleared. Identity remains intact.",
              });
          } else {
              throw new Error(result.message);
          }
      } catch (e: any) {
          toast({
              title: "Reset Failed",
              description: e.message,
              variant: "destructive"
          });
      } finally {
          setIsResetting(false);
      }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
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

  const isTestRetailer = params.retailerName === TEST_RETAILER_ID;

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <BackButton fallback="/dashboard/admin" label="Back to Admin Panel" />
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight">{retailer.name}</h2>
                    {isTestRetailer && <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase text-[10px]">Test Tenant</Badge>}
                </div>
                <p className="text-muted-foreground">
                    Manage settings and view data for this specific retailer.
                </p>
            </div>

            {isTestRetailer && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                            <RefreshCw className={cn("h-3.5 w-3.5", isResetting && "animate-spin")} />
                            Reset Test Environment
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Permanent Data Reset
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently remove all test products, QR activations, shopper sessions, and events belonging to the **iNteract Test Retailer**.
                                <br /><br />
                                The account and identity claims will remain intact. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] tracking-widest">
                                Confirm Full Reset
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building2 className="text-primary"/> Store Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">View and manage all store locations for {retailer.name}.</p>
                    <Button className="mt-4 w-full" variant="secondary">Manage Stores</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="text-primary"/> User Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">Control which users have access to this retailer's dashboard.</p>
                    <Button className="mt-4 w-full" variant="secondary">Manage Users</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/> Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">Configure security settings and API keys for this retailer.</p>
                    <Button className="mt-4 w-full" variant="secondary">Security Settings</Button>
                </CardContent>
            </Card>
        </div>
        
        <Separator />
        
        <div>
            <h3 className="text-xl font-bold tracking-tight uppercase tracking-tighter">Tenant Audit Summary</h3>
             <p className="text-muted-foreground text-sm">Associated activity for this tenant across the platform.</p>
        </div>
        
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Scans</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-black">0</p>
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-black">0</p>
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue Uplift</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-black">R0.00</p>
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active QR Codes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-black">0</p>
                </CardContent>
            </Card>
         </div>
    </div>
  );
}
