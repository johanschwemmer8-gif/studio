'use client';

import { useState, useEffect } from 'react';
import BulkQRCodeGenerator from '@/components/dashboard/bulk-qr-code-generator';
import QrCampaignDashboard from '@/components/dashboard/qr-campaign-dashboard';
import BrandQrTemplateGallery from '@/components/dashboard/brand-qr-template-gallery';
import { Separator } from '@/components/ui/separator';
import SingleQrTestGenerator from '@/components/dashboard/single-qr-test-generator';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBasket, Loader2, PlusCircle } from 'lucide-react';
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
                const q = query(collection(db, 'products'), where('retailerId', '==', retailerId), limit(1));
                const snap = await getDocs(q);
                setHasProducts(!snap.empty);
            } catch (e) {
                console.error("Product check friction", e);
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
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Checking Catalog Status...</p>
            </div>
        );
    }

    if (hasProducts === false) {
        return (
            <div className="flex flex-col gap-8 items-center justify-center p-12 text-center min-h-[400px]">
                <Card className="max-w-md border-primary/20 bg-primary/5">
                    <CardContent className="pt-10 space-y-6">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                            <ShoppingBasket className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Add a Product First</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Your product catalog is currently empty. You must add the products you want to activate before generating QR codes.
                            </p>
                        </div>
                        <Button asChild size="lg" className="w-full h-12 font-black uppercase text-[10px] tracking-widest">
                            <Link href="/retailer-mvp/products">
                                <PlusCircle className="mr-2 h-4 w-4" /> Go to Product Catalog
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <SingleQrTestGenerator />
            <Separator />
            <BulkQRCodeGenerator />
            <Separator />
            <div id="job-dashboard">
                <QrCampaignDashboard />
            </div>
            <Separator />
            <BrandQrTemplateGallery />
        </div>
    );
}