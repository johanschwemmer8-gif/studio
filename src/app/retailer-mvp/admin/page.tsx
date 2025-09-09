
'use client';

import BrandSettingsForm from "@/components/dashboard/brand-settings-form";
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
                    Manage users, brand identity, and settings specific to your organization.
                </p>
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle>Brand Configuration</CardTitle>
                    <CardDescription>
                        Customize the look and feel of your dashboard, including your logo and brand colors.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BrandSettingsForm />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                        This section is under development. Soon you'll be able to manage user permissions for your team.
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
