
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Loader2, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { generateZipForRequest } from '@/ai/flows/generate-zip-for-request';
import { processBulkQrQueue } from '@/ai/flows/process-bulk-qr-queue';
import { regenerateQrCode } from '@/ai/flows/regenerate-qr-code';

// This is a mock/stub for Firestore client-side interaction.
// In a real app, this would be replaced by the Firebase JS SDK.
const createMockDb = () => {
    const listeners: ((data: any) => void)[] = [];
    let mockRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');

    const triggerListeners = () => {
        const data = { docs: mockRequests.map((doc: any) => ({ id: doc.id, data: () => doc })), empty: mockRequests.length === 0 };
        listeners.forEach(cb => cb(data));
    };
    
    // Simulate a processor running in the background
    setInterval(async () => {
        try {
            await processBulkQrQueue(); // Call the Genkit flow
            // Note: In a real app, this would trigger a Firestore snapshot update automatically.
            // Here we would need a way to re-fetch or get updated data.
            // For this simulation, we'll rely on manual refresh for queue processing.
        } catch (e) {
            console.error("Mock processor failed:", e);
        }
    }, 15000); // Run every 15 seconds

    return {
        collection: (name: string) => ({
            where: (field: string, op: string, value: any) => ({
                orderBy: (field: string, dir: string) => ({
                    onSnapshot: (callback: (snapshot: any) => void) => {
                        listeners.push(callback);
                        // Initial call
                        setTimeout(() => {
                           mockRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');
                           callback({
                                docs: mockRequests.map((doc: any) => ({ id: doc.id, data: () => doc })),
                                empty: mockRequests.length === 0,
                           })
                        }, 100);
                        
                        // Return an unsubscribe function
                        return () => {
                            const index = listeners.indexOf(callback);
                            if (index > -1) listeners.splice(index, 1);
                        };
                    },
                }),
            }),
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
    status: 'PENDING' | 'DONE' | 'ERROR';
    signedUrl: string;
    regeneratedAt?: { toDate: () => Date };
};

export default function QrCampaignDashboard() {
    const [requests, setRequests] = useState<BulkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<BulkRequest | null>(null);
    const [qrItems, setQrItems] = useState<QrItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
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
    
    const handleRegenerate = async (requestId: string, qrCodeId: string) => {
        setRegeneratingIds(prev => [...prev, qrCodeId]);
        try {
            const result = await regenerateQrCode({ requestId, qrCodeId });
            if (result.success) {
                toast({
                    title: "QR Code Regenerated",
                    description: `Successfully regenerated ${qrCodeId}.`,
                });
                // Optimistically update the UI
                setQrItems(prev => prev.map(item => item.qrCodeId === qrCodeId ? { ...item, signedUrl: result.signedUrl, regeneratedAt: { toDate: () => new Date(result.regeneratedAt)} } : item));
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
                    <CardHeader>
                        <CardTitle>QR Code Previews for: {selectedRequest.campaignId}</CardTitle>
                        <CardDescription>
                            A preview of generated codes.
                            {selectedRequest.status !== 'COMPLETED' && "Previews will appear as they are generated."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Here you can show the items, this part is simplified */}
                        <p className="text-sm text-muted-foreground">Detailed item view is under construction. Click the "View" button on another request to dismiss.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
