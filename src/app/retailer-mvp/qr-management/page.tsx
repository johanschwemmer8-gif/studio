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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBasket, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
                    Synchronizing Catalog...
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
                                product before you can generate scannable digital links.
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
                        Create, manage and monitor your digital in-store activations.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="qr-activation" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/30 p-1.5 rounded-xl mb-8">
                    <TabsTrigger value="qr-activation" className="rounded-lg font-bold text-xs uppercase tracking-widest">QR Activation</TabsTrigger>
                    <TabsTrigger value="bulk-generator" className="rounded-lg font-bold text-xs uppercase tracking-widest">Bulk QR Generator</TabsTrigger>
                    <TabsTrigger value="campaigns" className="rounded-lg font-bold text-xs uppercase tracking-widest">QR Campaigns</TabsTrigger>
                </TabsList>

                <TabsContent value="qr-activation" className="space-y-8 focus-visible:outline-none animate-in fade-in duration-500">
                    <SingleQrTestGenerator />
                    <BrandQrTemplateGallery />
                </TabsContent>

                <TabsContent value="bulk-generator" className="focus-visible:outline-none animate-in fade-in duration-500">
                    <BulkQRCodeGenerator />
                </TabsContent>

                <TabsContent value="campaigns" className="focus-visible:outline-none animate-in fade-in duration-500">
                    <QrCampaignDashboard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
