
'use client';

import BrandManagementForm from '@/components/dashboard/brand-management-form';
import BrandQrTemplateGallery from '@/components/dashboard/brand-qr-template-gallery';
import { Separator } from '@/components/ui/separator';
import { HubNav } from '@/components/dashboard/hub-nav';

export default function BrandsPage() {
    const brandHubItems = [
      { label: "Brand & Landing Page", href: "/retailer-mvp/ui-management" },
      { label: "Supplier Media", href: "/retailer-mvp/brands" },
    ];

    return (
        <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Brand & Experience</h2>
              <p className="text-muted-foreground mt-2">
                  Manage advertising assets and specific branding for your supplier network.
              </p>
            </div>

            <HubNav items={brandHubItems} />
            <Separator />
            
            <BrandManagementForm />
            <Separator />
            <BrandQrTemplateGallery />
        </div>
    );
}
