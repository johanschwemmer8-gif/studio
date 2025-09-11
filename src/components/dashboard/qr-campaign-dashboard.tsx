
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Loader2, Download, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { generateZipForRequest } from '@/ai/flows/generate-zip-for-request';
import { processBulkQrQueue } from '@/ai/flows/process-bulk-qr-queue';
import { regenerateQrCode } from '@/ai/flows/regenerate-qr-code';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';

// This is a mock/stub for Firestore client-side interaction.
// In a real app, this would be replaced by the Firebase JS SDK.
const createMockDb = () => {
    // ... (mock db logic)
    return {
        collection: (name: string) => ({
            where: (field: string, op: string, value: any) => ({
                orderBy: (field: string, dir: string) => ({
                    onSnapshot: (callback: (snapshot: any) => void) => {
                        const mockRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');
                        setTimeout(() => {
                           callback({
                                docs: mockRequests.map((doc: any) => ({ id: doc.id, data: () => doc })),
                                empty: mockRequests.length === 0,
                           })
                        }, 100);
                        // Return an empty unsubscribe function for this mock
                        return () => {};
                    },
                }),
            }),
             doc: (id: string) => ({
                collection: (subName: string) => ({
                    onSnapshot: (callback: (snapshot: any) => void) => {
                        const mockRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');
                        const request = mockRequests.find((r: any) => r.id === id);
                        const items = request ? request.items : [];
                         setTimeout(() => {
                           callback({
                                docs: items.map((doc: any) => ({ id: doc.qrCodeId, data: () => doc })),
                                empty: items.length === 0,
                           })
                        }, 100);
                        return () => {};
                    }
                })
            })
        }),
    };
};


type BulkRequest = {
    id: string;
    campaignId: string;
    totalRequested: number;
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: { toDate: () => Date };
    itemsDone: number; // This will be calculated client-side
};

type QrItem = {
    qrCodeId: string;
    redirectUrl: string;
    status: 'PENDING' | 'DONE' | 'ERROR';
    signedUrl: string;
    regeneratedAt?: { toDate: () => Date };
};

function QrRequestDetails({ requestId }: { requestId: string }) {
    const [items, setItems] = useState<QrItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
    const { toast } = useToast();
    const firestore = createMockDb();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = firestore.collection('bulkQrRequests').doc(requestId).collection('items').onSnapshot(snapshot => {
            const fetchedItems: QrItem[] = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setItems(fetchedItems);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [requestId]);

    const handleRegenerate = async (qrCodeId: string) => {
        setRegeneratingIds(prev => [...prev, qrCodeId]);
        try {
            const result = await regenerateQrCode({ requestId, qrCodeId });
            if (result.success) {
                toast({
                    title: "QR Code Regenerated",
                    description: `Successfully regenerated ${qrCodeId}.`,
                });
                setItems(prev => prev.map(item => item.qrCodeId === qrCodeId ? { ...item, signedUrl: result.signedUrl, regeneratedAt: { toDate: () => new Date(result.regeneratedAt)} } : item));
            } else {
                 throw new Error('Regeneration failed on the server.');
            }
        } catch (error: any) {
             toast({
                title: "Regeneration Failed",
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setRegeneratingIds(prev => prev.filter(id => id !== qrCodeId));
        }
    }

    const filteredItems = items.filter(item => statusFilter === 'ALL' || item.status === statusFilter);

    if (loading) {
        return (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
            </div>
        )
    }

    return (
        <div className="space-y-4">
             <div className="w-full sm:w-64">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                        <SelectItem value="ERROR">Error</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {filteredItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No QR codes match the filter.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                        const isRegenerating = regeneratingIds.includes(item.qrCodeId);
                        return (
                            <Card key={item.qrCodeId} className="group relative">
                                <CardContent className="p-2">
                                     <div className="aspect-square relative rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                        {item.status === 'PENDING' ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        ) : (
                                            <Image src={item.signedUrl} alt={item.qrCodeId} width={200} height={200} className="w-full h-full object-contain" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                             <Button 
                                                size="sm"
                                                disabled={isRegenerating || (item.status !== 'DONE' && item.status !== 'ERROR')}
                                                onClick={() => handleRegenerate(item.qrCodeId)}
                                             >
                                                {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                                                Regenerate
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-2 flex-col items-start text-xs">
                                    <Badge variant={item.status === 'DONE' ? 'default' : item.status === 'ERROR' ? 'destructive' : 'secondary'} className="mb-1">
                                        {item.status}
                                    </Badge>
                                    <p className="font-mono text-muted-foreground truncate w-full">{item.qrCodeId}</p>
                                    {item.regeneratedAt && <p className="text-blue-500">Regen: {new Date(item.regeneratedAt.toDate()).toLocaleTimeString()}</p>}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

export default function QrCampaignDashboard() {
    const [requests, setRequests] = useState<BulkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<BulkRequest | null>(null);
    const [downloadingIds, setDownloadingIds] = useState<string[]>([]);

    const { toast } = useToast();
    const firestore = createMockDb(); // Use the mock

    useEffect(() => {
        setLoading(true);
        const unsubscribe = firestore.collection('bulkQrRequests')
            .where('retailerId', '==', 'simulated-retailer-id')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const fetchedRequests: BulkRequest[] = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                // In a real scenario, itemsDone would come from an aggregated query or be a field on the request doc.
                // Here we just simulate it.
                setRequests(fetchedRequests.map(r => ({ ...r, itemsDone: r.status === 'COMPLETED' ? r.totalRequested : Math.floor(Math.random() * r.totalRequested) })));
                setLoading(false);
            });
            
        return () => unsubscribe();
    }, []);

    const handleDownloadZip = async (requestId: string) => {
        setDownloadingIds(prev => [...prev, requestId]);
        try {
            const result = await generateZipForRequest({ requestId });
            if (result.success && result.zipDataUri) {
                // Trigger download
                const link = document.createElement("a");
                link.href = result.zipDataUri;
                link.download = `${requestId}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({
                    title: "Download Started",
                    description: "Your ZIP file is being downloaded.",
                });
            } else {
                throw new Error(result.message || 'Failed to generate ZIP.');
            }
        } catch (error: any) {
             toast({
                title: "Download Failed",
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setDownloadingIds(prev => prev.filter(id => id !== requestId));
        }
    };

    if (loading) {
        return <div className="text-center text-muted-foreground">Loading campaigns...</div>
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Request History</CardTitle>
                    <CardDescription>A list of your bulk QR code generation requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No requests found. Create a new bulk request to get started.</p>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(req => {
                                const progress = req.totalRequested > 0 ? (req.itemsDone / req.totalRequested) * 100 : 0;
                                const isDownloading = downloadingIds.includes(req.id);
                                return (
                                    <Card key={req.id} className="flex flex-col sm:flex-row">
                                        <CardHeader className="flex-1">
                                            <CardTitle className="text-lg">{req.campaignId}</CardTitle>
                                            <CardDescription>
                                                {new Date(req.createdAt.toDate()).toLocaleString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 flex-1 space-y-3">
                                            <div>
                                                <div className="flex justify-between text-sm font-medium mb-1">
                                                    <span>{req.status}</span>
                                                    <span>{req.itemsDone} / {req.totalRequested}</span>
                                                </div>
                                                <Progress value={progress} />
                                            </div>
                                        </CardContent>
                                        <CardContent className="pt-6 flex-none flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)}>
                                                <Eye className="mr-2 h-4 w-4" /> View
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                disabled={req.status !== 'COMPLETED' || isDownloading}
                                                onClick={() => handleDownloadZip(req.id)}
                                            >
                                                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                                Download
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedRequest && (
                <Card>
                    <CardHeader className="flex items-start justify-between">
                        <div>
                            <CardTitle>QR Code Previews for: {selectedRequest.campaignId}</CardTitle>
                            <CardDescription>
                                A preview of generated codes.
                                {selectedRequest.status !== 'COMPLETED' && " Previews will appear as they are generated."}
                            </CardDescription>
                        </div>
                         <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </CardHeader>
                    <CardContent>
                       <QrRequestDetails requestId={selectedRequest.id} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
