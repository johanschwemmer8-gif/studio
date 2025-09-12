
'use client';

import AIProfileManager from '@/components/dashboard/ai-profile-manager';
import BulkQRCodeGenerator from '@/components/dashboard/bulk-qr-code-generator';
import QrCampaignDashboard from '@/components/dashboard/qr-campaign-dashboard';
import { Separator } from '@/components/ui/separator';

export default function QrManagementPage() {
    return (
        <div className="space-y-8">
            <BulkQRCodeGenerator />
            <Separator />
            <QrCampaignDashboard />
            <Separator />
            <AIProfileManager />
        </div>
    );
}
