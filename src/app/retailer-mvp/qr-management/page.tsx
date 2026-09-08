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
import { ShoppingBasket, Loader2, ArrowRight, QrCode, Layers, BarChart3 } from 'lucide-react';
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
            <div>
                <h1 className="text-3xl font-black tracking-tight">QR Management</h1>
                <p className="mt-2 text-muted-foreground">
                    Create, manage and monitor your digital product QR activations.
                </p>
            </div>

            <Tabs defaultValue="activation" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1.5">
                    <TabsTrigger
                        value="activation"
                        className="py-3 gap-2 font-semibold"
                    >
                        <QrCode className="h-4 w-4" />
                        QR Activation
                    </TabsTrigger>

                    <TabsTrigger
                        value="bulk"
                        className="py-3 gap-2 font-semibold"
                    >
                        <Layers className="h-4 w-4" />
                        Bulk QR Generator
                    </TabsTrigger>

                    <TabsTrigger
                        value="campaigns"
                        className="py-3 gap-2 font-semibold"
                    >
                        <BarChart3 className="h-4 w-4" />
                        QR Campaigns
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activation" className="mt-8 space-y-8">
                    <div>
                        <h2 className="text-xl font-bold">QR Activation</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create and test product activations and choose the branded QR experience.
                        </p>
                    </div>

                    <SingleQrTestGenerator />

                    <BrandQrTemplateGallery />
                </TabsContent>

                <TabsContent value="bulk" className="mt-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold">Bulk QR Generator</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Generate QR codes for multiple products and activations at scale.
                        </p>
                    </div>

                    <BulkQRCodeGenerator />
                </TabsContent>

                <TabsContent value="campaigns" className="mt-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold">QR Campaigns</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage and monitor your QR activation campaigns.
                        </p>
                    </div>

                    <QrCampaignDashboard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
