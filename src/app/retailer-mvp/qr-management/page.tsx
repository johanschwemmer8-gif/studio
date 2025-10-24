
'use client';

import BulkQRCodeGenerator from '@/components/dashboard/bulk-qr-code-generator';
import QrCampaignDashboard from '@/components/dashboard/qr-campaign-dashboard';
import BrandQrTemplateGallery from '@/components/dashboard/brand-qr-template-gallery';
import { Separator } from '@/components/ui/separator';

export default function QrManagementPage() {
    return (
        <div className="space-y-8">
            <BulkQRCodeGenerator />
            <Separator />
            <QrCampaignDashboard />
            <Separator />
            <BrandQrTemplateGallery />
        </div>
    );
}
