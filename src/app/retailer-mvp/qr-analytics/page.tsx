

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ScanAnalytics from '@/components/dashboard/scan-analytics';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ScanAnalyticsSkeleton() {
    return (
        <div className="space-y-8">
            <Card className="border-primary/10">
                <CardHeader>
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="border-primary/10">
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-3 w-1/2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-1/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-1/4" />
                        <div className="border rounded-xl p-4">
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function QrAnalyticsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2 uppercase">Scan Statistics</h2>
                <p className="text-muted-foreground max-w-3xl text-sm">
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

