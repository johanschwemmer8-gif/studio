
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ScanAnalytics from '@/components/dashboard/scan-analytics';

export default function QrAnalyticsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Scan Analytics</h2>
                <p className="text-muted-foreground max-w-3xl">
                    Analyze QR code performance, track scan trends, and identify your top campaigns.
                </p>
            </div>

            <Separator />
            
            <ScanAnalytics />

        </div>
    );
}
