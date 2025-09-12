
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Layers, Wifi } from "lucide-react";

export default function PlatformSecurityPage() {

    const SecurityStatus = ({ name, status }: { name: string, status: 'Active' | 'Synced' }) => (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <div>
                <p className="font-semibold">{name}</p>
                <p className="text-muted-foreground">Status: <span className="text-green-500 font-medium">{status}</span></p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    Platform Security Overview
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Monitor the security status of the core iNteract AOE platform and the deployed Retailer MVPs. All systems are continuously monitored and synchronized.
                </p>
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="text-primary" />
                        iNteract AOE Platform Security
                    </CardTitle>
                    <CardDescription>
                        Core security measures for the central iNteract AOE system.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                    <SecurityStatus name="Global Firewall & WAF" status="Active" />
                    <SecurityStatus name="Centralized Identity & Access Management" status="Active" />
                    <SecurityStatus name="Threat Intelligence Monitoring" status="Active" />
                    <SecurityStatus name="Platform-Wide Encryption" status="Active" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wifi className="text-primary" />
                        Retailer MVP Security Sync
                    </CardTitle>
                    <CardDescription>
                       Security measures deployed and synchronized across all Retailer MVP instances.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                    <SecurityStatus name="End-to-End Encryption" status="Synced" />
                    <SecurityStatus name="Role-Based Access Control (RBAC)" status="Synced" />
                    <SecurityStatus name="Firewall & Intrusion Detection" status="Synced" />
                    <SecurityStatus name="Regular Security Audits" status="Synced" />
                </CardContent>
            </Card>
        </div>
    );
}
