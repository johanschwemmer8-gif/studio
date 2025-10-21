
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ScanAnalytics from '@/components/dashboard/scan-analytics';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ScanAnalyticsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </CardContent>
        </Card>
    )
}

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
            
            <Suspense fallback={<ScanAnalyticsSkeleton />}>
                <ScanAnalytics />
            </Suspense>

        </div>
    );
}
