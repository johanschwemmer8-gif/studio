
'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { Template1, Template2, Template3, Template4, Template5, Template6, Template7, Template8, Template9 } from '@/components/dashboard/ui-templates';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * RETAILER LANDING PAGE (Next.js 15)
 * Correctly awaits params and resolves branding from the authoritative registry.
 */
export default function RetailerLandingPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = use(params);
    const [branding, setBranding] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBranding() {
            if (!db || !name) return;
            try {
                // Resolve retailerId from the human-friendly name/slug
                const tenantsRef = collection(db, 'tenants');
                const q = query(tenantsRef, where('name', '==', decodeURIComponent(name)), limit(1));
                const snap = await getDocs(q);
                
                if (!snap.empty) {
                    const retailerId = snap.docs[0].id;
                    const configRef = collection(db, 'configurations');
                    const configSnap = await getDocs(query(configRef, where('retailerId', '==', retailerId), where('type', '==', 'brand'), limit(1)));
                    
                    if (!configSnap.empty) {
                        setBranding(configSnap.docs[0].data().data);
                    }
                }
            } catch (e) {
                console.error("Branding resolution friction");
            } finally {
                setLoading(false);
            }
        }
        fetchBranding();
    }, [name]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                 <Skeleton className="w-full max-w-md h-[80vh] rounded-[2rem]" />
            </div>
        )
    }

    if (!branding) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center gap-4">
                <h1 className="text-2xl font-black">Brand Not Found</h1>
                <p className="text-muted-foreground">The retailer "{decodeURIComponent(name)}" is not currently active on the AOE platform.</p>
            </div>
        );
    }

    const { selectedTemplate, logoUrl, logoWidth, logoAlign, logoPadding } = branding;

    const renderTemplate = () => {
        const props = { logoPreview: logoUrl, logoWidth, logoAlign, logoPadding };
        switch(selectedTemplate) {
            case 'template1': return <Template1 {...props} />;
            case 'template2': return <Template2 {...props} />;
            case 'template3': return <Template3 {...props} />;
            case 'template4': return <Template4 {...props} />;
            case 'template5': return <Template5 {...props} />;
            case 'template6': return <Template6 {...props} />;
            case 'template7': return <Template7 {...props} />;
            case 'template8': return <Template8 {...props} />;
            case 'template9': return <Template9 {...props} />;
            default: return <Template1 {...props} />;
        }
    }

    return (
        <div className="min-h-screen bg-background">
           {renderTemplate()}
        </div>
    );
}
