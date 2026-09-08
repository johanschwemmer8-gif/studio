'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Loader2, Download, RefreshCw, X, Sparkles, AlertTriangle, BarChart2, CheckCircle2, ListChecks, Printer, MapPin, Scan, Info, Target, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { generateZipForRequest } from '@/ai/flows/generate-zip-for-request';
import { regenerateQrCode } from '@/ai/flows/regenerate-qr-code';
import { type GenerateCampaignAIOutput } from '@/ai/flows/generate-campaign-ai';
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
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

type BulkRequest = {
    id: string;
    campaignId: string;
    productName?: string;
    totalRequested: number;
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DRAFT';
    createdAt: any;
    itemsDone: number;
    aiStatus?: 'PENDING' | 'READY' | 'ERROR';
    aiOutputs?: GenerateCampaignAIOutput;
    aiError?: string;
    retailerId?: string;
    options?: any;
    target?: any;
    location?: string;
    storeName?: string;
};

type QrItem = {
    qrCodeId: string;
    redirectUrl: string;
    status: 'PENDING' | 'DONE' | 'ERROR';
    signedUrl: string;
    trackingUrl?: string;
    regeneratedAt?: any;
};

const getDisplayDate = (timestamp: any) => {
    if (!timestamp) return 'Date pending...';
    try {
        if (typeof timestamp.toDate === 'function') return new Date(timestamp.toDate()).toLocaleString();
        if (timestamp instanceof Date) return timestamp.toLocaleString();
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) {
        return 'Format Error';
    }
};

const CHUNK_SIZE = 50;

function QrRequestDetails({ request }: { request: BulkRequest }) {
    const { user } = useAuth();
    const [items, setItems] = useState<QrItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
    const [downloading, setDownloading] = useState(false);
    const { toast } = useToast();
    
    const [currentRequest, setCurrentRequest] = useState(request);

    useEffect(() => {
        if (!db) return;
        setLoading(true);
        const itemsQuery = query(collection(db, `bulkQrRequests/${request.id}/items`));
        const unsubscribeItems = onSnapshot(itemsQuery, snapshot => {
            const fetchedItems: QrItem[] = snapshot.docs.map((doc: any) => ({
                qrCodeId: doc.id,
                ...doc.data(),
            }));
            setItems(fetchedItems);
            setLoading(false);
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
    }, [request.id]);

    const handleRegenerate = async (qrCodeId: string) => {
        setRegeneratingIds(prev => [...prev, qrCodeId]);
        try {
            const idToken = await user?.getIdToken();

            if (!idToken || !user?.retailerId) {
                throw new Error('Authentication context missing.');
            }

            const result = await regenerateQrCode({
                requestId: request.id,
                qrCodeId,
                idToken,
                retailerId: user.retailerId,
            });
            if (result.success) {
                toast({ title: "QR Identity Fixed" });
            } else {
                 throw new Error('Fix failed.');
            }
        } catch (error: any) {
             toast({ title: "Fix Failed", description: error.message, variant: 'destructive' });
        } finally {
            setRegeneratingIds(prev => prev.filter(id => id !== qrCodeId));
        }
    }

    const handleDownloadZip = async () => {
        setDownloading(true);
        try {
            const idToken = await user?.getIdToken();
            const result = await generateZipForRequest({ requestId: request.id, idToken });
            if (result.success && result.zipDataUri) {
                const link = document.createElement("a");
                link.href = result.zipDataUri;
                link.download = `interact_activation_${request.id.substring(0,6)}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: "Download Started", description: "Deployment package ready." });
            } else {
                throw new Error(result.message || 'ZIP failed.');
            }
        } catch (error: any) {
             toast({ title: "Download Failed", description: error.message, variant: 'destructive' });
        } finally {
            setDownloading(false);
        }
    };

    const filteredItems = items.filter(item => statusFilter === 'ALL' || item.status === statusFilter);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {currentRequest.status === 'COMPLETED' && (
                <Card className="border-primary/20 bg-primary/5 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Activation Ready
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Digital identity</p>
                                <p className="text-xs font-bold font-mono">{items[0]?.qrCodeId || '...'}</p>
                            </div>
                            <Button className="h-10 font-black uppercase text-[10px] tracking-widest gap-2" onClick={handleDownloadZip} disabled={downloading}>
                                {downloading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4" />}
                                Download Package
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                    <Card key={item.qrCodeId} className="group relative overflow-hidden bg-background border-primary/5">
                        <CardContent className="p-2">
                                <div className="aspect-square relative rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                {item.status === 'PENDING' ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
                                ) : item.status === 'ERROR' ? (
                                        <div className="text-center text-destructive p-2"><AlertTriangle className="h-6 w-6 mx-auto" /></div>
                                ) : (
                                    <Image src={item.signedUrl} alt={item.qrCodeId} width={150} height={150} className="w-full h-full object-contain" />
                                )}
                                <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                        <Button variant="secondary" size="sm" onClick={() => handleRegenerate(item.qrCodeId)} className="w-full text-[8px] font-black uppercase tracking-widest h-8">
                                        <RefreshCw className="h-3 w-3 mr-1" /> Fix Identity
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function QrCampaignDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<BulkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<BulkRequest | null>(null);
    const [processingIds, setProcessingIds] = useState<string[]>([]);
    const { toast } = useToast();
    
    useEffect(() => {
        if (!db || !user?.retailerId) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'bulkQrRequests'), where('retailerId', '==', user.retailerId));
        const unsubscribe = onSnapshot(q, snapshot => {
            const fetched = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            
            // Safer sort function that handles both Dates and Timestamps
            fetched.sort((a, b) => {
                const getTime = (val: any) => {
                    if (val instanceof Timestamp) return val.toDate().getTime();
                    if (val instanceof Date) return val.getTime();
                    if (typeof val === 'string') return new Date(val).getTime();
                    if (val?.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
                    return 0;
                };
                return getTime(b.createdAt) - getTime(a.createdAt);
            });
            
            setRequests(fetched);
            setLoading(false);
        });
            
        return () => unsubscribe();
    }, [user?.retailerId]);

    const processRequestInChunks = async (request: BulkRequest) => {
        if (!db) return;
        const requestRef = doc(db, 'bulkQrRequests', request.id);
        try {
            await updateDoc(requestRef, { status: 'PROCESSING', updatedAt: new Date() });
            let itemsDone = 0;
            while (itemsDone < request.totalRequested) {
                const batch = writeBatch(db);
                const itemsRef = collection(db, `bulkQrRequests/${request.id}/items`);
                const currentChunkSize = Math.min(CHUNK_SIZE, request.totalRequested - itemsDone);
                
                // For client-side generation using modular SDK
                const { doc: firestoreDoc, collection: firestoreCollection } = await import('firebase/firestore');

                for (let i = 0; i < currentChunkSize; i++) {
                    const qrCodeId = firestoreDoc(firestoreCollection(db, 'id_generator')).id;
                    const qrOptions = request.options || {};
                    const qrColor = (qrOptions.colorHex || '#000000').replace('#', '');
                    const qrBgColor = (qrOptions.bgColorHex || '#FFFFFF').replace('#', '');
                    const trackingUrl = `${window.location.origin}/resolve/${qrCodeId}`;
                    const itemData = {
                        index: itemsDone + i,
                        qrCodeId,
                        trackingUrl,
                        signedUrl: `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(trackingUrl)}&color=${qrColor}&bgcolor=${qrBgColor}&ecc=${qrOptions.errorCorrection || 'M'}`,
                        status: 'DONE',
                    };
                    batch.set(firestoreDoc(itemsRef, qrCodeId), itemData);
                    batch.set(firestoreDoc(db, 'qrcodes', qrCodeId), {
                        retailerId: request.retailerId,
                        campaignId: request.campaignId,
                        qrCodeId,
                        requestId: request.id,
                        gtin: qrOptions.gtin,
                        trackingUrl,
                        scanCount: 0,
                        createdAt: new Date(),
                    });
                }
                await batch.commit();
                itemsDone += currentChunkSize;
                await updateDoc(requestRef, { itemsDone, updatedAt: new Date() });
            }
            await updateDoc(requestRef, { status: 'COMPLETED' });
            toast({ title: 'Activation Pipeline Complete', description: `Identity established for "${request.productName || 'Shelf'}".` });
        } catch (e: any) {
            toast({ title: "Pipeline Failed", description: e.message, variant: 'destructive' });
            await updateDoc(requestRef, { status: 'DRAFT' });
        }
    };

    if (loading) return <Card className="p-10 flex justify-center border-none shadow-none"><Loader2 className="animate-spin text-primary opacity-20 h-10 w-10"/></Card>;

    return (
        <div className="space-y-4">
            {requests.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No history recorded.</p>
                </div>
            ) : requests.map(req => {
                const progress = req.totalRequested > 0 ? ((req.itemsDone || 0) / req.totalRequested) * 100 : 0;
                const isProcessing = processingIds.includes(req.id) || req.status === 'PROCESSING';
                const isSelected = selectedRequest?.id === req.id;
                
                const canProcess = req.status === 'DRAFT' || (req.status === 'PROCESSING' && !isProcessing);

                return (
                    <Card key={req.id} className={cn("transition-all duration-300", isSelected ? "border-primary ring-1 ring-primary/10" : "hover:border-primary/30")}>
                        <div className="flex flex-col sm:flex-row p-5 items-center gap-6">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-tighter bg-muted/50">{req.campaignId || 'Default Campaign'}</Badge>
                                    <Badge className={cn("text-[8px] font-black uppercase", req.status === 'COMPLETED' ? "bg-green-500" : "bg-primary")}>{req.status}</Badge>
                                </div>
                                <h4 className="text-base font-black tracking-tight truncate flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                    {req.storeName ? `${req.storeName} — ` : ''}{req.location || 'Unknown Point of Decision'}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1"><Target className="h-3 w-3" /> {req.productName || 'Category Activation'}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold border-l pl-3">{getDisplayDate(req.createdAt)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                                {canProcess ? (
                                    <Button variant="default" size="sm" onClick={() => { setProcessingIds(p => [...p, req.id]); processRequestInChunks(req).finally(() => setProcessingIds(p => p.filter(id => id !== req.id))); }} disabled={isProcessing} className="h-9 px-6 font-black uppercase text-[10px] tracking-widest">
                                        {isProcessing ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>}
                                        {req.status === 'PROCESSING' ? 'Resume' : 'Activate'}
                                    </Button>
                                ) : (
                                    <Button variant={isSelected ? "secondary" : "outline"} size="sm" onClick={() => setSelectedRequest(isSelected ? null : req)} className="h-9 px-6 font-black uppercase text-[10px] tracking-widest">
                                        <Eye className="h-3.5 w-3.5 mr-2" /> {isSelected ? 'Close' : 'Details'}
                                    </Button>
                                )}
                            </div>
                        </div>
                        {isSelected && (
                            <div className="px-5 pb-5 pt-0 border-t bg-muted/5 animate-in fade-in slide-in-from-top-2">
                                <div className="pt-5"><QrRequestDetails request={req} /></div>
                            </div>
                        )}
                    </Card>
                )
            })}
        </div>
    );
}
