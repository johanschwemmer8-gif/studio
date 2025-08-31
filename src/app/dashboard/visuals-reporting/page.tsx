
'use client';

import { useState } from 'react';
import SalesPerformanceChart from '@/components/dashboard/sales-performance-chart';
import StoresByRegion from '@/components/dashboard/stores-by-region';
import StoreSelector from '@/components/dashboard/store-selector';
import { salesData, storesByRegion } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function VisualsReportingPage() {
    const [selectedStore, setSelectedStore] = useState<string | null>('All Stores');

    const handleStoreChange = (store: string | null) => {
        setSelectedStore(store);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className='flex-1'>
                    <h2 className="text-2xl font-bold tracking-tight">Visuals & Reporting</h2>
                    <p className="text-muted-foreground max-w-3xl mt-1">
                        Dive deeper into your data with comprehensive charts and regional breakdowns.
                    </p>
                </div>
                 <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download Reports
                </Button>
            </div>
            
            <StoreSelector
                regions={storesByRegion}
                selectedStore={selectedStore}
                onStoreChange={handleStoreChange}
            />
            
            <Separator />

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
