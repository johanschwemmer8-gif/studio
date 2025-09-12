
'use client';

import { useEffect, useState } from 'react';
import { db, analytics } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type AdCampaign = {
    id: string;
    campaignName: string;
    sponsoredProducts: string[];
};

type SponsoredProductProps = {
    productId: string;
    productName: string;
    imageUrl: string;
};

export default function SponsoredProduct() {
    const [ad, setAd] = useState<SponsoredProductProps | null>(null);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAd = async () => {
            if (!db) {
                setLoading(false);
                return;
            }

            try {
                const campaignsRef = collection(db, 'adCampaigns');
                const q = query(campaignsRef, where('status', '==', 'Running'), limit(1));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const campaignDoc = querySnapshot.docs[0];
                    const campaignData = campaignDoc.data() as AdCampaign;
                    
                    if (campaignData.sponsoredProducts && campaignData.sponsoredProducts.length > 0) {
                        // In a real app, you'd fetch product details for the SKU.
                        // Here, we'll just mock it.
                        const sponsoredSku = campaignData.sponsoredProducts[Math.floor(Math.random() * campaignData.sponsoredProducts.length)];
                        
                        const sponsoredProductData = {
                            productId: sponsoredSku,
                            productName: `Sponsored Item: ${sponsoredSku.replace('product_SKU_', '')}`,
                            imageUrl: 'https://picsum.photos/seed/ad/200/200',
                        };

                        setAd(sponsoredProductData);
                        setCampaignId(campaignDoc.id);

                        if (analytics) {
                            logEvent(analytics, 'ad_impression', {
                                campaign_id: campaignDoc.id,
                                product_id: sponsoredSku,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching sponsored product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, []);

    const handleAdClick = () => {
        if (!ad || !campaignId) return;

        if (analytics) {
            logEvent(analytics, 'ad_clicked', {
                campaign_id: campaignId,
                product_id: ad.productId,
            });
            alert(`Analytics event 'ad_clicked' logged for campaign: ${campaignId}`);
        }
        // In a real app, this would navigate to the product page.
        // router.push(`/product/${ad.productId}`);
    };

    if (loading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (!ad) {
        return null; // Don't render anything if no ad is found
    }

    return (
        <div id="sponsored-ad-container" className="mt-12 lg:mt-16">
            <h3 className="text-lg font-semibold text-muted-foreground mb-4">Sponsored</h3>
            <Card className="hover:border-primary transition-colors cursor-pointer" onClick={handleAdClick}>
                <CardContent className="p-4 flex items-center gap-4">
                    <Image src={ad.imageUrl} alt={ad.productName} width={80} height={80} className="rounded-md border" />
                    <div className="space-y-1">
                        <Badge variant="secondary">Sponsored Ad</Badge>
                        <p className="font-semibold">{ad.productName}</p>
                        <p className="text-sm text-muted-foreground">Special offer just for you!</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
