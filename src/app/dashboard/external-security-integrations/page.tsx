
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyRound, Webhook, ListChecks, Activity, Users, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export default function ExternalSecurityIntegrationsPage() {

    const apiKeys = [
        { retailerId: 'woolworths_za', service: 'PIM Sync', status: 'Active' },
        { retailerId: 'picknpay_sa', service: 'ERP Stock Level', status: 'Active' },
        { retailerId: 'dischem_za', service: 'PIM Sync', status: 'Revoked' },
    ];

    const webhooks = [
        { service: 'POS Sync', endpoint: '/api/webhooks/pos-sync', status: 'Healthy' },
        { service: 'Sales Data', endpoint: '/api/webhooks/sales-data', status: 'Healthy' },
        { service: 'Inventory Update', endpoint: '/api/webhooks/inventory', status: 'Error' },
    ];
    
    const auditLogs = [
        { event: 'API Key Revoked', details: 'dischem_za - PIM Sync', user: 'admin@interact.io', timestamp: '2023-10-27T10:00:00Z' },
        { event: 'New Retailer Onboarded', details: 'clicks_sa', user: 'system', timestamp: '2023-10-26T14:00:00Z' },
        { event: 'Password Changed', details: 'User: retailer@woolworths.co.za', user: 'self', timestamp: '2023-10-26T11:20:00Z' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    External Security & Integrations
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Manage API credentials, monitor webhooks, and review security audit logs for all external integrations.
                </p>
            </div>
            <Separator />

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Active Retailers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">12</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Errors (24h)</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">3</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Security Scan</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">2h ago</div>
                        <p className="text-xs text-muted-foreground text-green-500">No vulnerabilities found</p>
                    </CardContent>
                </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Webhook Success Rate</CardTitle>
                        <Webhook className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.8%</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="text-primary"/> API Secret Manager</CardTitle>
                    <CardDescription>List of API keys and credentials for each retailer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Retailer ID</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {apiKeys.map(key => (
                                <TableRow key={key.retailerId}>
                                    <TableCell className="font-mono">{key.retailerId}</TableCell>
                                    <TableCell>{key.service}</TableCell>
                                    <TableCell>
                                        <Badge variant={key.status === 'Active' ? 'default' : 'destructive'}>{key.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Webhook className="text-primary"/> Webhooks & Callbacks</CardTitle>
                    <CardDescription>Monitor and manage incoming data streams.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Endpoint</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {webhooks.map(hook => (
                                <TableRow key={hook.service}>
                                    <TableCell>{hook.service}</TableCell>
                                    <TableCell className="font-mono">{hook.endpoint}</TableCell>
                                    <TableCell>
                                        <Badge variant={hook.status === 'Healthy' ? 'secondary' : 'destructive'}>{hook.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm">View Logs</Button>
                                        <Button variant="outline" size="sm">Manual Sync</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary"/> Audit Log & Alerts</CardTitle>
                    <CardDescription>A chronological list of all security-related events.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>User/Actor</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditLogs.map(log => (
                                <TableRow key={log.timestamp}>
                                    <TableCell className="font-medium flex items-center gap-2"><Activity className="text-muted-foreground"/>{log.event}</TableCell>
                                    <TableCell>{log.details}</TableCell>
                                    <TableCell>{log.user}</TableCell>
                                    <TableCell className="flex items-center gap-2"><Clock className="text-muted-foreground"/> {new Date(log.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
