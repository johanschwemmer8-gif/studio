
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function UiUxDevelopmentPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    UI/UX Development
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    A dedicated space for designing, testing, and managing front-end components and user experience flows.
                </p>
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        This section is under construction. Soon you will find tools for component testing, a living style guide, and UX flow simulators.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Stay tuned for a comprehensive environment to build and refine the user interface and experience for the iNteract AOE platform.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
