
'use client';

import AIConfigurationPanel from '@/components/dashboard/ai-configuration-panel';
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
            <AIConfigurationPanel />
        </div>
    );
}
