
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DocumentationPage() {
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
                        This section is under development. Soon you'll be able to access comprehensive documentation, video tutorials, and interactive training modules.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Stay tuned for resources that will empower your team to become experts with the iNteract-AOE platform.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
