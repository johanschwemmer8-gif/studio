'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ExternalLink, Palette, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function RetailerAdminPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">
                    Admin Panel
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Manage your platform identity and organizational settings.
                </p>
            </div>
            
            <Card className="border-accent border-2 bg-accent/5 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-accent-foreground" />
                        Authoritative Branding Hub
                    </CardTitle>
                    <CardDescription>
                        Branding, logos, and shopper experiences are now managed centrally in the Brand & Experience hub.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">
                        To ensure your brand appears correctly for both your internal team and your shoppers, please use the dedicated experience editor. Changes made there are automatically synced to the iNteract cloud.
                    </p>
                    <Button asChild size="lg" className="gap-2 font-bold uppercase text-[10px] tracking-widest h-12 px-8">
                        <Link href="/retailer-mvp/ui-management">
                            <Palette className="h-4 w-4" />
                            Open Brand & Experience Hub
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="text-muted-foreground opacity-50">Operational Settings</CardTitle>
                    <CardDescription>Additional administrative controls will appear here as they are released.</CardDescription>
                </CardHeader>
                <CardContent className="h-40 flex items-center justify-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-widest">Awaiting Pilot Updates</p>
                </CardContent>
            </Card>
        </div>
    );
}
