
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Loader2, Download, RefreshCw, X, Sparkles, AlertTriangle, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { generateZipForRequest } from '@/ai/flows/generate-zip-for-request';
import { regenerateQrCode } from '@/ai/flows/regenerate-qr-code';
import { generateCampaignAI, type GenerateCampaignAIOutput } from '@/ai/flows/generate-campaign-ai';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


type BulkRequest = {
    id: string;
    campaignId: string;
    totalRequested: number;
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DRAFT';
    createdAt: Timestamp | Date; // Can be a Firestore Timestamp or a JS Date
    itemsDone: number;
    aiStatus?: 'PENDING' | 'READY' | 'ERROR';
    aiOutputs?: GenerateCampaignAIOutput;
    aiError?: string;
    retailerId?: string;
    options?: any;
};

type QrItem = {
    qrCodeId: string;
    redirectUrl: string;
    status: 'PENDING' | 'DONE' | 'ERROR';
    signedUrl: string;
    regeneratedAt?: { toDate: () => Date };
};

// Helper function to robustly format dates
const getDisplayDate = (timestamp: any) => {
    if (!timestamp) {
        return 'Date pending...';
    }
    // Firestore Timestamps have a toDate() method
    if (typeof timestamp.toDate === 'function') {
        return new Date(timestamp.toDate()).toLocaleString();
    }
    // Handle JS Date objects or ISO strings
    if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
    }
    // Handle string dates
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date.toLocaleString();
    }
    
    return 'Invalid Date';
};

const CHUNK_SIZE = 50; // Process 50 QR codes at a time to be safe

function QrRequestDetails({ request }: { request: BulkRequest }) {
    const [items, setItems] = useState<QrItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
    const { toast } = useToast();
    
    const [currentRequest, setCurrentRequest] = useState(request);
    const [isAiRegenerating, startAiRegenerating] = useTransition();

    useEffect(() => {
        if (!db) return;
        setLoading(true);
        const itemsQuery = query(collection(db, `bulkQrRequests/${request.id}/items`));
        const unsubscribeItems = onSnapshot(itemsQuery, snapshot => {
            const fetchedItems: QrItem[] = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setItems(fetchedItems);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching QR items:", error);
            toast({ title: "Error", description: "Could not fetch QR code details.", variant: "destructive" });
        });

        const requestRef = doc(db, 'bulkQrRequests', request.id);
        const unsubscribeRequest = onSnapshot(requestRef, (doc) => {
            if (doc.exists()) {
                setCurrentRequest({ id: doc.id, ...doc.data() } as BulkRequest);
            }
        });

        return () => {
            unsubscribeItems();
            unsubscribeRequest();
        };
    }, [request.id, toast]);

    const handleRegenerate = async (qrCodeId: string) => {
        setRegeneratingIds(prev => [...prev, qrCodeId]);
        try {
            const result = await regenerateQrCode({ requestId: request.id, qrCodeId });
            if (result.success) {
                toast({
                    title: "QR Code Regenerated",
                    description: `Successfully regenerated ${qrCodeId}.`,
                });
                // The onSnapshot listener will handle the UI update automatically.
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
    
    const handleRegenerateAI = () => {
        startAiRegenerating(async () => {
            try {
                const result = await generateCampaignAI({ requestId: currentRequest.id });
                // The onSnapshot listener will update the UI automatically.
                toast({
                    title: "AI Content Generated!",
                    description: "The campaign content has been refreshed.",
                });
            } catch (e: any) {
                 toast({
                    title: "AI Generation Failed",
                    description: e.message || 'Could not generate AI content at this time.',
                    variant: 'destructive',
                });
            }
        });
    }

    const filteredItems = items.filter(item => statusFilter === 'ALL' || item.status === statusFilter);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-accent" />
                        AI-Powered Campaign Content
                    </CardTitle>
                    <CardDescription>
                        Use our AI to generate engaging copy for your campaign based on your goals.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {currentRequest.aiStatus === 'PENDING' && !isAiRegenerating && (
                        <div className="flex items-center justify-center flex-col gap-2 text-muted-foreground p-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>AI content generation is pending...</p>
                            <p className="text-xs">This will start after the request is processed.</p>
                        </div>
                    )}

                    {(currentRequest.aiStatus === 'READY' || (isAiRegenerating && currentRequest.aiOutputs)) && currentRequest.aiOutputs && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm">Landing Page Copy</h4>
                                    <p className="text-muted-foreground text-sm p-3 bg-muted/50 rounded-md mt-1">{currentRequest.aiOutputs.landingCopy}</p>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-sm">Call-to-Action (CTA)</h4>
                                    <p className="text-muted-foreground text-sm p-3 bg-muted/50 rounded-md mt-1 font-medium">{currentRequest.aiOutputs.cta}</p>
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-sm">Scan Trigger Ideas</h4>
                                <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-muted-foreground">
                                    {currentRequest.aiOutputs.scanTriggers.map((trigger, i) => <li key={i}>{trigger}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                    
                    {currentRequest.aiStatus === 'ERROR' && (
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>AI Generation Failed</AlertTitle>
                            <AlertDescription>{currentRequest.aiError || 'An unknown error occurred.'}</AlertDescription>
                        </Alert>
                    )}

                </CardContent>
                <CardFooter>
                    <Button onClick={handleRegenerateAI} disabled={isAiRegenerating}>
                        {isAiRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        {currentRequest.aiOutputs ? 'Regenerate AI Content' : 'Generate AI Content'}
                    </Button>
                </CardFooter>
            </Card>

            <Separator />
            
            <div>
                 <h3 className="text-lg font-semibold">QR Code Previews</h3>
                <div className="w-full sm:w-64 mt-2">
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
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
                </div>
            ) : filteredItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No QR codes match the filter.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                        const isRegenerating = regeneratingIds.includes(item.qrCodeId);
                        return (
                            <Card key={item.qrCodeId} className="group relative flex flex-col">
                                <CardContent className="p-2 flex-1">
                                     <div className="aspect-square relative rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                        {item.status === 'PENDING' ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        ) : item.status === 'ERROR' ? (
                                             <div className="text-center text-destructive p-2">
                                                <AlertTriangle className="h-8 w-8 mx-auto" />
                                                <p className="text-xs mt-2">Generation Failed</p>
                                             </div>
                                        ) : (
                                            <Image src={item.signedUrl} alt={item.qrCodeId} width={200} height={200} className="w-full h-full object-contain" />
                                        )}
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                             <Button 
                                                size="sm"
                                                disabled={isRegenerating || (item.status !== 'DONE' && item.status !== 'ERROR')}
                                                onClick={() => handleRegenerate(item.qrCodeId)}
                                                className="w-full"
                                             >
                                                {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                                                Regenerate
                                            </Button>
                                             <Button asChild size="sm" variant="secondary" className="w-full" disabled={item.status !== 'DONE'}>
                                                <Link href={`/retailer-mvp/qr-analytics/${item.qrCodeId}`}>
                                                    <BarChart2 className="mr-2 h-4 w-4"/>
                                                    View Scans
                                                </Link>
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
    const [processingIds, setProcessingIds] = useState<string[]>([]);

    const { toast } = useToast();
    
    useEffect(() => {
        if (!db) {
            toast({
                title: "Firebase Not Connected",
                description: "QR Campaign Dashboard requires a Firestore connection.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'bulkQrRequests'),
            where('retailerId', '==', 'simulated-retailer-id'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, snapshot => {
            const fetchedRequests: BulkRequest[] = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setRequests(fetchedRequests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching QR requests:", error);
            toast({ title: "Error", description: "Could not fetch campaign requests.", variant: "destructive"});
            setLoading(false);
        });
            
        return () => unsubscribe();
    }, [toast]);

    const handleDownloadZip = async (requestId: string) => {
        setDownloadingIds(prev => [...prev, requestId]);
        try {
            const result = await generateZipForRequest({ requestId });
            if (result.success && result.zipDataUri) {
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

    const processRequestInChunks = async (request: BulkRequest) => {
        if (!db) {
            toast({ title: 'Error', description: 'Firestore is not initialized.', variant: 'destructive'});
            return;
        }
        
        const requestRef = doc(db, 'bulkQrRequests', request.id);

        try {
            await updateDoc(requestRef, { status: 'PROCESSING', updatedAt: new Date() });

            let itemsDone = 0;
            while (itemsDone < request.totalRequested) {
                const batch = writeBatch(db);
                const itemsRef = collection(db, `bulkQrRequests/${requestRef.id}/items`);
                const qrcodesRef = collection(db, 'qrcodes');

                const currentChunkSize = Math.min(CHUNK_SIZE, request.totalRequested - itemsDone);
                
                for (let i = 0; i < currentChunkSize; i++) {
                    const qrCodeId = doc(collection(db, 'id_generator')).id;
                    const itemRef = doc(itemsRef, qrCodeId);
                    
                    const qrOptions = request.options || {};
                    const qrColor = (qrOptions.colorHex || '#000000').replace('#', '');
                    const qrBgColor = (qrOptions.bgColorHex || '#FFFFFF').replace('#', '');
                    const qrError = qrOptions.errorCorrection || 'M';

                    const trackingUrl = `${window.location.origin}/track/${qrCodeId}`;
                    const encodedQrData = encodeURIComponent(trackingUrl);
                    let generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodedQrData}&color=${qrColor}&bgcolor=${qrBgColor}&ecc=${qrError}`;
                    const storagePath = `qr/${request.retailerId}/${request.campaignId}/${qrCodeId}.png`;

                    const itemData = {
                        index: itemsDone + i,
                        qrCodeId: qrCodeId,
                        redirectUrl: `/product/1`,
                        trackingUrl: trackingUrl,
                        signedUrl: generatedQrUrl,
                        storagePath: storagePath,
                        status: 'DONE' as const,
                        checksum: '',
                    };
                    batch.set(itemRef, itemData);

                    const qrMasterRef = doc(db, 'qrcodes', qrCodeId);
                    batch.set(qrMasterRef, {
                        retailerId: request.retailerId,
                        campaignId: request.campaignId,
                        qrCodeId: qrCodeId,
                        requestId: request.id,
                        redirectUrl: `/product/1`,
                        trackingUrl: trackingUrl,
                        storagePath: storagePath,
                        signedUrl: generatedQrUrl,
                        scanCount: 0,
                        createdAt: new Date(),
                        expiresAt: request.options?.expiresAt ? new Date(request.options.expiresAt) : null,
                        aiProfileId: null,
                    });
                }
                
                await batch.commit();
                itemsDone += currentChunkSize;
                
                await updateDoc(requestRef, {
                    itemsDone: itemsDone,
                    updatedAt: new Date()
                });

                await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay
            }
            
            await updateDoc(requestRef, {
                status: 'COMPLETED',
                updatedAt: new Date()
            });

            toast({
                title: 'Campaign Processed!',
                description: `"${request.campaignId}" is now complete and ready for download.`,
            });
            
        } catch (error: any) {
             toast({
                title: "Processing Failed",
                description: error.message,
                variant: 'destructive',
            });
            await updateDoc(requestRef, { status: 'DRAFT' });
        }
    };

    const handleProcessJob = (request: BulkRequest) => {
        setProcessingIds(prev => [...prev, request.id]);
        processRequestInChunks(request).finally(() => {
             setProcessingIds(prev => prev.filter(id => id !== request.id));
        });
    };

    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
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
                                const progress = req.totalRequested > 0 ? ((req.itemsDone || 0) / req.totalRequested) * 100 : 0;
                                const isDownloading = downloadingIds.includes(req.id);
                                const isProcessing = processingIds.includes(req.id) || req.status === 'PROCESSING';
                                return (
                                    <Card key={req.id} className="flex flex-col sm:flex-row">
                                        <CardHeader className="flex-1">
                                            <CardTitle className="text-lg">{req.campaignId}</CardTitle>
                                            <CardDescription>
                                                {getDisplayDate(req.createdAt)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 flex-1 space-y-3">
                                            {req.status === 'DRAFT' ? (
                                                <div className="text-sm text-muted-foreground pt-3">
                                                    This campaign is a draft. Process it to generate QR codes.
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex justify-between text-sm font-medium mb-1">
                                                        <span>{req.status}</span>
                                                        <span>{req.itemsDone || 0} / {req.totalRequested}</span>
                                                    </div>
                                                    <Progress value={progress} />
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardContent className="pt-6 flex-none flex items-center gap-2">
                                            {req.status === 'DRAFT' ? (
                                                <Button variant="secondary" size="sm" onClick={() => handleProcessJob(req)} disabled={isProcessing}>
                                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                                                    Process Job
                                                </Button>
                                            ) : (
                                                <>
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
                                                </>
                                            )}
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
                            <CardTitle>Details for: {selectedRequest.campaignId}</CardTitle>
                            <CardDescription>
                                Manage AI content and view individual QR code statuses for this campaign.
                                {selectedRequest.status !== 'COMPLETED' && " Previews will update as they are generated."}
                            </CardDescription>
                        </div>
                         <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </CardHeader>
                    <CardContent>
                       <QrRequestDetails request={selectedRequest} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
