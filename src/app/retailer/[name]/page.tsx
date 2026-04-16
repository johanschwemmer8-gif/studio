
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Template1, Template2, Template3, Template4, Template5, Template6, Template7, Template8, Template9 } from '@/components/dashboard/ui-templates';
import { Skeleton } from '@/components/ui/skeleton';

export default function RetailerLandingPage({ params }: { params: { name: string } }) {
    const [selectedTemplate, setSelectedTemplate] = useState('template1');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoWidth, setLogoWidth] = useState(128);
    const [logoAlign, setLogoAlign] = useState('flex-start');
    const [logoPadding, setLogoPadding] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This code runs only on the client side to access localStorage
        const savedTemplate = localStorage.getItem('selected-ui-template');
        if (savedTemplate) setSelectedTemplate(savedTemplate);

        const savedLandingLogo = localStorage.getItem('landing-page-logo');
        setLogoPreview(savedLandingLogo);

        const savedLandingWidth = localStorage.getItem('landing-page-logo-width');
        setLogoWidth(Number(savedLandingWidth || 128));

        const savedLandingAlign = localStorage.getItem('landing-page-logo-align');
        setLogoAlign(savedLandingAlign || 'flex-start');

        const savedLandingPadding = localStorage.getItem('landing-page-logo-padding');
        setLogoPadding(Number(savedLandingPadding || 0));
        
        setLoading(false);
    }, []);

    if (!params.name) {
        notFound();
    }
    
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                 <Skeleton className="w-full max-w-md h-[80vh]" />
            </div>
        )
    }

    const renderTemplate = () => {
        const props = { logoPreview, logoWidth, logoAlign, logoPadding };
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
        <div className="min-h-screen">
           {renderTemplate()}
        </div>
    );
}
