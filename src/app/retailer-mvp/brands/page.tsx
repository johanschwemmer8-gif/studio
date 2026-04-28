
'use client';

import BrandManagementForm from '@/components/dashboard/brand-management-form';
import BrandQrTemplateGallery from '@/components/dashboard/brand-qr-template-gallery';
import { Separator } from '@/components/ui/separator';

export default function BrandsPage() {
    return (
        <div className="space-y-8">
            <BrandManagementForm />
            <Separator />
            <BrandQrTemplateGallery />
        </div>
    );
}
