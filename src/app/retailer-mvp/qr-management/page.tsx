
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Paintbrush } from 'lucide-react';
import Link from 'next/link';

export default function QrManagementPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">QR Code Management</h2>
                <p className="text-muted-foreground max-w-3xl">Create, monitor, and download bulk QR code campaigns. Design and manage QR styles for your brands.</p>
            </div>

            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Campaign Management</CardTitle>
                    <CardDescription>
                        This section is under development.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Comprehensive tools for generating, managing, and analyzing your bulk QR code campaigns will be available here shortly.
                    </p>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Paintbrush className="text-primary" />
                        Brand QR Templates
                    </CardTitle>
                    <CardDescription>
                        Design and manage QR code styles for each of your brands to ensure a consistent customer experience.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Click the button below to access the brand template designer.
                    </p>
                    <Button asChild>
                        <Link href="/retailer-mvp/brands">
                           Manage Templates
                        </Link>
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
