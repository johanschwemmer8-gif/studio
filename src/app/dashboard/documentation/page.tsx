
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AdminDocumentationPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    Documentation & Training Modules
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Find resources, guides, and training materials to help you get the most out of the iNteract-AOE platform.
                </p>
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        This section is under development. Once the platform is complete, this area will be populated with comprehensive documentation, video tutorials, and interactive training modules for both administrators and retailer users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Our goal is to provide you with all the resources needed to maximize the value of the iNteract-AOE platform. Thank you for your patience!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
