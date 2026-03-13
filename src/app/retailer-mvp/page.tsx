'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FilePlus2, Download, BarChart2 } from 'lucide-react';
import Link from 'next/link';

export default function RetailerPage() {

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
                    <p className="text-muted-foreground">Manage and analyze your QR code campaigns.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/retailer-mvp/qr-analytics">
                            <BarChart2 className="mr-2 h-4 w-4" />
                            View Analytics
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/retailer-mvp/qr-management">
                            <FilePlus2 className="mr-2 h-4 w-4" />
                            Create New Campaign
                        </Link>
                    </Button>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Active Campaigns</CardTitle>
                    <CardDescription>
                        Monitor the performance of your ongoing campaigns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                        <p>No active campaigns found.</p>
                        <p className="text-sm mt-1">Click "Create New Campaign" to get started.</p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Past Campaigns</CardTitle>
                    <CardDescription>
                        Review and download reports from your completed campaigns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                        <p>No past campaigns to show.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}