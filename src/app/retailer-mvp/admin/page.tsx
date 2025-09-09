
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RetailerAdminPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    Retailer Admin Panel
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Manage users and settings specific to your organization.
                </p>
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        This section is under development. Soon you'll be able to manage user permissions and configure settings for your team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Stay tuned for features that will allow you to control who has access to this dashboard.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
