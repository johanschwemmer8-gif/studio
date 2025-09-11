
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertTriangle, RefreshCw, Download, Eye } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { regenerateQrCode } from '@/ai/flows/regenerate-qr-code';

// Mock Firestore client for item view
const createMockDb = () => {
    return {
        collection: (name: string) => ({
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

type QrItem = {
    qrCodeId: string;
    status: 'PENDING' | 'DONE' | 'ERROR';
    signedUrl: string;
    error?: string;
    retryCount: number;
    regeneratedAt?: { toDate: () => Date };
};

type QrRequestItemAdminViewProps = {
    requestId: string;
    onBack: () => void;
};

export default function QrRequestItemAdminView({ requestId, onBack }: QrRequestItemAdminViewProps) {
    const [items, setItems] = useState<QrItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
    const { toast } = useToast();
    const firestore = createMockDb();

    useEffect(() => {
        if (!requestId) {
            setLoading(false);
            return;
        };
        setLoading(true);
        const unsubscribe = firestore.collection('bulkQrRequests').doc(requestId).collection('items').onSnapshot(snapshot => {
            const fetchedItems: QrItem[] = snapshot.docs.map((doc: any) => ({
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
    };
    
    return (
         <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <CardTitle>Items for Request</CardTitle>
                        <CardDescription className="font-mono">{requestId}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                        {requestId === 'test-request-id' 
                            ? 'This is a placeholder. Select a real request to see items.'
                            : 'No items found for this request.'
                        }
                    </p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {items.map(item => {
                            const isRegenerating = regeneratingIds.includes(item.qrCodeId);
                            return (
                                <Card key={item.qrCodeId} className="flex flex-col group">
                                    <CardContent className="p-2 flex-1">
                                        <div className="aspect-square relative rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                            {item.status === 'PENDING' ? (
                                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            ) : item.status === 'ERROR' ? (
                                                 <div className="text-center text-destructive p-2">
                                                    <AlertTriangle className="h-8 w-8 mx-auto" />
                                                    <p className="text-xs mt-2 font-semibold">Failed</p>
                                                    <p className="text-xs text-destructive/70 truncate">{item.error}</p>
                                                 </div>
                                            ) : (
                                                <Image src={item.signedUrl} alt={item.qrCodeId} width={200} height={200} className="w-full h-full object-contain" />
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-2 flex-col items-start text-xs space-y-1">
                                        <div className="flex justify-between w-full">
                                            <Badge variant={item.status === 'DONE' ? 'default' : item.status === 'ERROR' ? 'destructive' : 'secondary'} className="capitalize">
                                                {item.status.toLowerCase()}
                                            </Badge>
                                            <p className="text-muted-foreground">Retries: {item.retryCount || 0}</p>
                                        </div>
                                        <p className="font-mono text-muted-foreground truncate w-full">{item.qrCodeId}</p>
                                        {item.regeneratedAt && <p className="text-blue-500">Regen: {new Date(item.regeneratedAt.toDate()).toLocaleTimeString()}</p>}
                                        <div className="w-full space-y-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="w-full h-8"
                                                disabled={isRegenerating}
                                                onClick={() => handleRegenerate(item.qrCodeId)}
                                            >
                                                {isRegenerating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                                                <span className="ml-2">Regenerate</span>
                                            </Button>
                                             <Button asChild size="sm" variant="secondary" className="w-full h-8" disabled={item.status !== 'DONE'}>
                                                <a href={item.signedUrl} target="_blank" rel="noopener noreferrer">
                                                    <Download /><span className="ml-2">Download</span>
                                                </a>
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
