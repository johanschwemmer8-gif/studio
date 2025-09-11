
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Download, RefreshCw, Eye, CheckCircle, AlertTriangle, Loader2, RefreshCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-admin'; // This is a mock for client-side
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
import { generateZipForRequest } from '@/ai/flows/generate-zip-for-request';
import { regenerateQrCode, RegenerateQrCodeOutput } from '@/ai/flows/regenerate-qr-code';
import Image from 'next/image';

// Mocks for client-side Firestore interaction
const mockDb = {
    collection: (name: string) => ({
        doc: (id?: string) => ({
            id: id || `mock-${Math.random().toString(36).substring(7)}`,
            collection: (sub: string) => ({
                 onSnapshot: (callback: (snapshot: any) => void) => {
                    const mockItems = JSON.parse(localStorage.getItem(`mockItems_${id}`) || '[]');
                     setTimeout(() => callback({
                        docs: mockItems.map((doc: any) => ({ id: doc.id, data: () => doc })),
                        empty: mockItems.length === 0,
                    }), 500);
                    return () => {}; // Unsubscribe function
                },
            })
        }),
        where: (field: string, op: string, value: any) => ({
            orderBy: (field: string, dir: string) => ({
                onSnapshot: (callback: (snapshot: any) => void) => {
                    const mockRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');
                    setTimeout(() => callback({
                        docs: mockRequests.map((doc: any) => ({ id: doc.id, data: () => doc })),
                        empty: mockRequests.length === 0,
                    }), 500);
                    return () => {}; // Unsubscribe function
                },
            }),
        }),
    }),
};

const formSchema = z.object({
  campaignId: z.string().min(1, 'Campaign name is required.'),
  count: z.number().int().min(1, 'Count must be at least 1').max(500, 'Count cannot exceed 500.'),
  baseRedirect: z.string().url('Must be a valid HTTPS URL.').startsWith('https://'),
  colorHex: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, 'Must be a valid hex color.').optional().or(z.literal('')),
  bgColorHex: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, 'Must be a valid hex color.').optional().or(z.literal('')),
});

type BulkRequest = {
    id: string;
    campaignId: string;
    totalRequested: number;
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: { toDate: () => Date };
    itemsDone: number;
};

type QrItem = {
    qrCodeId: string;
    status: 'PENDING' | 'DONE' | 'ERROR';
    signedUrl: string;
    lastRegeneratedAt?: string;
};

export default function QrManagementPage() {
    const [requests, setRequests] = useState<BulkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<BulkRequest | null>(null);
    const [qrItems, setQrItems] = useState<QrItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
    const [isSubmitting, startSubmitting] = useTransition();
    const [isZipping, startZipping] = useTransition();
    const [zipUrl, setZipUrl] = useState('');
    const { toast } = useToast();
    const firestore = db || mockDb; // Use mock if admin SDK is not available

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { campaignId: '', count: 10, baseRedirect: 'https://example.com/product/', colorHex: '#000000', bgColorHex: '#ffffff' },
    });

    useEffect(() => {
        const retailerId = 'simulated-retailer-id';
        const unsubscribe = firestore.collection('bulkQrRequests')
            .where('retailerId', '==', retailerId)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const fetchedRequests: BulkRequest[] = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                fetchedRequests.forEach(req => { // Mock progress
                    if (req.status === 'COMPLETED') req.itemsDone = req.totalRequested;
                    else if (req.status === 'PROCESSING') req.itemsDone = Math.floor(req.totalRequested * 0.75);
                    else req.itemsDone = 0;
                });
                setRequests(fetchedRequests);
                setLoading(false);
            });
        return () => unsubscribe();
    }, [firestore]);
    
    useEffect(() => {
        if (selectedRequest) {
            setLoadingItems(true);
            const unsubscribe = firestore.collection('bulkQrRequests').doc(selectedRequest.id).collection('items')
                .onSnapshot(snapshot => {
                    const items: QrItem[] = snapshot.docs.map((doc: any) => ({
                        qrCodeId: doc.id,
                        ...doc.data(),
                    }));
                    
                    // Mock data for preview if empty
                    if (snapshot.empty && selectedRequest.status === 'COMPLETED') {
                        const mockItems = Array.from({ length: Math.min(selectedRequest.totalRequested, 8) }).map((_, i) => ({
                            qrCodeId: `mock_qr_${i}`,
                            status: 'DONE' as const,
                            signedUrl: `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=mock${i}`
                        }));
                        setQrItems(mockItems);
                    } else {
                        setQrItems(items);
                    }
                    setLoadingItems(false);
                });
            return () => unsubscribe();
        } else {
            setQrItems([]);
        }
    }, [selectedRequest, firestore]);


    const onSubmit = (data: z.infer<typeof formSchema>) => {
        startSubmitting(async () => {
            try {
                const result = await submitBulkQrRequest({
                    retailerId: 'simulated-retailer-id',
                    ...data,
                    options: { colorHex: data.colorHex, bgColorHex: data.bgColorHex }
                });
                toast({ title: 'Request Submitted', description: `Job ${result.requestId} has been queued.` });
                
                const mockNewRequest = { id: result.requestId, campaignId: data.campaignId, totalRequested: data.count, status: 'QUEUED' as const, createdAt: { toDate: () => new Date() }, itemsDone: 0 };
                const currentRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');
                localStorage.setItem('mockBulkQrRequests', JSON.stringify([mockNewRequest, ...currentRequests]));
                setRequests(prev => [mockNewRequest, ...prev]);

                form.reset();
            } catch (error: any) {
                toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
            }
        });
    };
    
    const handleDownloadZip = (requestId: string) => {
        setZipUrl('');
        startZipping(async () => {
            try {
                const result = await generateZipForRequest({ requestId });
                if (result.success && result.zipDataUri) {
                    setZipUrl(result.zipDataUri);
                    toast({ title: 'ZIP Ready!', description: 'Your download link is available.' });
                } else { throw new Error(result.message); }
            } catch (error: any) {
                toast({ title: 'ZIP Generation Failed', description: error.message, variant: 'destructive' });
            }
        });
    };

    const handleRegenerate = async (qrCodeId: string) => {
        if (!selectedRequest) return;
        setRegeneratingIds(prev => [...prev, qrCodeId]);
        try {
            const result = await regenerateQrCode({ requestId: selectedRequest.id, qrCodeId });
            if (result.success) {
                setQrItems(prevItems => prevItems.map(item =>
                    item.qrCodeId === qrCodeId
                        ? { ...item, signedUrl: result.signedUrl, lastRegeneratedAt: result.lastRegeneratedAt, status: 'DONE' }
                        : item
                ));
                toast({ title: "QR Code Regenerated!", description: `Code ${qrCodeId} has been updated.` });
            } else { throw new Error("Flow returned success: false"); }
        } catch (error: any) {
            toast({ title: 'Regeneration Failed', description: error.message, variant: 'destructive' });
        } finally {
            setRegeneratingIds(prev => prev.filter(id => id !== qrCodeId));
        }
    };

    const StatusBadge = ({ status }: { status: BulkRequest['status'] }) => {
        const styleMap = {
            QUEUED: "bg-blue-500/20 text-blue-700 border-blue-500/30",
            PROCESSING: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
            COMPLETED: "bg-green-500/20 text-green-700 border-green-500/30",
            FAILED: "bg-red-500/20 text-red-700 border-red-500/30",
        };
        const iconMap = {
            QUEUED: <RefreshCw className="h-3 w-3 animate-spin" />,
            PROCESSING: <Loader2 className="h-3 w-3 animate-spin" />,
            COMPLETED: <CheckCircle className="h-3 w-3" />,
            FAILED: <AlertTriangle className="h-3 w-3" />,
        }
        return <Badge variant="outline" className={styleMap[status]}>{iconMap[status]} {status}</Badge>;
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">QR Code Management</h2>
                <p className="text-muted-foreground max-w-3xl">Create, monitor, and download bulk QR code campaigns.</p>
            </div>
            <Separator />
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PlusCircle /> New Bulk Request</CardTitle>
                        <CardDescription>Submit a new job to generate multiple QR codes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <div>
                                <Label htmlFor="campaignId">Campaign Name</Label>
                                <Input id="campaignId" {...form.register('campaignId')} />
                                {form.formState.errors.campaignId && <p className="text-sm text-destructive">{form.formState.errors.campaignId.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="count">Number of Codes</Label>
                                <Input id="count" type="number" {...form.register('count', { valueAsNumber: true })} />
                                {form.formState.errors.count && <p className="text-sm text-destructive">{form.formState.errors.count.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="baseRedirect">Base Redirect URL</Label>
                                <Input id="baseRedirect" {...form.register('baseRedirect')} />
                                {form.formState.errors.baseRedirect && <p className="text-sm text-destructive">{form.formState.errors.baseRedirect.message}</p>}
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="colorHex">QR Color</Label>
                                    <Input id="colorHex" {...form.register('colorHex')} />
                                </div>
                                 <div>
                                    <Label htmlFor="bgColorHex">Background Color</Label>
                                    <Input id="bgColorHex" {...form.register('bgColorHex')} />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request History</CardTitle>
                            <CardDescription>A list of your recent bulk generation jobs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <p>Loading requests...</p> : (
                                <ul className="space-y-4">
                                    {requests.map(req => (
                                        <li key={req.id} className="p-3 border rounded-lg hover:bg-muted/50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{req.campaignId}</p>
                                                    <p className="text-sm text-muted-foreground">{req.totalRequested} codes requested on {new Date(req.createdAt.toDate()).toLocaleDateString()}</p>
                                                </div>
                                                <StatusBadge status={req.status} />
                                            </div>
                                            <Progress value={(req.itemsDone / req.totalRequested) * 100} className="mt-2" />
                                            <div className="flex justify-between items-center gap-2 mt-2">
                                                <p className="text-xs text-muted-foreground">{req.itemsDone} / {req.totalRequested} items complete</p>
                                                <div className="flex gap-2">
                                                     <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)}>
                                                        <Eye className="mr-2 h-4 w-4" /> View
                                                     </Button>
                                                    {req.status === 'COMPLETED' && (
                                                        <Button size="sm" disabled={isZipping && selectedRequest?.id === req.id} onClick={() => { setSelectedRequest(req); handleDownloadZip(req.id); }}>
                                                            {isZipping && selectedRequest?.id === req.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                                            Download ZIP
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                             {selectedRequest?.id === req.id && zipUrl && (
                                                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md text-center">
                                                    <a href={zipUrl} download={`${req.id}.zip`} className="text-sm font-medium text-green-700 hover:underline">
                                                        Click here to download your ZIP file
                                                    </a>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                    
                     {selectedRequest && (
                        <Card>
                            <CardHeader>
                                <CardTitle>QR Code Previews for: {selectedRequest.campaignId}</CardTitle>
                                <CardDescription>A preview of generated codes. {selectedRequest.status !== 'COMPLETED' ? "Previews will appear as they are generated." : ""}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingItems ? <p className="text-sm text-muted-foreground">Loading previews...</p> : (
                                    qrItems.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {qrItems.map(item => (
                                            <div key={item.qrCodeId} className="space-y-2 text-center">
                                                <div className="relative w-full aspect-square border rounded-md overflow-hidden">
                                                    <Image src={item.signedUrl} alt={`QR Code ${item.qrCodeId}`} fill sizes="128px" />
                                                    {regeneratingIds.includes(item.qrCodeId) && (
                                                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                        </div>
                                                    )}
                                                </div>
                                                {(item.status === 'DONE' || item.status === 'ERROR') && (
                                                     <Button variant="outline" size="sm" className="w-full" onClick={() => handleRegenerate(item.qrCodeId)} disabled={regeneratingIds.includes(item.qrCodeId)}>
                                                        <RefreshCcw className="mr-2 h-4 w-4" />
                                                        Regenerate
                                                    </Button>
                                                )}
                                                {item.lastRegeneratedAt && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Updated: {new Date(item.lastRegeneratedAt).toLocaleTimeString()}
                                                    </p>
                                                )}
                                                {item.status === 'ERROR' && <Badge variant="destructive">Error</Badge>}
                                            </div>
                                        ))}
                                    </div>
                                     ) : <p className="text-sm text-muted-foreground">No QR codes have been generated for this request yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
