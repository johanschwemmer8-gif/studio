
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
    const [selectedRequest, setSelectedRequest] = useState<BulkRequest | null>(null);
    const [qrItems, setQrItems] = useState<QrItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
    const { toast } = useToast();
    const firestore = mockDb;
    
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

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">QR Code Management</h2>
                <p className="text-muted-foreground max-w-3xl">Create, monitor, and download bulk QR code campaigns.</p>
            </div>
            <Separator />
             <div className="lg:col-span-2 space-y-4">
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
    );
}
