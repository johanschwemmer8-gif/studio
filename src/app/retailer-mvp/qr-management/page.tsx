'use client';

import { useState, useEffect } from 'react';
import BulkQRCodeGenerator from '@/components/dashboard/bulk-qr-code-generator';
import QrCampaignDashboard from '@/components/dashboard/qr-campaign-dashboard';
import BrandQrTemplateGallery from '@/components/dashboard/brand-qr-template-gallery';
import SingleQrTestGenerator from '@/components/dashboard/single-qr-test-generator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBasket, Loader2, ArrowRight, QrCode, Layers, BarChart3, FlaskConical, History as HistoryIcon, PlusCircle, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function QrManagementPage() {
    const { user } = useAuth();
    const [hasProducts, setHasProducts] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    const retailerId = user?.retailerId || 'unknown';

    useEffect(() => {
        const checkProducts = async () => {
            if (!db || retailerId === 'unknown') {
                setLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, 'products'),
                    where('retailerId', '==', retailerId),
                    limit(1)
                );
                const snap = await getDocs(q);
                setHasProducts(!snap.empty);
            } catch (e) {
                console.error('Product check friction', e);
            } finally {
                setLoading(false);
            }
        };

        checkProducts();
    }, [retailerId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Checking Catalog Status...
                </p>
            </div>
        );
    }

    if (hasProducts === false) {
        return (
            <div className="flex flex-col gap-8 items-center justify-center p-12 text-center min-h-[500px]">
                <Card className="max-w-md border-primary/20 bg-primary/5 shadow-2xl">
                    <CardContent className="pt-12 pb-10 space-y-8">
                        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto text-primary rotate-3">
                            <ShoppingBasket className="h-10 w-10" />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">
                                Add a Product First
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed px-4">
                                You haven't added any products to your catalog yet. You need at least one
                                product before you can create scannable digital activations.
                            </p>
                        </div>

                        <div className="px-4">
                            <Button
                                asChild
                                size="lg"
                                className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg group"
                            >
                                <Link
                                    href="/retailer-mvp/products"
                                    className="flex items-center justify-center gap-2"
                                >
                                    Open Product Catalog
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase leading-none">QR Management</h1>
                    <p className="mt-2 text-muted-foreground text-sm">
                        Create, manage and monitor your Point-of-Decision digital activations.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="activate-shelf" className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <aside className="lg:col-span-1 space-y-8">
                        <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-8 items-start">
                            <div className="space-y-4 w-full">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">QR Activations</h3>
                                <div className="flex flex-col gap-1 w-full">
                                    <TabsTrigger value="activate-shelf" className="w-full justify-start py-3 px-4 gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-xl border border-transparent shadow-none">
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="font-bold text-xs uppercase tracking-tight">Activate a Shelf</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="w-full justify-start py-3 px-4 gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-xl border border-transparent shadow-none">
                                        <HistoryIcon className="h-4 w-4" />
                                        <span className="font-bold text-xs uppercase tracking-tight">Activation History</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="lab" className="w-full justify-start py-3 px-4 gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-xl border border-transparent shadow-none">
                                        <FlaskConical className="h-4 w-4" />
                                        <span className="font-bold text-xs uppercase tracking-tight">Interactive Lab</span>
                                    </TabsTrigger>
                                </div>
                            </div>

                            <div className="space-y-4 w-full">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Bulk QR Generator</h3>
                                <div className="flex flex-col gap-1 w-full">
                                    <TabsTrigger value="bulk-activate" className="w-full justify-start py-3 px-4 gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-xl border border-transparent shadow-none">
                                        <Layers className="h-4 w-4" />
                                        <span className="font-bold text-xs uppercase tracking-tight">Activate Shelves</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="bulk-history" disabled className="w-full justify-start py-3 px-4 gap-3 transition-all rounded-xl border border-transparent opacity-50 cursor-not-allowed">
                                        <HistoryIcon className="h-4 w-4" />
                                        <span className="font-bold text-xs uppercase tracking-tight">Activated History</span>
                                    </TabsTrigger>
                                </div>
                            </div>

                            <div className="space-y-4 w-full">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">QR Campaigns</h3>
                                <div className="flex flex-col gap-1 w-full">
                                    <TabsTrigger value="campaign-dashboard" className="w-full justify-start py-3 px-4 gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-xl border border-transparent shadow-none">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span className="font-bold text-xs uppercase tracking-tight">Campaign Dashboard</span>
                                    </TabsTrigger>
                                </div>
                            </div>
                        </TabsList>
                    </aside>

                    {/* Content Area */}
                    <div className="lg:col-span-3 space-y-8">
                        <TabsContent value="activate-shelf" className="mt-0 space-y-8 focus-visible:outline-none animate-in fade-in duration-500">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase">Activate a Shelf</h2>
                                <p className="text-sm text-muted-foreground mt-1">Create a single Point-of-Decision activation with its own digital identity.</p>
                            </div>
                            <BulkQRCodeGenerator />
                            <Separator />
                            <BrandQrTemplateGallery />
                        </TabsContent>

                        <TabsContent value="history" className="mt-0 space-y-8 focus-visible:outline-none animate-in fade-in duration-500">
                             <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase">Activation History</h2>
                                <p className="text-sm text-muted-foreground mt-1">Review and manage your previously created digital activations.</p>
                            </div>
                            <QrCampaignDashboard />
                        </TabsContent>

                        <TabsContent value="lab" className="mt-0 space-y-8 focus-visible:outline-none animate-in fade-in duration-500">
                            <SingleQrTestGenerator />
                        </TabsContent>

                        <TabsContent value="bulk-activate" className="mt-0 space-y-8 focus-visible:outline-none animate-in fade-in duration-500">
                            <Card className="border-dashed border-2 bg-muted/20">
                                <CardContent className="py-20 text-center space-y-4">
                                    <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold uppercase">Bulk Activation Tool</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">
                                            Mass creation of distinct activations via CSV import is currently in pilot development.
                                        </p>
                                    </div>
                                    <Button variant="outline" className="font-bold uppercase text-[10px] tracking-widest" disabled>
                                        Request Access
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="campaign-dashboard" className="mt-0 space-y-8 focus-visible:outline-none animate-in fade-in duration-500">
                             <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase">Campaign Dashboard</h2>
                                <p className="text-sm text-muted-foreground mt-1">Aggregate performance and visibility by Campaign ID.</p>
                            </div>
                            <Card className="border-primary/10 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-primary" />
                                        Portfolio Visibility
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-64 flex items-center justify-center bg-muted/20 rounded-lg m-6 border border-dashed">
                                    <p className="text-xs font-bold uppercase text-muted-foreground opacity-50">Campaign Data Aggregator Offline</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
