'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
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
import { 
    Building2, User, ShieldCheck, RefreshCw, AlertTriangle, 
    Loader2, CheckCircle2, Sparkles, Database, Eraser 
} from 'lucide-react';
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
import { auth, db } from '@/lib/firebase';
import { resetTestRetailer } from '@/ai/flows/reset-test-retailer';
import { seedTestRetailerDemo } from '@/ai/flows/seed-test-retailer-demo';
import { Badge } from '@/components/ui/badge';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const TEST_RETAILER_ID = 'interact-test-tenant';

export default function RetailerViewPage() {
  const [retailer, setRetailer] = useState<SavedRetailer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, startSeeding] = useTransition();
  const params = useParams();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchRetailer() {
        const id = params.retailerName as string;
        if (!db || !id) return;
        
        try {
            const docRef = doc(db, 'tenants', id);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setRetailer({ id: snap.id, ...snap.data() } as SavedRetailer);
            }
        } catch (e) {
            console.error("Fetch failure");
        } finally {
            setLoading(false);
        }
    }
    fetchRetailer();
  }, [params.retailerName]);

  const handleReset = async (mode: 'full' | 'activity') => {
      setIsResetting(true);
      try {
          const idToken = await auth.currentUser?.getIdToken();
          if (!idToken) throw new Error("Auth session expired.");

          const result = await resetTestRetailer({ idToken, mode });
          if (result.success) {
              toast({
                  title: mode === 'full' ? "Environment Reset" : "Activity Cleared",
                  description: result.message,
              });
          } else {
              throw new Error(result.message);
          }
      } catch (e: any) {
          toast({
              title: "Operation Failed",
              description: e.message,
              variant: "destructive"
          });
      } finally {
          setIsResetting(false);
      }
  };

  const handleSeed = () => {
    startSeeding(async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Authentication required.");
            
            const res = await seedTestRetailerDemo({ idToken });
            if (res.success) {
                toast({ title: "Demo Seeded", description: "Heritage Vineyards dataset is now live." });
            }
        } catch (e: any) {
            toast({ title: "Seed Failed", description: e.message, variant: "destructive" });
        }
    });
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

  const isTestRetailer = retailer.id === TEST_RETAILER_ID;

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
                <BackButton fallback="/dashboard/admin" label="Back to Admin Panel" />
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">{retailer.name}</h2>
                    {isTestRetailer && <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase text-[10px]">Test Tenant</Badge>}
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                    {isTestRetailer ? "System demonstration and QA environment." : "Production tenant governance."}
                </p>
            </div>

            {isTestRetailer && (
                <div className="flex flex-wrap gap-3">
                    <Button 
                        onClick={handleSeed} 
                        disabled={isSeeding || isResetting}
                        className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase text-[10px] tracking-widest h-10 px-6 shadow-lg"
                    >
                        {isSeeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        Seed Demo Scenario
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                                <Eraser className="h-3.5 w-3.5" />
                                Reset Activity
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Clear Shopper Activity?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove all scans, sessions, and interactions. 
                                    <br/><br/>
                                    <strong>Heritage Vineyards</strong> branding and products will be preserved.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleReset('activity')} className="bg-primary font-bold uppercase text-[10px] tracking-widest">
                                    Confirm Activity Reset
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                                <RefreshCw className={cn("h-3.5 w-3.5", isResetting && "animate-spin")} />
                                Full Reset
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    Permanent Environment Reset
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove <strong>all</strong> test data, including products and branding. 
                                    The Test Retailer will return to an empty onboarding state.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleReset('full')} className="bg-destructive hover:bg-destructive/90 font-bold uppercase text-[10px] tracking-widest">
                                    Confirm Full Wipe
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-tight">
                        <Building2 className="text-primary h-4 w-4"/> 
                        Network Hierarchy
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-xs leading-relaxed">Manage global store locations and organizational nodes for this group.</p>
                    <Button asChild className="mt-4 w-full font-bold uppercase text-[10px] tracking-widest" variant="secondary"><Link href={`/retailer-mvp/organization?retailer=${params.retailerName}`}>View Network</Link></Button>
                </CardContent>
            </Card>
            <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-tight">
                        <User className="text-primary h-4 w-4"/> 
                        Identity Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-xs leading-relaxed">Audit authorized administrators and assigned identity claims for this tenant.</p>
                    <Button asChild className="mt-4 w-full font-bold uppercase text-[10px] tracking-widest" variant="secondary"><Link href={`/dashboard/identity-registry?retailer=${params.retailerName}`}>Manage Users</Link></Button>
                </CardContent>
            </Card>
             <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-tight">
                        <ShieldCheck className="text-primary h-4 w-4"/> 
                        Security Protocol
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-xs leading-relaxed">Review integration secrets and API gateway settings for external data sync.</p>
                    <Button asChild className="mt-4 w-full font-bold uppercase text-[10px] tracking-widest" variant="secondary"><Link href={`/dashboard/external-security-integrations?retailer=${params.retailerName}`}>Security Audit</Link></Button>
                </CardContent>
            </Card>
        </div>
        
        <Separator />
        
        <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">Tenant Activity Audit</h3>
             <p className="text-muted-foreground text-sm">Summary of factual engagement across the portfolio.</p>
        </div>
        
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <Card className="bg-muted/30 border-none shadow-inner">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">True Reach</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-black">0</p>
                </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none shadow-inner">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assisted Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-black">0</p>
                </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none shadow-inner">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Uplift Delta</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-black text-green-600">R0.00</p>
                </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none shadow-inner">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Points</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-black">0</p>
                </CardContent>
            </Card>
         </div>
    </div>
  );
}
