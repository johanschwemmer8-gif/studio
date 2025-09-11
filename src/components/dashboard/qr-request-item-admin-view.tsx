
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

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
    redirectUrl: string;
    status: 'PENDING' | 'DONE' | 'ERROR';
    signedUrl: string;
};

type QrRequestItemAdminViewProps = {
    requestId: string;
    onBack: () => void;
};

export default function QrRequestItemAdminView({ requestId, onBack }: QrRequestItemAdminViewProps) {
    const [items, setItems] = useState<QrItem[]>([]);
    const [loading, setLoading] = useState(true);
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
                    <p className="text-muted-foreground text-center py-8">No items found for this request.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {items.map(item => (
                            <Card key={item.qrCodeId} className="flex flex-col">
                                <CardContent className="p-2 flex-1">
                                    <div className="aspect-square relative rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                        {item.status === 'PENDING' ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        ) : item.status === 'ERROR' ? (
                                             <div className="text-center text-destructive p-2">
                                                <AlertTriangle className="h-8 w-8 mx-auto" />
                                                <p className="text-xs mt-2">Failed</p>
                                             </div>
                                        ) : (
                                            <Image src={item.signedUrl} alt={item.qrCodeId} width={200} height={200} className="w-full h-full object-contain" />
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-2 flex-col items-start text-xs">
                                    <Badge variant={item.status === 'DONE' ? 'default' : item.status === 'ERROR' ? 'destructive' : 'secondary'} className="mb-1 capitalize">
                                        {item.status.toLowerCase()}
                                    </Badge>
                                    <p className="font-mono text-muted-foreground truncate w-full">{item.qrCodeId}</p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
