
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Loader2, Download, RefreshCw, X, Sparkles, AlertTriangle, BarChart2, CheckCircle2, ListChecks, Printer, MapPin, Scan, Info } from 'lucide-react';
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
    createdAt: Timestamp | Date;
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
    trackingUrl?: string;
    regeneratedAt?: { toDate: () => Date };
};

const getDisplayDate = (timestamp: any) => {
    if (!timestamp) return 'Date pending...';
    if (typeof timestamp.toDate === 'function') return new Date(timestamp.toDate()).toLocaleString();
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
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
            const result = await regenerateQrCode({ requestId: request.id, qrCodeId });
            if (result.success) {
                toast({ title: "QR Code Regenerated" });
            } else {
                 throw new Error('Regeneration failed.');
            }
        } catch (error: any) {
             toast({ title: "Regeneration Failed", description: error.message, variant: 'destructive' });
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
                link.download = `interact_${request.campaignId.replace(/\s+/g, '_')}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: "Download Started", description: "Your deployment package is ready." });
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
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-primary/20 bg-primary/5 shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Ready for Deployment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This digital activation batch is complete. Download the package and follow the checklist to go live.
                            </p>
                            <Button className="w-full h-12 font-black uppercase text-[10px] tracking-widest gap-2" onClick={handleDownloadZip} disabled={downloading}>
                                {downloading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4" />}
                                Download Deployment Package
                            </Button>
                            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-800 font-bold">
                                <Info className="h-3 w-3 shrink-0" />
                                <span>Remember: 100% of labels must be scanned before launch.</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-accent/20 bg-accent/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-accent-foreground">
                                <ListChecks className="h-4 w-4" />
                                Deployment Checklist
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             {[
                                { icon: <Printer />, text: "Print QR stickers (40x40mm ink/thermal)" },
                                { icon: <MapPin />, text: "Place labels on shelf-edge next to price" },
                                { icon: <Scan />, text: "Verify 100% of labels by scanning" },
                             ].map((step, i) => (
                                 <div key={i} className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                                     <div className="h-5 w-5 shrink-0 text-primary">{step.icon}</div>
                                     <span>{step.text}</span>
                                 </div>
                             ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            <Separator />
            
            <div className="flex justify-between items-center">
                 <h3 className="text-lg font-black uppercase tracking-tighter">Activation Previews</h3>
                <div className="w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="DONE">Verified</SelectItem>
                            <SelectItem value="ERROR">Failure</SelectItem>
                            <SelectItem value="PENDING">Processing</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
                </div>
            ) : filteredItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 italic text-sm">No activations match the current filter.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredItems.map(item => (
                        <Card key={item.qrCodeId} className="group relative overflow-hidden">
                            <CardContent className="p-1">
                                 <div className="aspect-square relative rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                    {item.status === 'PENDING' ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
                                    ) : item.status === 'ERROR' ? (
                                         <div className="text-center text-destructive p-2"><AlertTriangle className="h-6 w-6 mx-auto" /></div>
                                    ) : (
                                        <Image src={item.signedUrl} alt={item.qrCodeId} width={150} height={150} className="w-full h-full object-contain" />
                                    )}
                                    <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                         <Button variant="secondary" size="sm" onClick={() => handleRegenerate(item.qrCodeId)} className="w-full text-[8px] font-black uppercase tracking-widest h-8">
                                            <RefreshCw className="h-3 w-3 mr-1" /> Fix Code
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                             <div className="p-2 border-t bg-muted/10">
                                <p className="text-[8px] font-mono text-muted-foreground truncate">{item.qrCodeId}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
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
            fetched.sort((a, b) => {
                const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                return dateB - dateA;
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
                const itemsRef = collection(db, `bulkQrRequests/${requestRef.id}/items`);
                const currentChunkSize = Math.min(CHUNK_SIZE, request.totalRequested - itemsDone);
                for (let i = 0; i < currentChunkSize; i++) {
                    const qrCodeId = doc(collection(db, 'id_generator')).id;
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
                    batch.set(doc(itemsRef, qrCodeId), itemData);
                    batch.set(doc(db, 'qrcodes', qrCodeId), {
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
            toast({ title: 'Batch Verified', description: `Activations for "${request.productName}" are ready.` });
        } catch (e: any) {
            toast({ title: "Process Failed", description: e.message, variant: 'destructive' });
            await updateDoc(requestRef, { status: 'DRAFT' });
        }
    };

    if (loading) return <Card className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary opacity-20 h-10 w-10"/></Card>;

    return (
        <div className="space-y-6">
            <Card className="border-primary/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-black uppercase tracking-tighter">Activation History</CardTitle>
                    <CardDescription>Monitor and manage your digital activation requests.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No activation history found.</p>
                        </div>
                    ) : requests.map(req => {
                        const progress = req.totalRequested > 0 ? ((req.itemsDone || 0) / req.totalRequested) * 100 : 0;
                        const isProcessing = processingIds.includes(req.id) || req.status === 'PROCESSING';
                        const isSelected = selectedRequest?.id === req.id;
                        
                        const canProcess = req.status === 'DRAFT' || (req.status === 'PROCESSING' && !isProcessing);

                        return (
                            <Card key={req.id} className={cn("transition-all duration-300", isSelected ? "border-primary ring-2 ring-primary/10" : "hover:border-primary/30")}>
                                <div className="flex flex-col sm:flex-row p-6 items-center gap-6">
                                    <div className="flex-1 min-w-0">
                                        <Badge variant="outline" className="mb-2 text-[8px] font-black uppercase tracking-tighter opacity-50">{req.campaignId}</Badge>
                                        <h4 className="text-lg font-black tracking-tight truncate">{req.productName || 'Unnamed Product'}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{getDisplayDate(req.createdAt)}</p>
                                    </div>
                                    <div className="w-full sm:w-48 space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase">
                                            <span className={cn(req.status === 'COMPLETED' ? "text-green-600" : "text-primary")}>{req.status}</span>
                                            <span>{req.itemsDone || 0} / {req.totalRequested}</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {canProcess ? (
                                            <Button variant="default" size="sm" onClick={() => { setProcessingIds(p => [...p, req.id]); processRequestInChunks(req).finally(() => setProcessingIds(p => p.filter(id => id !== req.id))); }} disabled={isProcessing} className="h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-md">
                                                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>}
                                                {req.status === 'PROCESSING' ? 'Resume Activation' : 'Process Activation'}
                                            </Button>
                                        ) : (
                                            <Button variant={isSelected ? "secondary" : "outline"} size="sm" onClick={() => setSelectedRequest(isSelected ? null : req)} className="h-10 px-6 font-black uppercase text-[10px] tracking-widest">
                                                <Eye className="h-3.5 w-3.5 mr-2" /> {isSelected ? 'Close' : 'Manage'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="px-6 pb-6 pt-0 border-t bg-muted/5">
                                        <div className="pt-6"><QrRequestDetails request={req} /></div>
                                    </div>
                                )}
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
