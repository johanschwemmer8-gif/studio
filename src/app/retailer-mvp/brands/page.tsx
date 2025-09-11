
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function BrandsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Brand QR Templates</h2>
                <p className="text-muted-foreground max-w-3xl">Design and manage QR code styles for each of your brands.</p>
            </div>

            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        This section is under development.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Tools for creating, customizing, and assigning QR code templates to your brands will be available here shortly.
                    </p>
                </CardContent>
            </Card>

        </div>
    );
}
