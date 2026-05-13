
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import placeholderImages from '@/app/lib/placeholder-images.json';

type AdCampaign = {
    id: string;
    supplierBrand: string;
    targetCategories: string[];
    adCreative: {
        title: string;
        description: string;
        imageUrl: string;
    };
};

export default function SponsoredProduct() {
    const { user } = useAuth();
    const [ad, setAd] = useState<AdCampaign | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAd = async () => {
            if (!db) {
                setLoading(false);
                return;
            }

            try {
                // In a production app, we would match based on 'user.preferences.categories'
                // Here we fetch an active campaign from the media network
                const campaignsRef = collection(db, 'adCampaigns');
                const q = query(campaignsRef, where('status', '==', 'active'), limit(1));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const campaignDoc = querySnapshot.docs[0];
                    const campaignData = { id: campaignDoc.id, ...campaignDoc.data() } as AdCampaign;
                    setAd(campaignData);

                    // Log Impression (Optimistic / Non-blocking)
                    const impressionRef = doc(db, 'adMetrics', `imp_${Date.now()}`);
                    setDoc(impressionRef, {
                        campaignId: campaignDoc.id,
                        shopperId: user?.uid || 'guest',
                        type: 'impression',
                        timestamp: serverTimestamp(),
                    });
                    
                    // Increment global counter
                    updateDoc(doc(db, 'adCampaigns', campaignDoc.id), {
                        'metrics.impressions': increment(1)
                    });
                }
            } catch (error) {
                console.error("Error fetching sponsored placement:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, [user]);

    const handleAdClick = async () => {
        if (!ad || !db) return;

        // Log Click
        const clickRef = doc(db, 'adMetrics', `clk_${Date.now()}`);
        setDoc(clickRef, {
            campaignId: ad.id,
            shopperId: user?.uid || 'guest',
            type: 'click',
            timestamp: serverTimestamp(),
        });

        // Increment global counter
        updateDoc(doc(db, 'adCampaigns', ad.id), {
            'metrics.clicks': increment(1)
        });

        // In a real app, this would redirect to the supplier's external site or a special promo page
        window.open('https://interact-aoe.com', '_blank');
    };

    if (loading) {
        return <Skeleton className="h-32 w-full mt-12 rounded-xl" />;
    }

    if (!ad) {
        // Fallback to a mock ad if no live campaigns exist in DB
        return (
            <div className="mt-12">
                 <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" /> Sponsored Opportunity
                </h3>
                <Card className="border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer group" onClick={() => window.open('#')}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-20 w-20 relative rounded-lg overflow-hidden border bg-white shrink-0">
                             <Image src={placeholderImages.recommendations.mug.src} alt="Sample Ad" fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/20 mb-1">Brand Partner</Badge>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                            </div>
                            <p className="font-bold text-lg truncate">Premium Beverage Companion</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">Designed for the Eco-Friendly Water Bottle user.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mt-12">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> Sponsored Placement
            </h3>
            <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group shadow-sm" onClick={handleAdClick}>
                <CardContent className="p-5 flex items-center gap-6">
                    <div className="h-24 w-24 relative rounded-xl overflow-hidden border-2 bg-white shrink-0 shadow-inner">
                        <Image src={ad.adCreative.imageUrl} alt={ad.supplierBrand} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px]">{ad.supplierBrand}</Badge>
                            <span className="text-[10px] text-muted-foreground font-semibold">PARTNER RECC</span>
                        </div>
                        <p className="font-extrabold text-xl leading-tight group-hover:text-primary transition-colors">{ad.adCreative.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ad.adCreative.description}</p>
                    </div>
                    <div className="hidden sm:flex h-12 w-12 rounded-full bg-muted items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowUpRight className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Stub for updateDoc to ensure compile-safe component if imports missing
import { updateDoc } from 'firebase/firestore';
