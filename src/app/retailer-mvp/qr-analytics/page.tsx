
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
            
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        The analytics section is currently under construction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Detailed analytics and drilldown capabilities for your QR code campaigns will be available here shortly.
                    </p>
                </CardContent>
            </Card>

        </div>
    );
}
