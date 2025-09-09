
'use client';

import BrandSettingsForm from "@/components/dashboard/brand-settings-form";
import BrandManagementForm from "@/components/dashboard/brand-management-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import UserManagement from "@/components/dashboard/user-management";

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
                    <CardTitle>Global Brand Configuration</CardTitle>
                    <CardDescription>
                        Customize the general look and feel of your dashboard, including a default logo and brand colors. This will be used if a specific brand does not have its own styling.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BrandSettingsForm />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Brand Management</CardTitle>
                    <CardDescription>
                       Define your organization's brands, their specific branding (logo, colors), and the stores within them.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BrandManagementForm />
                </CardContent>
            </Card>
            <UserManagement />
        </div>
    );
}
