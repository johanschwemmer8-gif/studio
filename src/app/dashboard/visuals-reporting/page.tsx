
'use client';

import SalesPerformanceChart from '@/components/dashboard/sales-performance-chart';
import StoresByRegion from '@/components/dashboard/stores-by-region';
import { salesData } from '@/lib/data';

export default function VisualsReportingPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Visuals & Reporting</h2>
                <p className="text-muted-foreground max-w-3xl">
                    Dive deeper into your data with comprehensive charts and regional breakdowns.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <SalesPerformanceChart data={salesData} />
                </div>
                <div className="lg:col-span-1">
                    <StoresByRegion />
                </div>
            </div>
        </div>
    );
}
