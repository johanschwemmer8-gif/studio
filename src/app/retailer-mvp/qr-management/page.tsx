'use client';

import BulkQRCodeGenerator from '@/components/dashboard/bulk-qr-code-generator';
import QrCampaignDashboard from '@/components/dashboard/qr-campaign-dashboard';
import BrandQrTemplateGallery from '@/components/dashboard/brand-qr-template-gallery';
import { Separator } from '@/components/ui/separator';
import SingleQrTestGenerator from '@/components/dashboard/single-qr-test-generator';

export default function QrManagementPage() {
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
